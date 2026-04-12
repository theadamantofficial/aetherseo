"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { ReactNode } from "react";
import AetherBrand from "@/components/aether-brand";
import MobileHeaderToggle from "@/components/mobile-header-toggle";
import SiteLoader from "@/components/site-loader";
import SitePreferences from "@/components/site-preferences";
import { useLanguage } from "@/components/language-provider";
import { auth } from "@/lib/firebase";
import type { BillingPlan, UserProfile } from "@/lib/firebase-data";
import { getUserProfile } from "@/lib/firebase-data";
import { shellCopy } from "@/lib/site-language";

type NavItem = {
  key: keyof typeof shellCopy.en.nav;
  href: string;
};

type SearchEntry = {
  href: string;
  key: NavItem["key"];
  keywords: string[];
};

const baseNavItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard" },
  { key: "analytics", href: "/analytics" },
  { key: "aiAssistant", href: "/ai-assistant" },
  { key: "generateBlog", href: "/generate-blog" },
  { key: "websiteAudit", href: "/website-audit" },
  { key: "history", href: "/history" },
  { key: "billing", href: "/billing" },
  { key: "settings", href: "/settings" },
];

const searchEntries: SearchEntry[] = [
  { href: "/dashboard", key: "dashboard", keywords: ["home", "overview", "workspace"] },
  { href: "/analytics", key: "analytics", keywords: ["metrics", "performance", "reports"] },
  { href: "/ai-assistant", key: "aiAssistant", keywords: ["assistant", "seo", "brief", "metadata"] },
  { href: "/generate-blog", key: "generateBlog", keywords: ["blog", "draft", "content", "writer"] },
  { href: "/website-audit", key: "websiteAudit", keywords: ["audit", "technical", "score", "domain"] },
  { href: "/history", key: "history", keywords: ["archive", "activity", "timeline"] },
  { href: "/billing", key: "billing", keywords: ["plan", "subscription", "pricing"] },
  { href: "/settings", key: "settings", keywords: ["account", "profile", "preferences"] },
];

const preferredShellCopy = {
  de: {
    nav: {
      dashboard: "Dashboard",
      analytics: "Analysen",
      aiAssistant: "KI-Assistent",
      generateBlog: "Blog erstellen",
      websiteAudit: "Website-Audit",
      history: "Verlauf",
      billing: "Abrechnung",
      settings: "Einstellungen",
    },
    loading: "Workspace wird geladen...",
    premiumWorkspace: "Premium-Workspace",
    starterWorkspace: "Starter-Workspace",
    paidWorkspace: "Bezahlter Workspace",
    searchPlaceholder: "Analysen, Inhalte und Aktionen durchsuchen...",
    alerts: "Hinweise",
    billingSettings: "Abrechnung",
    upgradeToPro: "Auf Pro upgraden",
    quickSearch: "Schnellsuche",
    newAction: "Neue Aktion",
    aiAssistant: "KI-Assistent",
    signOut: "Abmelden",
    footer: "Aether SEO. Alle Rechte vorbehalten.",
  },
  ja: {
    nav: {
      dashboard: "ダッシュボード",
      analytics: "分析",
      aiAssistant: "AIアシスタント",
      generateBlog: "ブログ生成",
      websiteAudit: "サイト監査",
      history: "履歴",
      billing: "課金",
      settings: "設定",
    },
    loading: "ワークスペースを読み込み中...",
    premiumWorkspace: "プレミアムワークスペース",
    starterWorkspace: "スターターワークスペース",
    paidWorkspace: "有料ワークスペース",
    searchPlaceholder: "分析、投稿、操作を検索...",
    alerts: "通知",
    billingSettings: "請求設定",
    upgradeToPro: "Proにアップグレード",
    quickSearch: "クイック検索",
    newAction: "新しい操作",
    aiAssistant: "AIアシスタント",
    signOut: "サインアウト",
    footer: "Aether SEO. All rights reserved.",
  },
  ko: {
    nav: {
      dashboard: "대시보드",
      analytics: "분석",
      aiAssistant: "AI 도우미",
      generateBlog: "블로그 생성",
      websiteAudit: "웹사이트 감사",
      history: "기록",
      billing: "결제",
      settings: "설정",
    },
    loading: "워크스페이스를 불러오는 중...",
    premiumWorkspace: "프리미엄 워크스페이스",
    starterWorkspace: "스타터 워크스페이스",
    paidWorkspace: "유료 워크스페이스",
    searchPlaceholder: "분석, 글, 작업 검색...",
    alerts: "알림",
    billingSettings: "결제 설정",
    upgradeToPro: "Pro로 업그레이드",
    quickSearch: "빠른 검색",
    newAction: "새 작업",
    aiAssistant: "AI 도우미",
    signOut: "로그아웃",
    footer: "Aether SEO. All rights reserved.",
  },
} as const;

const signOutLabelByLanguage: Record<string, string> = {
  en: "Sign out",
  es: "Cerrar sesion",
  fr: "Se deconnecter",
  hi: "Sign out",
  de: "Abmelden",
  ja: "サインアウト",
  ko: "로그아웃",
};

/**
 * Render a consistent app shell for all logged-in pages.
 * @param props - Shell children rendered in the main panel.
 * @returns Layout with sidebar, top bar and bottom command bar.
 */
export default function AetherShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, uiLanguage } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [billingPlan, setBillingPlan] = useState<BillingPlan | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const copy =
    language === "de" || language === "ja" || language === "ko"
      ? preferredShellCopy[language]
      : shellCopy[uiLanguage];
  const signOutLabel =
    "signOut" in copy ? copy.signOut : signOutLabelByLanguage[uiLanguage] ?? "Sign out";
  const canUseAssistant = billingPlan === "paid";
  const navItems = useMemo(
    () => baseNavItems.filter((item) => canUseAssistant || item.key !== "aiAssistant"),
    [canUseAssistant],
  );
  const availableSearchEntries = useMemo(
    () => searchEntries.filter((entry) => canUseAssistant || entry.key !== "aiAssistant"),
    [canUseAssistant],
  );
  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return availableSearchEntries
      .filter((entry) => {
        if (!query) {
          return true;
        }

        const label = copy.nav[entry.key].toLowerCase();
        return (
          label.includes(query) ||
          entry.href.includes(query) ||
          entry.key.toLowerCase().includes(query) ||
          entry.keywords.some((keyword) => keyword.includes(query))
        );
      })
      .slice(0, 6);
  }, [availableSearchEntries, copy.nav, searchTerm]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setIsReady(true);
        router.replace("/auth");
        return;
      }

      try {
        const data = await getUserProfile(nextUser.uid);
        setProfile(data);
        setBillingPlan(data.plan);
      } catch {
        router.replace("/auth");
      } finally {
        setIsReady(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  function focusSearch() {
    setIsSearchOpen(true);
    searchInputRef.current?.focus();
  }

  function openSearchResult(href: string) {
    setSearchTerm("");
    setIsSearchOpen(false);
    router.push(href);
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } finally {
      router.replace("/auth");
    }
  }

  if (!isReady) {
    return <SiteLoader size="full" />;
  }

  return (
    <div className="site-page min-h-screen supports-[height:100dvh]:min-h-dvh">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] supports-[height:100dvh]:min-h-dvh">
        <aside className="hidden w-60 border-r border-[var(--site-border)] bg-[var(--site-surface)] lg:flex lg:flex-col">
          <div className="px-5 pt-5 pb-4">
            <AetherBrand
              href="/dashboard"
              className="rounded-[1.2rem] px-0 py-0 hover:opacity-100"
              priority
              titleClassName="text-sm tracking-[-0.02em] sm:text-sm md:text-sm"
              subtitleClassName="text-[10px] tracking-[0.18em] sm:text-[10px]"
              logoClassName="h-10 w-10 sm:h-10 sm:w-10"
            />
          </div>

          <nav className="flex-1 space-y-0.5 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--site-primary)] text-white"
                      : "text-[var(--site-muted)] hover:bg-[var(--site-surface-soft)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {copy.nav[item.key]}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[var(--site-border)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--site-primary)] text-[11px] font-bold text-white">
                {(profile?.displayName || "YA").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{profile?.displayName || profile?.email || ""}</p>
                <p className="site-muted truncate text-[11px]">{billingPlan === "paid" ? "Pro" : "Free"}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative border-b border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-3 lg:hidden">
                <AetherBrand
                  href="/dashboard"
                  className="flex-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                  priority
                />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((current) => !current)}
                  className="site-button-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="app-mobile-menu"
                  aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
                >
                  <MobileHeaderToggle isOpen={isMobileMenuOpen} />
                </button>
              </div>

              <div
                className="relative w-full lg:max-w-sm"
                onFocus={() => setIsSearchOpen(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsSearchOpen(false);
                  }
                }}
              >
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (searchResults[0]) {
                      openSearchResult(searchResults[0].href);
                    }
                  }}
                >
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setIsSearchOpen(true);
                    }}
                    placeholder={copy.searchPlaceholder}
                    className="site-input w-full rounded-lg px-3 py-1.5 text-sm outline-none"
                  />
                </form>
                {isSearchOpen ? (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)] p-1 shadow-[var(--site-depth-shadow)]">
                    {searchResults.length ? (
                      searchResults.map((entry) => {
                        const isActive = pathname === entry.href;

                        return (
                          <button
                            key={entry.href}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              openSearchResult(entry.href);
                            }}
                            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                              isActive
                                ? "bg-[var(--site-primary)] text-white"
                                : "text-[var(--foreground)] hover:bg-[var(--site-surface-soft)]"
                            }`}
                          >
                            <span>{copy.nav[entry.key]}</span>
                            <span className="site-muted text-xs">{entry.href}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="site-muted px-2.5 py-1.5 text-sm">
                        No matches found.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                <SitePreferences />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="site-button-secondary rounded-lg px-3 py-1.5 text-sm font-medium"
                >
                  {signOutLabel}
                </button>
              </div>
            </div>

            {isMobileMenuOpen ? (
              <div
                id="app-mobile-menu"
                className="site-mobile-menu absolute inset-x-4 top-[calc(100%+0.55rem)] z-30 rounded-[1.35rem] px-3 py-3 lg:hidden"
              >
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-[0.95rem] px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-[var(--site-primary)] text-white"
                            : "site-mobile-menu-link"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {copy.nav[item.key]}
                      </Link>
                    );
                  })}
                </nav>
                <SitePreferences className="mt-3 w-full grid-cols-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    void handleSignOut();
                  }}
                  className="site-button-secondary mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[1rem] px-4 py-2.5 text-sm font-medium"
                >
                  {signOutLabel}
                </button>
              </div>
            ) : null}
          </header>

          <main className="min-w-0 flex-1 bg-[var(--background)] px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-[1100px]">{children}</div>
          </main>

          <footer className="border-t border-[var(--site-border)] px-4 py-4 md:px-8">
            <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <span className="site-muted">© 2026 The Adamant</span>
                <Link href={`/${uiLanguage}/privacy-policy`} className="site-muted hover:text-[var(--foreground)]">Privacy Policy</Link>
                <Link href={`/${uiLanguage}/terms-of-service`} className="site-muted hover:text-[var(--foreground)]">Terms of Service</Link>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={focusSearch}
                  className="site-button-secondary rounded-lg px-2.5 py-1 text-xs font-medium"
                >
                  {copy.quickSearch}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/generate-blog")}
                  className="site-button-primary rounded-lg px-2.5 py-1 text-xs font-medium"
                >
                  {copy.newAction}
                </button>
                {canUseAssistant ? (
                  <Link href="/ai-assistant" className="site-button-secondary rounded-lg px-2.5 py-1 text-xs font-medium">
                    {copy.aiAssistant}
                  </Link>
                ) : (
                  <Link href="/billing?upgrade=assistant-locked" className="site-button-secondary rounded-lg px-2.5 py-1 text-xs font-medium">
                    {copy.upgradeToPro}
                  </Link>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

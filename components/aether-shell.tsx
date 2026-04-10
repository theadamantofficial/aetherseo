"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { ReactNode } from "react";
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
    if (
      !profile ||
      profile.plan !== "paid" ||
      !profile.paidPlanTier ||
      typeof window === "undefined"
    ) {
      return;
    }

    const notificationKey = `aether-plan-notified:${profile.uid}:${profile.paidPlanTier}`;
    if (window.sessionStorage.getItem(notificationKey)) {
      return;
    }

    window.sessionStorage.setItem(notificationKey, "pending");

    void fetch("/api/plan-purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: profile.uid,
        email: profile.email,
        phone: profile.phone,
        paidPlanTier: profile.paidPlanTier,
      }),
    })
      .then(() => {
        window.sessionStorage.setItem(notificationKey, "sent");
      })
      .catch(() => {
        window.sessionStorage.removeItem(notificationKey);
      });
  }, [profile]);

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
    return (
      <div className="site-page flex min-h-screen items-center justify-center text-sm">
        {copy.loading}
      </div>
    );
  }

  return (
    <div className="site-page min-h-screen text-[#e9eeff]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="site-panel hidden w-64 border-r p-5 lg:flex lg:flex-col">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/aether-logo-mark.png"
                alt="Aether SEO"
                width={52}
                height={52}
                priority
                className="h-13 w-13 rounded-full object-cover"
              />
              <div>
                <h1 className="text-xl font-semibold tracking-[-0.03em]">Aether SEO</h1>
                <p className="site-muted text-[11px] uppercase tracking-[0.22em]">
                  AI MEETS SEO
                </p>
              </div>
            </div>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm transition ${
                    isActive
                      ? "site-button-primary text-white shadow-[0_0_0_1px_rgba(108,91,255,0.35)]"
                      : "site-muted hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {copy.nav[item.key]}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="site-header-shell flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:h-16 md:flex-nowrap md:px-8">
            <div
              className="relative order-2 w-full max-w-full md:order-1 md:max-w-sm"
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
                  className="site-panel-soft w-full rounded-full px-4 py-2 text-sm outline-none"
                />
              </form>
              {isSearchOpen ? (
                <div className="site-panel absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border p-2 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
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
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            isActive ? "site-button-primary text-white" : "hover:bg-white/5"
                          }`}
                        >
                          <span>{copy.nav[entry.key]}</span>
                          <span className="site-muted text-xs">{entry.href}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="site-muted rounded-xl px-3 py-2 text-sm">
                      No matches found.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="order-1 ml-0 flex w-full flex-wrap items-center justify-end gap-3 md:order-2 md:ml-4 md:w-auto md:flex-nowrap md:gap-4">
              <SitePreferences />
              <span className="site-muted text-sm">{copy.alerts}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="site-button-secondary rounded-full px-4 py-2 text-sm font-medium"
              >
                {signOutLabel}
              </button>
              <div className="site-panel-soft flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold">
                {(profile?.displayName || "YA").slice(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          <main className="site-page min-w-0 flex-1 p-4 md:p-8">{children}</main>

          <footer className="site-panel border-t px-6 py-8 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p>© 2026 TheAdamant</p>
                <p className="site-muted mt-1">All rights reserved.</p>
              </div>
              <div className="flex items-center gap-6">
                <Link href={`/${uiLanguage}/privacy-policy`}>Privacy Policy</Link>
                <Link href={`/${uiLanguage}/terms-of-service`}>Terms of Service</Link>
              </div>
            </div>
            <div className="site-panel-soft mx-auto mt-6 flex w-full max-w-md items-center justify-center gap-3 rounded-full border px-4 py-2 text-sm">
              <button
                type="button"
                onClick={focusSearch}
                className="site-button-secondary rounded-full px-3 py-1"
              >
                {copy.quickSearch}
              </button>
              <button
                type="button"
                onClick={() => router.push("/generate-blog")}
                className="site-button-primary rounded-full px-3 py-1 font-medium"
              >
                {copy.newAction}
              </button>
              {canUseAssistant ? (
                <Link href="/ai-assistant" className="site-button-secondary rounded-full px-3 py-1">
                  {copy.aiAssistant}
                </Link>
              ) : (
                <Link href="/billing?upgrade=assistant-locked" className="site-button-secondary rounded-full px-3 py-1">
                  {copy.upgradeToPro}
                </Link>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import ThemeToggle from "@/components/theme-toggle";
import { auth } from "@/lib/firebase";
import type { BillingPlan, UserProfile } from "@/lib/firebase-data";
import { getUserProfile } from "@/lib/firebase-data";
import { shellCopy } from "@/lib/site-language";

type NavItem = {
  key: keyof typeof shellCopy.en.nav;
  href: string;
};

const baseNavItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard" },
  { key: "analytics", href: "/analytics" },
  { key: "generateBlog", href: "/generate-blog" },
  { key: "websiteAudit", href: "/website-audit" },
  { key: "history", href: "/history" },
  { key: "billing", href: "/billing" },
  { key: "settings", href: "/settings" },
];

/**
 * Render a consistent app shell for all logged-in pages.
 * @param props - Shell children rendered in the main panel.
 * @returns Layout with sidebar, top bar and bottom command bar.
 */
export default function AetherShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [billingPlan, setBillingPlan] = useState<BillingPlan | null>(null);
  const [isReady, setIsReady] = useState(false);
  const copy = shellCopy[language];

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
            <h1 className="text-2xl font-semibold">Aether AI</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/40">
              {billingPlan === "paid" ? copy.premiumWorkspace : copy.starterWorkspace}
            </p>
          </div>
          <nav className="mt-8 space-y-2">
            {baseNavItems.map((item) => {
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
          <div className="site-panel-soft mt-auto rounded-2xl border p-4">
            <p className="site-muted text-xs">
              {billingPlan === "paid" ? copy.paidWorkspace : copy.starterWorkspace}
            </p>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#7361ff]"
                style={{ width: billingPlan === "paid" ? "95%" : "36%" }}
              />
            </div>
            {billingPlan === "paid" ? (
              <Link
                href="/billing"
                className="site-button-primary mt-4 block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold"
              >
                {copy.billingSettings}
              </Link>
            ) : (
              <Link
                href="/billing"
                className="site-button-primary mt-4 block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold"
              >
                {copy.upgradeToPro}
              </Link>
            )}
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="site-panel flex h-16 items-center justify-between border-b px-4 md:px-8">
            <div className="site-panel-soft site-muted w-full max-w-sm rounded-full px-4 py-2 text-sm">
              {copy.searchPlaceholder}
            </div>
            <div className="ml-4 flex items-center gap-4">
              <ThemeToggle />
              <LanguageSwitcher />
              <span className="site-muted text-sm">{copy.alerts}</span>
              <div className="site-panel-soft flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold">
                {(profile?.displayName || "YA").slice(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          <main className="site-page flex-1 p-4 md:p-8">{children}</main>

          <footer className="site-panel border-t px-6 py-8 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p>© 2026 TheAdamant</p>
                <p className="site-muted mt-1">All rights reserved.</p>
              </div>
              <div className="flex items-center gap-6">
                <Link href={`/${language}/privacy-policy`}>Privacy Policy</Link>
                <Link href={`/${language}/terms-of-service`}>Terms of Service</Link>
              </div>
            </div>
            <div className="site-panel-soft mx-auto mt-6 flex w-full max-w-md items-center justify-center gap-3 rounded-full border px-4 py-2 text-sm">
              <button type="button" className="site-button-secondary rounded-full px-3 py-1">
                {copy.quickSearch}
              </button>
              <button type="button" className="site-button-primary rounded-full px-3 py-1 font-medium">
                {copy.newAction}
              </button>
              <button type="button" className="site-button-secondary rounded-full px-3 py-1">
                {copy.aiAssistant}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

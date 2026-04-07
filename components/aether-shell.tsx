"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
  { label: "Generate Blog", href: "/generate-blog" },
  { label: "Website Audit", href: "/website-audit" },
  { label: "History", href: "/history" },
  { label: "Billing", href: "/billing" },
  { label: "Settings", href: "/settings" },
];

/**
 * Render a consistent app shell for all logged-in pages.
 * @param props - Shell children rendered in the main panel.
 * @returns Layout with sidebar, top bar and bottom command bar.
 */
export default function AetherShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#050b21] text-[#e9eeff]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 border-r border-white/10 bg-[#070f2a] p-5 lg:flex lg:flex-col">
          <div>
            <h1 className="text-2xl font-semibold">Aether AI</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/40">
              Enterprise Tier
            </p>
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
                      ? "bg-[#1e2852] text-white shadow-[0_0_0_1px_rgba(108,91,255,0.35)]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-[#5f54ff]/40 bg-[#111b40] p-4">
            <p className="text-xs text-white/60">Power User Plan</p>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div className="h-2 w-3/4 rounded-full bg-[#7361ff]" />
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#6557ff] px-3 py-2 text-sm font-semibold text-white"
            >
              Upgrade to Pro
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#070f2a]/90 px-4 md:px-8">
            <div className="w-full max-w-sm rounded-full bg-[#121a3a] px-4 py-2 text-sm text-white/50">
              Search analytics...
            </div>
            <div className="ml-4 flex items-center gap-4">
              <span className="text-sm text-white/70">Alerts</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1b2750] text-xs font-bold">
                YV
              </div>
            </div>
          </header>

          <main className="flex-1 bg-[#060d28] p-4 md:p-8">{children}</main>

          <footer className="border-t border-white/10 bg-[#060a1d] px-6 py-8 text-xs text-white/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p>© 2026 Aether AI. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/terms-of-service">Terms of Service</Link>
              </div>
            </div>
            <div className="mx-auto mt-6 flex w-full max-w-md items-center justify-center gap-3 rounded-full border border-white/10 bg-[#101736] px-4 py-2 text-sm text-white/80">
              <button type="button" className="rounded-full bg-[#1a254d] px-3 py-1">
                Quick Search
              </button>
              <button type="button" className="rounded-full bg-[#6c5bff] px-3 py-1 font-medium">
                New Action
              </button>
              <button type="button" className="rounded-full bg-[#1a254d] px-3 py-1">
                AI Assistant
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

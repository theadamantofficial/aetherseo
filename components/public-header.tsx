"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import SitePreferences from "@/components/site-preferences";
import { useLanguage } from "@/components/language-provider";
import { landingCopy, type SiteLanguage } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

type PublicHeaderProps = {
  language: SiteLanguage;
};

function IconArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.5h8M6.5 2.5l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5.5 13L9 5L12.5 13"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.8 10.2h4.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ICONS: Record<string, ReactNode> = {
  platform: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="7.5" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="1" y="7.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  ),
  workflow: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  ),
  blog: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 3h10M2 7h7M2 11h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  ),
  plans: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 10V4l5 5 5-5v6"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  faq: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
};

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <div className="site-panel-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-[var(--site-surface)]">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        {open ? (
          <>
            <path d="M2 2L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M2 4h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 7.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 11h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function PublicHeader({ language }: PublicHeaderProps) {
  const { language: preferredLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const copy = useTranslatedCopy(landingCopy[language], preferredLanguage, `public-header-${language}`);

  const navLinks = [
    { label: copy.nav.platform, href: `/${language}#platform`, key: "platform" },
    { label: copy.nav.workflow, href: `/${language}#workflow`, key: "workflow" },
    { label: copy.nav.blog, href: `/${language}/blog`, key: "blog" },
    { label: copy.nav.plans, href: `/${language}#plans`, key: "plans" },
    { label: copy.nav.faq, href: `/${language}#faq`, key: "faq" },
  ] as const;

  return (
    <div className="sticky top-2 z-50 mb-6 px-1 sm:top-4 sm:mb-10">
      <header className="site-header-shell site-animate-header relative mx-auto flex w-full max-w-7xl items-center gap-2 rounded-[1.4rem] border px-2.5 py-2 sm:rounded-[1.6rem]">
        <Link
          href={`/${language}`}
          onClick={() => setOpen(false)}
          className="site-panel-soft flex min-w-0 shrink-0 items-center gap-2.5 rounded-full border px-2.5 py-1.5 pr-3.5 transition-colors hover:bg-[var(--site-surface)]"
        >
          <span className="site-logo-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <LogoMark className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold leading-tight">Aether SEO</span>
            <span className="site-muted block text-[10px] uppercase tracking-[0.14em]">AI meets SEO</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center lg:flex">
          <div className="site-header-nav flex items-center gap-0.5 rounded-full px-1 py-1">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="site-muted rounded-full px-4 py-2 text-[13px] font-medium transition hover:bg-[var(--site-surface)] hover:text-[var(--foreground)]"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <SitePreferences className="shrink-0" />
          <div className="h-5 w-px bg-[var(--site-border)]" aria-hidden="true" />
          <Link
            href="/auth"
            className="site-button-secondary inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-[13px] font-medium"
          >
            {copy.nav.signIn}
          </Link>
          <Link
            href={`/${language}#plans`}
            className="footer-shimmer site-button-ink inline-flex min-h-10 items-center justify-center gap-1.5 overflow-hidden rounded-full px-4 py-2 text-[13px] font-semibold"
          >
            {copy.nav.explorePlans}
            <IconArrow />
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--site-tertiary)] opacity-90" aria-hidden="true" />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((current) => !current)}
          >
            <BurgerIcon open={open} />
          </button>
        </div>

        {open ? (
          <div
            id="public-mobile-menu"
            className="site-mobile-menu absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[1.2rem] border p-2.5 lg:hidden"
          >
            <div className="grid grid-cols-2 gap-2 pb-2.5">
              <Link
                href={`/${language}#plans`}
                onClick={() => setOpen(false)}
                className="site-button-ink inline-flex min-h-11 items-center justify-center rounded-[0.95rem] px-4 py-3 text-center text-[13px] font-semibold"
              >
                {copy.nav.explorePlans}
              </Link>
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="site-button-secondary inline-flex min-h-11 items-center justify-center rounded-[0.95rem] px-4 py-3 text-center text-[13px] font-medium"
              >
                {copy.nav.signIn}
              </Link>
            </div>

            <div className="my-1 h-px bg-[var(--site-border)]" />

            <nav className="mt-1.5 grid gap-0.5">
              {navLinks.map(({ label, href, key }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-[0.95rem] border border-transparent px-3.5 py-2.5 text-[13px] font-medium transition hover:border-[var(--site-border)] hover:bg-[var(--site-surface-soft)]"
                >
                  <span className="site-muted">{NAV_ICONS[key]}</span>
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-2 border-t border-[var(--site-border)] pt-2">
              <SitePreferences className="w-full grid-cols-1" />
            </div>
          </div>
        ) : null}
      </header>
    </div>
  );
}

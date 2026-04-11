"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SitePreferences from "@/components/site-preferences";
import { useLanguage } from "@/components/language-provider";
import { landingCopy, type SiteLanguage } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

type PublicHeaderProps = {
  language: SiteLanguage;
};

function MobileHeaderToggle({ isOpen }: { isOpen: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
      {isOpen ? (
        <path d="m6 6 12 12M18 6 6 18" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <>
          <path d="M4 7h16" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 12h16" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 17h10" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function PublicHeader({
  language,
}: PublicHeaderProps) {
  const { language: preferredLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const copy = useTranslatedCopy(landingCopy[language], preferredLanguage, `public-header-${language}`);

  return (
    <div className="sticky top-2 z-50 mb-6 px-1 sm:top-4 sm:mb-10">
      <header className="site-header-shell site-animate-header relative mx-auto flex w-full max-w-7xl flex-col gap-3 rounded-[1.5rem] px-3 py-3 sm:rounded-[2rem] sm:px-5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3 lg:px-3 lg:py-3">
        <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:flex-none">
          <Link
            href={`/${language}`}
            className="flex min-w-0 items-center gap-3 rounded-full px-1 py-1 transition hover:opacity-90"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Image
              src="/aether-logo-mark.png"
              alt="Aether SEO"
              width={44}
              height={44}
              priority
              className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11"
            />
            <span className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold sm:text-base md:text-lg">Aether SEO</h1>
              <p className="site-muted text-[9px] uppercase tracking-[0.24em] sm:text-[11px] sm:tracking-[0.24em]">
                AI MEETS SEO
              </p>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="site-button-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-full lg:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls="public-mobile-menu"
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
          >
            <MobileHeaderToggle isOpen={isMobileMenuOpen} />
          </button>
        </div>

        <nav className="site-header-nav hidden flex-1 items-center justify-center gap-1 rounded-full px-2 py-1 lg:flex">
          <Link href={`/${language}#platform`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--site-surface-soft)] hover:text-[var(--foreground)]">
            {copy.nav.platform}
          </Link>
          <Link href={`/${language}#workflow`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--site-surface-soft)] hover:text-[var(--foreground)]">
            {copy.nav.workflow}
          </Link>
          <Link href={`/${language}/blog`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--site-surface-soft)] hover:text-[var(--foreground)]">
            {copy.nav.blog}
          </Link>
          <Link href={`/${language}#plans`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--site-surface-soft)] hover:text-[var(--foreground)]">
            {copy.nav.plans}
          </Link>
          <Link href={`/${language}#faq`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--site-surface-soft)] hover:text-[var(--foreground)]">
            {copy.nav.faq}
          </Link>
        </nav>

        <div className="hidden w-full lg:ml-auto lg:flex lg:w-auto lg:items-center lg:gap-3">
          <SitePreferences className="w-full lg:w-auto lg:shrink-0" />
          <div className="flex w-full gap-2 lg:w-auto lg:flex-nowrap">
            <Link
              href="/auth"
              className="site-button-secondary inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-center text-sm font-medium transition hover:opacity-90"
            >
              {copy.nav.signIn}
            </Link>
            <Link
              href={`/${language}#plans`}
              className="site-button-ink inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-center text-sm font-semibold transition hover:-translate-y-0.5"
            >
              {copy.nav.explorePlans}
            </Link>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div
            id="public-mobile-menu"
            className="site-mobile-menu absolute inset-x-3 top-[calc(100%+0.55rem)] z-30 rounded-[1.35rem] px-3 py-3 lg:hidden sm:inset-x-5"
          >
            <nav className="space-y-1">
              <Link
                href={`/${language}#platform`}
                className="site-mobile-menu-link block rounded-[0.95rem] px-3 py-2.5 text-sm font-medium transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {copy.nav.platform}
              </Link>
              <Link
                href={`/${language}#workflow`}
                className="site-mobile-menu-link block rounded-[0.95rem] px-3 py-2.5 text-sm font-medium transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {copy.nav.workflow}
              </Link>
              <Link
                href={`/${language}/blog`}
                className="site-mobile-menu-link block rounded-[0.95rem] px-3 py-2.5 text-sm font-medium transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {copy.nav.blog}
              </Link>
              <Link
                href={`/${language}#plans`}
                className="site-mobile-menu-link block rounded-[0.95rem] px-3 py-2.5 text-sm font-medium transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {copy.nav.plans}
              </Link>
              <Link
                href={`/${language}#faq`}
                className="site-mobile-menu-link block rounded-[0.95rem] px-3 py-2.5 text-sm font-medium transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {copy.nav.faq}
              </Link>
            </nav>
            <SitePreferences className="mt-3 w-full grid-cols-1" />
            <div className="mt-3 grid gap-2">
              <Link
                href={`/${language}#plans`}
                className="site-button-ink inline-flex min-h-11 items-center justify-center rounded-[1rem] px-4 py-2.5 text-center text-sm font-semibold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {copy.nav.explorePlans}
              </Link>
              <Link
                href="/auth"
                className="site-button-secondary inline-flex min-h-11 items-center justify-center rounded-[1rem] px-4 py-2.5 text-center text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {copy.nav.signIn}
              </Link>
            </div>
          </div>
        ) : null}
      </header>
    </div>
  );
}

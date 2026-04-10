"use client";

import Image from "next/image";
import Link from "next/link";
import SitePreferences from "@/components/site-preferences";
import { useLanguage } from "@/components/language-provider";
import { landingCopy, type SiteLanguage } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

type PublicHeaderProps = {
  language: SiteLanguage;
  buildLanguagePath: (language: SiteLanguage) => string;
};

export default function PublicHeader({
  language,
  buildLanguagePath,
}: PublicHeaderProps) {
  const { language: preferredLanguage } = useLanguage();
  const copy = useTranslatedCopy(landingCopy[language], preferredLanguage, `public-header-${language}`);

  return (
    <div className="sticky top-2 z-50 mb-6 px-1 sm:top-4 sm:mb-10">
      <header className="site-header-shell site-animate-header mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-[1.75rem] px-4 py-4 sm:rounded-[2rem] sm:px-5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3 lg:px-3 lg:py-3">
        <Link
          href={`/${language}`}
          className="mx-auto flex w-full min-w-0 items-center justify-center gap-3 rounded-[1.3rem] px-2 py-1.5 text-center transition hover:opacity-90 sm:w-auto sm:min-w-fit sm:shrink-0 sm:justify-start sm:text-left lg:mx-0 lg:rounded-full"
        >
          <Image
            src="/aether-logo-mark.png"
            alt="Aether SEO"
            width={44}
            height={44}
            priority
            className="h-11 w-11 rounded-full object-cover"
          />
          <span className="min-w-0">
            <h1 className="text-base font-semibold md:text-lg">Aether SEO</h1>
            <p className="site-muted text-[10px] uppercase tracking-[0.22em] sm:text-[11px] sm:tracking-[0.24em]">
              AI MEETS SEO
            </p>
          </span>
        </Link>

        <nav className="site-header-nav hidden flex-1 items-center justify-center gap-1 rounded-full px-2 py-1 lg:flex">
          <Link href={`/${language}#platform`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 hover:text-[var(--foreground)]">
            {copy.nav.platform}
          </Link>
          <Link href={`/${language}#workflow`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 hover:text-[var(--foreground)]">
            {copy.nav.workflow}
          </Link>
          <Link href={`/${language}/blog`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 hover:text-[var(--foreground)]">
            {copy.nav.blog}
          </Link>
          <Link href={`/${language}#plans`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 hover:text-[var(--foreground)]">
            {copy.nav.plans}
          </Link>
          <Link href={`/${language}#faq`} className="site-muted rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 hover:text-[var(--foreground)]">
            {copy.nav.faq}
          </Link>
        </nav>

        <div className="w-full lg:ml-auto lg:w-auto">
          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.035] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_26px_rgba(15,23,42,0.08)] sm:p-3 lg:flex lg:items-center lg:gap-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <SitePreferences buildLanguagePath={buildLanguagePath} className="w-full lg:w-auto lg:shrink-0" />
            <div className="mt-2.5 grid w-full grid-cols-2 gap-2 lg:mt-0 lg:flex lg:w-auto lg:flex-nowrap">
              <Link
                href="/auth"
                className="site-button-secondary inline-flex min-h-11 items-center justify-center rounded-[1rem] px-4 py-2.5 text-center text-sm font-medium transition hover:opacity-90 sm:rounded-full"
              >
                {copy.nav.signIn}
              </Link>
              <Link
                href={`/${language}#plans`}
                className="site-button-ink inline-flex min-h-11 items-center justify-center rounded-[1rem] px-4 py-2.5 text-center text-sm font-semibold transition hover:-translate-y-0.5 sm:rounded-full"
              >
                {copy.nav.explorePlans}
              </Link>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

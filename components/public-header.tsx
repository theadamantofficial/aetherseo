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
      <header className="site-header-shell site-animate-header mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 rounded-[2rem] px-3 py-3 lg:flex-nowrap">
        <Link
          href={`/${language}`}
          className="flex w-full min-w-0 items-center gap-3 rounded-full px-2 py-1.5 transition hover:opacity-90 sm:w-auto sm:min-w-fit sm:shrink-0"
        >
          <Image
            src="/aether-logo-mark.png"
            alt="Aether SEO"
            width={44}
            height={44}
            priority
            className="h-11 w-11 rounded-full object-cover"
          />
          <span>
            <h1 className="text-base font-semibold md:text-lg">Aether SEO</h1>
            <p className="site-muted text-[11px] uppercase tracking-[0.24em]">AI MEETS SEO</p>
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

        <div className="flex w-full flex-col gap-3 lg:ml-auto lg:w-auto lg:flex-row lg:flex-nowrap lg:items-center">
          <SitePreferences buildLanguagePath={buildLanguagePath} className="w-full lg:w-auto lg:shrink-0" />
          <div className="grid w-full grid-cols-2 gap-2 lg:flex lg:w-auto lg:flex-nowrap">
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
      </header>
    </div>
  );
}

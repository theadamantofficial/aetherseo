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
    <div className="sticky top-2 z-50 mb-8 px-1 sm:top-4 sm:mb-10">
      <header className="site-header-shell site-animate-header mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 rounded-[2rem] px-3 py-3 lg:flex-nowrap">
        <Link
          href={`/${language}`}
          className="flex min-w-fit shrink-0 items-center gap-3 rounded-full px-2 py-1.5 transition hover:opacity-90"
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

        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
          <SitePreferences buildLanguagePath={buildLanguagePath} className="shrink-0" />
          <Link
            href="/auth"
            className="site-button-secondary rounded-full px-4 py-2.5 text-sm font-medium transition hover:opacity-90"
          >
            {copy.nav.signIn}
          </Link>
          <Link
            href={`/${language}#plans`}
            className="site-button-ink rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
          >
            {copy.nav.explorePlans}
          </Link>
        </div>
      </header>
    </div>
  );
}

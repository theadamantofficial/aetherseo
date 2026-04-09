"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { footerCopy } from "@/lib/legal-copy";
import { landingCopy, type SiteLanguage } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

export default function PublicFooter({ language }: { language: SiteLanguage }) {
  const { language: preferredLanguage } = useLanguage();
  const copy = useTranslatedCopy(footerCopy[language], preferredLanguage, `public-footer-copy-${language}`);
  const landing = useTranslatedCopy(
    landingCopy[language],
    preferredLanguage,
    `public-footer-landing-${language}`,
  );

  return (
    <footer className="mt-20 space-y-5">
      <section className="site-panel-hero site-animate-rise overflow-hidden rounded-[2.2rem] border px-6 py-8 sm:px-7">
        <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="site-chip inline-flex rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em]">
              {copy.parent}
            </p>
            <h3 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
              Build faster, publish cleaner, and keep every launch ready for search.
            </h3>
            <p className="site-muted mt-4 max-w-2xl text-sm leading-7 md:text-base">
              Aether keeps multilingual content operations, blog workflows, and SEO execution in one system so your team ships without losing structure.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="site-panel-soft rounded-[1.6rem] border px-5 py-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">Content flow</p>
              <p className="mt-3 text-2xl font-semibold">Localized blog ops</p>
              <p className="site-muted mt-2 text-sm">Draft, review, publish, and revisit history without fragmenting the workflow.</p>
            </div>
            <div className="site-panel-soft rounded-[1.6rem] border px-5 py-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">Search layer</p>
              <p className="mt-3 text-2xl font-semibold">Stronger SEO structure</p>
              <p className="site-muted mt-2 text-sm">Metadata, language routes, audit visibility, and cleaner page hierarchy stay aligned.</p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/auth" className="site-button-ink rounded-full px-5 py-3 text-center text-sm font-semibold">
            Start with Aether
          </Link>
          <Link href={`/${language}#plans`} className="site-button-secondary rounded-full px-5 py-3 text-center text-sm font-semibold">
            Compare plans
          </Link>
        </div>
      </section>

      <section className="site-panel rounded-[2.2rem] px-6 py-8 sm:px-7">
        <div className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/aether-logo-mark.png"
                alt="Aether SEO"
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold">{copy.product}</p>
                <p className="site-muted text-xs uppercase tracking-[0.16em]">AI MEETS SEO</p>
              </div>
            </div>
            <p className="site-muted mt-4 max-w-xl text-sm leading-6">
              AI-assisted SEO operations for structured content, multilingual publishing, audits, and cleaner startup workflows.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="site-panel-soft rounded-[1.4rem] border px-4 py-4">
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">Publishing</p>
                <p className="mt-2 text-lg font-semibold">Localized content flow</p>
                <p className="site-muted mt-2 text-sm leading-6">One workspace for briefs, generation, review, and history.</p>
              </div>
              <div className="site-panel-soft rounded-[1.4rem] border px-4 py-4">
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">SEO system</p>
                <p className="mt-2 text-lg font-semibold">Audit-aware operations</p>
                <p className="site-muted mt-2 text-sm leading-6">Metadata, structure, plan limits, and workflow controls stay aligned.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[0.8fr,0.8fr,1fr] md:items-stretch">
            <div>
              <p className="text-sm font-semibold">Explore</p>
              <div className="mt-4 grid gap-3 text-sm">
                <Link href={`/${language}#platform`} className="site-link-accent">
                  {landing.nav.platform}
                </Link>
                <Link href={`/${language}#workflow`} className="site-link-accent">
                  {landing.nav.workflow}
                </Link>
                <Link href={`/${language}/blog`} className="site-link-accent">
                  {landing.nav.blog}
                </Link>
                <Link href={`/${language}#plans`} className="site-link-accent">
                  {landing.nav.plans}
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Company</p>
              <div className="mt-4 grid gap-3 text-sm">
                <Link href="/auth" className="site-link-accent">
                  Account access
                </Link>
                <Link href={`/${language}/privacy-policy`} className="site-link-accent">
                  {copy.privacy}
                </Link>
                <Link href={`/${language}/terms-of-service`} className="site-link-accent">
                  {copy.terms}
                </Link>
              </div>
            </div>

            <div className="site-panel-soft flex flex-col justify-between rounded-[1.6rem] border px-5 py-5">
              <div>
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{copy.parent}</p>
                <p className="mt-3 text-2xl font-semibold">Search-ready startup publishing.</p>
                <p className="site-muted mt-3 text-sm leading-6">
                  Designed for lean teams that need multilingual blog output, cleaner routing, and consistent SEO structure.
                </p>
              </div>

              <div className="mt-6 border-t border-[var(--site-border)] pt-4">
                <p className="font-medium">{copy.parent}</p>
                <p className="site-muted mt-1 text-xs">{copy.rights}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-[var(--site-border)] pt-5 text-sm md:flex-row md:items-center md:justify-between">
          <p className="site-muted">Aether SEO is built for multilingual blog operations, SEO visibility, and launch-ready publishing systems.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={`/${language}/blog`} className="site-button-secondary rounded-full px-4 py-2 text-center text-sm font-medium">
              {landing.nav.blog}
            </Link>
            <Link href={`/${language}#plans`} className="site-button-secondary rounded-full px-4 py-2 text-center text-sm font-medium">
              {landing.nav.plans}
            </Link>
          </div>
        </div>
      </section>
    </footer>
  );
}

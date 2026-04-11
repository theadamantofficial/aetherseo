"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";
import { footerCopy } from "@/lib/legal-copy";
import { landingCopy, type SiteLanguage } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 7h10M7 2l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowSm() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 6h8M6 2l4 4-4 4"
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

function MiniCard({
  tag,
  title,
  body,
}: {
  tag: string;
  title: string;
  body: string;
}) {
  return (
    <div className="site-panel-soft rounded-[1rem] border px-4 py-4">
      <p className="site-accent-text text-[10px] uppercase tracking-[0.16em]">{tag}</p>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="site-muted mt-2 text-xs leading-6">{body}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-[1.45rem] font-semibold leading-none tracking-[-0.04em]">{value}</p>
      <p className="site-muted mt-1 text-[11px] uppercase tracking-[0.1em]">{label}</p>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="site-muted flex items-center gap-2 py-1.5 text-sm font-medium transition hover:text-[var(--foreground)]"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--site-primary)] opacity-60" aria-hidden="true" />
      {children}
    </Link>
  );
}

function OrbitGraphic() {
  return (
    <div className="relative flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-dashed border-[var(--site-border)]" />
      <div className="absolute inset-[17px] rounded-full border border-[var(--site-border)] opacity-70" />
      <div className="h-4 w-4 rounded-full bg-[var(--site-primary)]" />
      <div className="footer-orbit-dot footer-orbit-dot-a absolute h-2.5 w-2.5 rounded-full bg-[var(--foreground)]" />
      <div className="footer-orbit-dot footer-orbit-dot-b absolute h-2 w-2 rounded-full bg-[var(--site-secondary)]" />
      <div className="footer-orbit-dot footer-orbit-dot-c absolute h-1.5 w-1.5 rounded-full bg-[var(--site-tertiary)]" />
    </div>
  );
}

function Sparkline() {
  return (
    <div className="relative h-[56px] w-full md:h-[68px]">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 220 56"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0"
      >
        <path
          d="M0 48 L18 44 L36 46 L55 38 L73 34 L91 30 L109 22 L127 18 L146 14 L164 10 L182 8 L200 5 L220 3 L220 56 L0 56 Z"
          fill="currentColor"
          className="opacity-10"
        />
        <path
          d="M0 48 L18 44 L36 46 L55 38 L73 34 L91 30 L109 22 L127 18 L146 14 L164 10 L182 8 L200 5 L220 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="pointer-events-none absolute block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
        style={{ left: "90.9%", top: "8.9%" }}
      />
      <span
        className="pointer-events-none absolute block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-current opacity-50"
        style={{ left: "90.9%", top: "8.9%" }}
      />
    </div>
  );
}

export default function PublicFooter({ language }: { language: SiteLanguage }) {
  const { language: preferredLanguage } = useLanguage();
  const copy = useTranslatedCopy(footerCopy[language], preferredLanguage, `public-footer-copy-${language}`);
  const landing = useTranslatedCopy(
    landingCopy[language],
    preferredLanguage,
    `public-footer-landing-${language}`,
  );

  return (
    <footer className="mt-20 grid gap-4">
      <section className="site-panel-hero site-animate-rise overflow-hidden rounded-[2.2rem] border shadow-[var(--site-depth-shadow-soft)]">
        <div className="grid lg:grid-cols-[1.05fr,0.95fr]">
          <div className="border-b px-6 py-8 sm:px-7 lg:border-b-0 lg:border-r lg:px-8 lg:py-9">
            <span className="site-chip inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em]">
              <span className="site-logo-mark flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full">
                <LogoMark className="h-2.5 w-2.5" />
              </span>
              {copy.parent}
            </span>

            <h3 className="mt-4 max-w-md text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.04em]">
              Build faster.
              <br />
              Publish cleaner.
              <br />
              Stay search-ready.
            </h3>

            <p className="site-muted mt-4 max-w-md text-sm leading-7 md:text-base">
              Multilingual content ops, blog workflows, and SEO execution stay in one system so your team ships faster without losing structure.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-5">
              <StatItem value="3x" label="Publishing speed" />
              <div className="h-10 w-px bg-[var(--site-border)]" aria-hidden="true" />
              <StatItem value="100%" label="Audit aware" />
              <div className="h-10 w-px bg-[var(--site-border)]" aria-hidden="true" />
              <StatItem value="12+" label="Languages" />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/auth"
                className="footer-shimmer site-button-ink inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-3 text-sm font-semibold"
              >
                <IconArrow />
                Start with Aether
              </Link>
              <Link
                href={`/${language}#plans`}
                className="site-button-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                Compare plans
              </Link>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid gap-3">
              <div
                className="site-panel-soft site-hover-lift site-animate-rise rounded-[1.45rem] border p-4"
                style={{ ["--site-delay" as string]: "80ms" }}
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--site-surface)]">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 3h10M2 7h7M2 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="site-accent-text text-[11px] uppercase tracking-[0.16em]">Content flow</p>
                <p className="mt-2 text-base font-semibold">Localized blog ops</p>
                <p className="site-muted mt-2 text-sm leading-6">
                  Draft, review, publish, and revisit history across every locale without splitting the workflow.
                </p>
                <div className="mt-4 overflow-hidden rounded-[1rem] border bg-[var(--site-surface)] px-3 pt-3 text-[var(--site-primary)]">
                  <Sparkline />
                  <div className="flex justify-between pb-2">
                    {["Jan", "Apr", "Jul", "Dec"].map((month) => (
                      <span key={month} className="site-muted text-[10px]">
                        {month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.05fr,0.95fr]">
                <div
                  className="site-panel-soft site-hover-lift site-animate-rise rounded-[1.45rem] border p-4"
                  style={{ ["--site-delay" as string]: "140ms" }}
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--site-surface)]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="site-accent-text text-[11px] uppercase tracking-[0.16em]">Search layer</p>
                  <p className="mt-2 text-base font-semibold">Stronger SEO structure</p>
                  <p className="site-muted mt-2 text-sm leading-6">
                    Metadata, locale routing, and page hierarchy stay aligned so audits stay clean.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-[var(--site-surface)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--site-primary)]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                      Live
                    </span>
                    <span className="site-muted text-[11px]">Monitoring 3 active audits</span>
                  </div>
                </div>

                <div
                  className="site-panel-soft site-animate-rise rounded-[1.45rem] border p-4"
                  style={{ ["--site-delay" as string]: "200ms" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="site-accent-text text-[11px] uppercase tracking-[0.16em]">
                        Why lean teams choose Aether
                      </p>
                      <p className="site-muted mt-2 text-sm leading-6">
                        One system for briefs, generation, review, and audit visibility with no context switching.
                      </p>
                    </div>
                    <OrbitGraphic />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="site-panel site-animate-rise rounded-[2.2rem] border px-6 py-8 shadow-[var(--site-depth-shadow-soft)] sm:px-7"
        style={{ ["--site-delay" as string]: "100ms" }}
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="site-logo-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                <LogoMark className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-sm font-semibold">{copy.product}</p>
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">AI meets SEO</p>
              </div>
            </div>

            <p className="site-muted mt-4 max-w-xl text-sm leading-7">
              AI-assisted SEO operations for structured content, multilingual publishing, audits, and cleaner launch workflows.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniCard
                tag="Publishing"
                title="Localized content"
                body="Briefs, generation, review, and revision history stay in one workspace."
              />
              <MiniCard
                tag="SEO system"
                title="Audit-aware ops"
                body="Metadata, structure, and workflow controls stay aligned as the site grows."
              />
            </div>

            <div className="site-panel-soft relative mt-4 overflow-hidden rounded-[1.6rem] border px-5 py-5">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-[var(--site-border)] opacity-60" />
              <div className="absolute right-4 top-4 h-14 w-14 rounded-full border border-[var(--site-border)] opacity-50" />
              <p className="site-accent-text relative text-[10px] uppercase tracking-[0.16em]">
                Search-ready publishing
              </p>
              <p className="relative mt-2 text-xl font-semibold leading-tight">
                Built for lean teams that need to move fast.
              </p>
              <p className="site-muted relative mt-2 text-sm leading-6">
                Multilingual blog output, cleaner routing, and consistent SEO structure without extra overhead.
              </p>
              <div className="relative mt-5 flex flex-col gap-3 border-t border-[var(--site-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{copy.parent}</p>
                  <p className="site-muted mt-1 text-xs">{copy.rights}</p>
                </div>
                <Link
                  href="/auth"
                  className="site-button-secondary inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="site-muted text-[11px] font-semibold uppercase tracking-[0.18em]">Explore</p>
                <div className="mt-3">
                  <NavLink href={`/${language}#platform`}>{landing.nav.platform}</NavLink>
                  <NavLink href={`/${language}#workflow`}>{landing.nav.workflow}</NavLink>
                  <NavLink href={`/${language}/blog`}>{landing.nav.blog}</NavLink>
                  <NavLink href={`/${language}#plans`}>{landing.nav.plans}</NavLink>
                </div>
              </div>

              <div>
                <p className="site-muted text-[11px] font-semibold uppercase tracking-[0.18em]">Company</p>
                <div className="mt-3">
                  <NavLink href="/auth">Account access</NavLink>
                  <NavLink href={`/${language}/privacy-policy`}>{copy.privacy}</NavLink>
                  <NavLink href={`/${language}/terms-of-service`}>{copy.terms}</NavLink>
                </div>
              </div>
            </div>

            <div className="site-panel-soft rounded-[1.6rem] border p-4">
              <p className="site-accent-text text-[10px] uppercase tracking-[0.16em]">Publishing activity</p>
              <p className="mt-2 text-[1.9rem] font-semibold leading-none tracking-[-0.04em]">
                2,400 <span className="site-muted text-sm font-normal">posts shipped</span>
              </p>
              <div className="mt-4 text-[var(--site-primary)]">
                <Sparkline />
                <div className="mt-1 flex justify-between">
                  {["Jan", "Apr", "Jul", "Dec"].map((month) => (
                    <span key={month} className="site-muted text-[10px]">
                      {month}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="site-panel-soft rounded-[1.3rem] border p-4">
                <p className="site-muted text-[10px] uppercase tracking-[0.14em]">Avg score</p>
                <p className="mt-2 text-2xl font-semibold leading-none">
                  94<span className="site-muted text-xs font-normal">/100</span>
                </p>
                <div className="mt-3 flex gap-1">
                  {[true, true, true, true, false].map((active, index) => (
                    <div
                      key={index}
                      className={`h-[3px] flex-1 rounded-full ${
                        active ? "bg-[var(--site-primary)]" : "bg-[var(--site-border)]"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="site-panel-soft rounded-[1.3rem] border p-4">
                <p className="site-muted text-[10px] uppercase tracking-[0.14em]">Locales</p>
                <p className="mt-2 text-2xl font-semibold leading-none">12+</p>
                <div className="mt-3 flex gap-1.5">
                  {[1, 0.7, 0.45, 0.2].map((opacity, index) => (
                    <div
                      key={index}
                      className="h-2.5 w-2.5 rounded-full bg-[var(--site-tertiary)]"
                      style={{ opacity }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-[var(--site-border)] pt-5 md:flex-row md:items-center md:justify-between">
          <p className="site-muted max-w-2xl text-sm leading-6">
            Aether SEO is built for multilingual blog operations, stronger SEO visibility, and launch-ready publishing systems.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/${language}/blog`}
              className="site-button-secondary inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
            >
              {landing.nav.blog}
            </Link>
            <Link
              href={`/${language}#plans`}
              className="site-button-secondary inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
            >
              {landing.nav.plans}
            </Link>
            <Link
              href="/auth"
              className="site-button-ink inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
            >
              Start free
              <IconArrowSm />
            </Link>
          </div>
        </div>
      </section>
    </footer>
  );
}

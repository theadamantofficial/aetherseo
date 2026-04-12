"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { footerCopy } from "@/lib/legal-copy";
import { landingCopy, type SiteLanguage } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

/* ─── inline SVGs ───────────────────────────────────────── */

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowSm() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(125,134,255,0.18)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.98),rgba(236,240,255,0.9))] shadow-[0_10px_26px_rgba(91,103,255,0.16)] ${className}`.trim()}
    >
      <Image
        src="/aether-logo-mark.png"
        alt="Aether SEO"
        width={44}
        height={44}
        className="h-full w-full scale-[1.55] object-cover"
      />
    </span>
  );
}

/* ─── sub-components ────────────────────────────────────── */

function MiniCard({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-3.5 py-3.5 transition-colors hover:border-[var(--site-border-strong)]">
      <p className="text-[10px] uppercase tracking-[.12em] text-[var(--site-muted)]">{tag}</p>
      <p className="mt-1 text-[13px] font-medium">{title}</p>
      <p className="mt-1 text-[11px] leading-[1.55] text-[var(--site-muted)]">{body}</p>
    </div>
  );
}

function CapabilityChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] px-3 py-1.5 text-[11px] text-[var(--site-muted)]">
      {children}
    </span>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 py-1 text-[13px] transition-colors hover:text-[var(--site-muted)] before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-current before:opacity-30 hover:before:opacity-60"
    >
      {children}
    </Link>
  );
}

/** Animated orbit graphic — pure CSS keyframes defined in globals.css */
function OrbitGraphic() {
  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-dashed border-[var(--site-border)]" />
      <div className="absolute inset-[15px] rounded-full border border-[var(--site-border)] opacity-30" />
      <div className="h-4 w-4 rounded-full bg-[var(--site-fg)]" />
      {/* Add `@keyframes orbitA/B/C` in globals.css — see comment below */}
      <div className="orbit-a absolute h-2 w-2 rounded-full bg-[var(--site-fg)]" />
      <div className="orbit-b absolute h-1.5 w-1.5 rounded-full bg-[var(--site-muted)]" />
      <div className="orbit-c absolute h-[5px] w-[5px] rounded-full bg-[var(--site-muted)] opacity-60" />
    </div>
  );
}

/*
  Add these keyframes to globals.css:

  @keyframes orbitA {
    from { transform: rotate(0deg) translateX(38px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(38px) rotate(-360deg); }
  }
  @keyframes orbitB {
    from { transform: rotate(120deg) translateX(52px) rotate(-120deg); }
    to   { transform: rotate(480deg) translateX(52px) rotate(-480deg); }
  }
  @keyframes orbitC {
    from { transform: rotate(240deg) translateX(30px) rotate(-240deg); }
    to   { transform: rotate(600deg) translateX(30px) rotate(-600deg); }
  }
  .orbit-a { top: 50%; left: 50%; transform-origin: 0 0; animation: orbitA 4s linear infinite; }
  .orbit-b { top: 50%; left: 50%; transform-origin: 0 0; animation: orbitB 6s linear infinite; }
  .orbit-c { top: 50%; left: 50%; transform-origin: 0 0; animation: orbitC 3s linear infinite; }

  @keyframes footerRise {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    from { transform: translateX(-100%) skewX(-15deg); }
    to   { transform: translateX(250%) skewX(-15deg); }
  }
  .footer-rise-1 { animation: footerRise .7s cubic-bezier(.16,1,.3,1) both; }
  .footer-rise-2 { animation: footerRise .7s .1s cubic-bezier(.16,1,.3,1) both; }
  .footer-card-1 { animation: footerRise .5s .35s cubic-bezier(.16,1,.3,1) both; }
  .footer-card-2 { animation: footerRise .5s .45s cubic-bezier(.16,1,.3,1) both; }
  .footer-card-3 { animation: footerRise .5s .55s cubic-bezier(.16,1,.3,1) both; }
  .btn-shimmer::after {
    content: '';
    position: absolute; inset: 0;
    background: rgba(255,255,255,.15);
    transform: translateX(-100%) skewX(-15deg);
    animation: shimmer 2.5s 1.5s ease-in-out infinite;
  }
*/

function WorkflowStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[var(--site-border)] bg-[var(--site-bg)] px-3 py-2.5">
      <p className="text-[11px] font-medium text-[var(--site-fg)]">{title}</p>
      <p className="mt-1 text-[11px] leading-[1.55] text-[var(--site-muted)]">{body}</p>
    </div>
  );
}

/* ─── main export ───────────────────────────────────────── */

export default function PublicFooter({ language }: { language: SiteLanguage }) {
  const { language: preferredLanguage } = useLanguage();
  const copy = useTranslatedCopy(footerCopy[language], preferredLanguage, `public-footer-copy-${language}`);
  const landing = useTranslatedCopy(landingCopy[language], preferredLanguage, `public-footer-landing-${language}`);

  return (
    <footer className="mt-20 grid gap-3">

      {/* ══ Hero panel ══════════════════════════════════════ */}
      <section className="footer-rise-1 overflow-hidden rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-panel)]">
        <div className="grid lg:grid-cols-2">

          {/* Left: headline */}
          <div className="border-b border-[var(--site-border)] px-7 py-9 lg:border-b-0 lg:border-r">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] px-3 py-1.5 text-[11px] uppercase tracking-[.12em] text-[var(--site-muted)]">
              <BrandMark className="h-[18px] w-[18px]" />
              {copy.parent}
            </span>

            <h3 className="mt-4 max-w-sm text-[clamp(1.5rem,3vw,2.1rem)] font-medium leading-[1.2] tracking-[-0.02em]">
              Build faster.<br />Publish cleaner.<br />Stay search-ready.
            </h3>

            <p className="mt-3 max-w-xs text-[13px] leading-[1.7] text-[var(--site-muted)]">
              Multilingual content ops, blog workflows, and SEO execution — unified so your team ships without losing structure.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <CapabilityChip>Multilingual publishing</CapabilityChip>
              <CapabilityChip>Audit-aware structure</CapabilityChip>
              <CapabilityChip>Shared workspace history</CapabilityChip>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/auth"
                className="btn-shimmer site-button-primary relative inline-flex items-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-[13px] font-medium"
              >
                <IconArrow />
                Start with Aether
              </Link>
              <Link href={`/${language}#plans`} className="site-button-secondary rounded-full px-5 py-2.5 text-[13px] font-medium">
                Compare plans
              </Link>
            </div>
          </div>

          {/* Right: feature cards */}
          <div className="flex flex-col gap-3 bg-[var(--site-bg)] p-5">
            {/* Card 1 — content flow */}
            <div className="footer-card-1 group rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-panel)] p-4 transition-[border-color,transform] hover:-translate-y-px hover:border-[var(--site-border-strong)]">
              <div className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--site-border)] bg-[var(--site-bg)]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M2 3h10M2 7h7M2 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[11px] uppercase tracking-[.12em] text-[var(--site-muted)]">Content flow</p>
              <p className="mt-1 text-[14px] font-medium">Localized blog ops</p>
              <p className="mt-1 text-[12px] leading-[1.6] text-[var(--site-muted)]">Draft, review, publish, and revisit history across every locale without fragmenting the workflow.</p>
              <div className="mt-3 grid gap-2">
                <WorkflowStep title="Brief the topic" body="Set keyword, tone, and output language before generation starts." />
                <WorkflowStep title="Generate with context" body="Keep blog drafting, optional assets, and review notes in one place." />
                <WorkflowStep title="Publish with structure" body="Move from draft to public blog output without breaking routing or SEO consistency." />
              </div>
            </div>

            {/* Card 2 — SEO */}
            <div className="footer-card-2 group rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-panel)] p-4 transition-[border-color,transform] hover:-translate-y-px hover:border-[var(--site-border-strong)]">
              <div className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--site-border)] bg-[var(--site-bg)]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[11px] uppercase tracking-[.12em] text-[var(--site-muted)]">Search layer</p>
              <p className="mt-1 text-[14px] font-medium">Stronger SEO structure</p>
              <p className="mt-1 text-[12px] leading-[1.6] text-[var(--site-muted)]">Metadata, language routes, and page hierarchy stay aligned — audit-ready at every stage.</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <CapabilityChip>Metadata</CapabilityChip>
                <CapabilityChip>Locale routes</CapabilityChip>
                <CapabilityChip>Review cues</CapabilityChip>
              </div>
            </div>

            {/* Card 3 — orbit */}
            <div className="footer-card-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-bg)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[.12em] text-[var(--site-muted)]">Why lean teams choose Aether</p>
                  <p className="mt-1.5 text-[12px] leading-[1.6] text-[var(--site-muted)]">One system for briefs, generation, review, and audit visibility — no context switching.</p>
                </div>
                <OrbitGraphic />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Main footer panel ═══════════════════════════════ */}
      <section className="footer-rise-2 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-panel)] px-7 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,1fr]">

          {/* Left: brand + cards */}
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-9 w-9" />
              <div>
                <p className="text-[14px] font-medium">{copy.product}</p>
                <p className="text-[11px] uppercase tracking-[.12em] text-[var(--site-muted)]">AI meets SEO</p>
              </div>
            </div>

            <p className="mt-3.5 max-w-xs text-[13px] leading-[1.65] text-[var(--site-muted)]">
              AI-assisted SEO for structured content, multilingual publishing, audits, and launch-ready startup workflows.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniCard tag="Publishing" title="Localized content" body="Briefs, generation, review, and history in one workspace." />
              <MiniCard tag="SEO system" title="Audit-aware ops" body="Metadata, structure, and controls stay aligned always." />
            </div>

            {/* Promo box */}
            <div className="relative mt-3 overflow-hidden rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-bg)] p-5">
              <div className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full border border-[var(--site-border)] opacity-40" />
              <div className="pointer-events-none absolute -right-1 -top-1 h-14 w-14 rounded-full border border-[var(--site-border)] opacity-30" />
              <p className="relative text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">Search-ready publishing</p>
              <p className="relative mt-1.5 text-[16px] font-medium leading-[1.3]">Built for lean teams that need to move fast.</p>
              <p className="relative mt-1.5 text-[12px] leading-[1.6] text-[var(--site-muted)]">
                Multilingual blog output, cleaner routing, and consistent SEO structure — without the overhead.
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--site-border)] pt-3.5">
                <div>
                  <p className="text-[12px] font-medium">{copy.parent}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--site-muted)]">{copy.rights}</p>
                </div>
                <Link href="/auth" className="site-button-secondary rounded-full px-4 py-2 text-[12px] font-medium">
                  Get started
                </Link>
              </div>
            </div>
          </div>

          {/* Right: nav + data */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--site-muted)]">Explore</p>
                <div className="mt-3 grid gap-0.5">
                  <NavLink href={`/${language}#platform`}>{landing.nav.platform}</NavLink>
                  <NavLink href={`/${language}#workflow`}>{landing.nav.workflow}</NavLink>
                  <NavLink href={`/${language}/blog`}>{landing.nav.blog}</NavLink>
                  <NavLink href={`/${language}#plans`}>{landing.nav.plans}</NavLink>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--site-muted)]">Company</p>
                <div className="mt-3 grid gap-0.5">
                  <NavLink href="/auth">Account</NavLink>
                  <NavLink href={`/${language}/privacy-policy`}>{copy.privacy}</NavLink>
                  <NavLink href={`/${language}/terms-of-service`}>{copy.terms}</NavLink>
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] p-3.5">
                <p className="text-[10px] uppercase tracking-[.1em] text-[var(--site-muted)]">Workspace fit</p>
                <p className="mt-1 text-[15px] font-medium leading-[1.35] text-[var(--site-fg)]">Landing pages should explain the workflow, not simulate customer metrics.</p>
                <p className="mt-2 text-[11px] leading-[1.6] text-[var(--site-muted)]">
                  This footer now stays descriptive so the public site does not imply live reporting where no real dataset exists.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] p-3.5">
                <p className="text-[10px] uppercase tracking-[.1em] text-[var(--site-muted)]">What stays aligned</p>
                <div className="mt-2 grid gap-2">
                  <WorkflowStep title="Public blog" body="Brand-facing articles keep the same visual language as the workspace." />
                  <WorkflowStep title="SEO structure" body="Metadata, routing, and language choices stay consistent across pages." />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-7 flex flex-col gap-3 border-t border-[var(--site-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-[11px] leading-[1.55] text-[var(--site-muted)]">
            Built for multilingual blog operations, SEO visibility, and launch-ready publishing systems.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Link href={`/${language}/blog`} className="site-button-secondary rounded-full px-4 py-2 text-[12px] font-medium">{landing.nav.blog}</Link>
            <Link href={`/${language}#plans`} className="site-button-secondary rounded-full px-4 py-2 text-[12px] font-medium">{landing.nav.plans}</Link>
            <Link href="/auth" className="site-button-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium">
              Start free <IconArrowSm />
            </Link>
          </div>
        </div>
      </section>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState, type ReactNode } from "react";
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";
import { useLanguage } from "@/components/language-provider";
import { type PublishedBlogPost } from "@/lib/blog-post-utils";
import { landingCopy } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

function SparkDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-1.5 w-1.5 rounded-full bg-[#83f6d7] shadow-[0_0_8px_rgba(131,246,215,0.7)]"
    />
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--site-muted)] opacity-70">
      {children}
    </p>
  );
}

function formatPublishedDate(date: string, language: string) {
  try {
    return new Intl.DateTimeFormat(language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(date));
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}

export default function HomePage() {
  const { language, uiLanguage } = useLanguage();
  const copy = useTranslatedCopy(landingCopy[uiLanguage], language, `home-page-copy-${uiLanguage}`);
  const [posts, setPosts] = useState<PublishedBlogPost[]>([]);
  const [contactState, setContactState] = useState<"idle" | "sending" | "success" | "error">("idle");

  const ui = useTranslatedCopy(
    {
      en: {
        live: "Live command center",
        readiness: "Readiness",
        workspaceHealth: "Workspace health",
        contentCluster: "Content brief cluster",
        domainAudit: "Domain audit",
        historyFeed: "History feed",
        contentClusterBody: "Ready for generation",
        domainAuditBody: "Metadata gap detected",
        historyFeedBody: "7 actions logged this week",
        oneWorkspace: "1 workspace",
        oneWorkspaceBody: "One place for content, audit, and history.",
        fastHandoff: "Fast handoff",
        fastHandoffBody: "A cleaner flow for founders and operators.",
        planAware: "Plan-aware",
        planAwareBody: "Free and paid experiences stay separated.",
        active: "Active",
        structured: "Structured for focused execution",
        guided: "Guided",
        open: "Open",
        readArticle: "Read article",
        sending: "Sending...",
      },
      es: {
        live: "Centro en vivo",
        readiness: "Estado",
        workspaceHealth: "Salud del espacio",
        contentCluster: "Cluster de contenidos",
        domainAudit: "Auditoria de dominio",
        historyFeed: "Feed historico",
        contentClusterBody: "Listo para generar",
        domainAuditBody: "Brecha de metadata detectada",
        historyFeedBody: "7 acciones registradas esta semana",
        oneWorkspace: "1 espacio",
        oneWorkspaceBody: "Un lugar para contenido, auditoria e historial.",
        fastHandoff: "Transferencia rapida",
        fastHandoffBody: "Flujo mas limpio para founders y operadores.",
        planAware: "Consciente del plan",
        planAwareBody: "Las experiencias free y paid quedan separadas.",
        active: "Activo",
        structured: "Estructurado para ejecucion enfocada",
        guided: "Guiado",
        open: "Abrir",
        readArticle: "Leer articulo",
        sending: "Enviando...",
      },
      fr: {
        live: "Centre en direct",
        readiness: "Etat",
        workspaceHealth: "Sante de l'espace",
        contentCluster: "Cluster de contenu",
        domainAudit: "Audit du domaine",
        historyFeed: "Flux historique",
        contentClusterBody: "Pret pour generation",
        domainAuditBody: "Ecart de metadata detecte",
        historyFeedBody: "7 actions enregistrees cette semaine",
        oneWorkspace: "1 espace",
        oneWorkspaceBody: "Un seul endroit pour contenu, audit et historique.",
        fastHandoff: "Passage rapide",
        fastHandoffBody: "Flux plus propre pour fondateurs et operateurs.",
        planAware: "Lie a l'offre",
        planAwareBody: "Les experiences gratuites et payantes restent separees.",
        active: "Actif",
        structured: "Structure pour une execution concentree",
        guided: "Guide",
        open: "Ouvrir",
        readArticle: "Lire l'article",
        sending: "Envoi...",
      },
      hi: {
        live: "Live command center",
        readiness: "Readiness",
        workspaceHealth: "Workspace health",
        contentCluster: "Content brief cluster",
        domainAudit: "Domain audit",
        historyFeed: "History feed",
        contentClusterBody: "Generation ke liye ready",
        domainAuditBody: "Metadata gap detect hua",
        historyFeedBody: "Is hafte 7 actions log hui",
        oneWorkspace: "1 workspace",
        oneWorkspaceBody: "Content, audit aur history ke liye ek jagah.",
        fastHandoff: "Fast handoff",
        fastHandoffBody: "Founders aur operators ke liye cleaner flow.",
        planAware: "Plan-aware",
        planAwareBody: "Free aur paid experiences alag rehti hain.",
        active: "Active",
        structured: "Focused execution ke liye structured",
        guided: "Guided",
        open: "Open",
        readArticle: "Article padho",
        sending: "Sending...",
      },
    }[uiLanguage],
    language,
    `home-page-ui-${uiLanguage}`,
  );

  const contactStatus =
    contactState === "success"
      ? copy.contact.success
      : contactState === "error"
        ? copy.contact.error
        : copy.contact.helper;

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      try {
        const response = await fetch(`/api/public-blog-posts?language=${uiLanguage}&limit=3`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as { posts?: PublishedBlogPost[] };

        if (isMounted) {
          setPosts(payload.posts ?? []);
        }
      } catch {
        if (isMounted) {
          setPosts([]);
        }
      }
    }

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, [uiLanguage]);

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setContactState("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          company: String(formData.get("company") ?? ""),
          goal: String(formData.get("goal") ?? ""),
          details: String(formData.get("details") ?? ""),
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Contact submit failed");
      }

      form.reset();
      setContactState("success");
    } catch {
      setContactState("error");
    }
  }

  return (
    <div className="site-page min-h-screen overflow-x-hidden text-[var(--foreground)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 left-[-10%] h-[600px] w-[600px] rounded-full bg-[#705dff]/10 blur-[120px]" />
        <div className="absolute right-[-5%] top-[20%] h-[400px] w-[400px] rounded-full bg-[#3d8dff]/8 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] h-[300px] w-[300px] rounded-full bg-[#83f6d7]/5 blur-[80px]" />
      </div>

      <div className="relative z-10 px-3 pt-4">
        <PublicHeader language={uiLanguage} />

        <main className="mx-auto w-full max-w-7xl px-3 pb-24 pt-4 sm:px-6">
          <section
            aria-label="Hero"
            className="animate-fade-up relative overflow-hidden rounded-[2.5rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-7 py-10 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_32px_80px_rgba(0,0,0,0.28)] md:px-12 md:py-14 xl:px-16"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
                backgroundRepeat: "repeat",
                backgroundSize: "128px 128px",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-[#705dff]/12 blur-[90px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 left-[10%] h-[300px] w-[300px] rounded-full bg-[#3d8dff]/8 blur-[70px]"
            />

            <div className="relative inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)] backdrop-blur-sm">
              <SparkDot />
              {copy.hero.badge}
            </div>

            <h1 className="relative mt-6 max-w-5xl text-[clamp(2.6rem,6vw,4.5rem)] font-semibold leading-[0.93] tracking-[-0.03em] text-[var(--foreground)]">
              {copy.hero.title}
            </h1>

            <p className="relative mt-5 max-w-2xl text-[15px] leading-[1.75] text-[var(--site-muted)]">
              {copy.hero.body}
            </p>

            <div className="relative mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="site-button-primary rounded-[14px] px-6 py-3 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(131,246,215,0.18)] active:translate-y-0"
              >
                {copy.hero.primaryCta}
              </Link>
              <a
                href="#workflow"
                className="site-button-secondary rounded-[14px] border px-6 py-3 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
              >
                {copy.hero.workflowCta}
              </a>
              <a
                href="#platform"
                className="site-button-secondary rounded-[14px] border px-6 py-3 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
              >
                {copy.hero.platformCta}
              </a>
            </div>

            <div className="relative mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {copy.heroSignals.map((signal, index) => (
                <article
                  key={signal.title}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="animate-fade-up group rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#877cff]/40 hover:bg-[var(--site-surface)]"
                >
                  <p className="site-accent-text text-[10px] font-semibold uppercase tracking-[0.2em]">
                    {signal.title}
                  </p>
                  <p className="mt-3 text-[13px] leading-[1.7] text-[var(--site-muted)]">{signal.body}</p>
                </article>
              ))}
            </div>
          </section>

          <div aria-label="Trust signals" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {copy.trustBar.map((item) => (
              <div
                key={item}
                className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-3 text-center text-[12px] font-medium text-[var(--site-muted)] backdrop-blur-sm transition-colors duration-200 hover:border-[#877cff]/30"
              >
                {item}
              </div>
            ))}
          </div>

          <section id="platform" aria-labelledby="platform-heading" className="mt-20 scroll-mt-28">
            <header className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionEyebrow>{copy.platform.eyebrow}</SectionEyebrow>
                <h2
                  id="platform-heading"
                  className="mt-2 max-w-3xl text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em]"
                >
                  {copy.platform.title}
                </h2>
              </div>
              <p className="max-w-sm text-[13px] leading-[1.75] text-[var(--site-muted)]">{copy.platform.body}</p>
            </header>

            <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {copy.platform.modules.map((module, index) => (
                <article
                  key={module.title}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="animate-fade-up group relative overflow-hidden rounded-[22px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#8b82ff]/35 hover:shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#6c5cff]/10 blur-2xl transition-all duration-300 group-hover:bg-[#6c5cff]/20"
                  />

                  <p className="site-accent-text relative text-[10px] font-semibold uppercase tracking-[0.2em]">
                    {module.eyebrow}
                  </p>
                  <h3 className="relative mt-4 text-[1.3rem] font-semibold leading-tight">{module.title}</h3>
                  <p className="relative mt-3 text-[13px] leading-[1.7] text-[var(--site-muted)]">{module.body}</p>

                  <div className="relative mt-8 flex items-center gap-2 text-[11px] font-medium text-[var(--site-muted)] opacity-60">
                    <SparkDot />
                    {ui.structured}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            id="workflow"
            aria-labelledby="workflow-heading"
            className="mt-20 scroll-mt-28 grid gap-4 rounded-[2.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 md:p-8 xl:grid-cols-[0.9fr,1.1fr]"
          >
            <article className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-6">
              <SectionEyebrow>{copy.workflow.eyebrow}</SectionEyebrow>
              <h2
                id="workflow-heading"
                className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.02em]"
              >
                {copy.workflow.title}
              </h2>
              <p className="mt-4 max-w-xl text-[13px] leading-[1.75] text-[var(--site-muted)]">
                {copy.workflow.body}
              </p>

              <ul aria-label="Workflow checklist" className="mt-8 space-y-2">
                {copy.workflow.checklist.map((line) => (
                  <li
                    key={line}
                    className="flex items-center gap-3 rounded-[14px] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-[13px] transition-colors duration-200 hover:border-[#877cff]/30"
                  >
                    <SparkDot />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </article>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {copy.workflow.steps.map((item, index) => (
                <article
                  key={item.step}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="animate-fade-up group rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8a80ff]/35"
                >
                  <div className="flex items-center justify-between">
                    <p className="site-accent-text text-[10px] font-semibold uppercase tracking-[0.2em]">
                      {item.step}
                    </p>
                    <span className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--site-muted)]">
                      {ui.guided}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[1.2rem] font-semibold leading-tight">{item.title}</h3>
                  <p className="mt-2 text-[12px] leading-[1.65] text-[var(--site-muted)]">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="blog-heading" className="mt-20">
            <header className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionEyebrow>{copy.blog.eyebrow}</SectionEyebrow>
                <h2
                  id="blog-heading"
                  className="mt-3 max-w-3xl text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em]"
                >
                  {copy.blog.title}
                </h2>
              </div>
              <div className="max-w-sm">
                <p className="text-[13px] leading-[1.75] text-[var(--site-muted)]">{copy.blog.body}</p>
                <Link
                  href={`/${uiLanguage}/blog`}
                  className="site-link-accent group mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold"
                >
                  {copy.blog.cta}
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
                    {"->"}
                  </span>
                </Link>
              </div>
            </header>

            <div className="mt-8 grid gap-3 lg:grid-cols-3">
              {posts.length === 0 ? (
                <article className="rounded-[22px] border border-[var(--site-border)] bg-[var(--site-surface)] p-7 lg:col-span-3">
                  <h3 className="text-[1.3rem] font-semibold leading-tight">No live articles yet</h3>
                  <p className="mt-3 max-w-2xl text-[13px] leading-[1.75] text-[var(--site-muted)]">
                    The public blog feed is live-data only. Publish the first article from the blog admin console and it will appear here.
                  </p>
                  <Link href="/aether-lab-ops" className="site-link-accent mt-5 inline-flex text-[13px] font-semibold">
                    Open publishing console
                  </Link>
                </article>
              ) : (
                posts.map((post) => (
                  <article
                    key={post.slug}
                    className="group flex flex-col rounded-[22px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#877cff]/30 hover:shadow-[0_16px_40px_rgba(0,0,0,0.2)]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--site-muted)] opacity-60">
                      <span>{post.category}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="mt-4 text-[1.2rem] font-semibold leading-tight">{post.title}</h3>
                    <p className="mt-3 flex-1 text-[13px] leading-[1.7] text-[var(--site-muted)]">{post.excerpt}</p>
                    <time dateTime={post.publishedAt} className="mt-5 text-[11px] text-[var(--site-muted)] opacity-50">
                      {formatPublishedDate(post.publishedAt, uiLanguage)}
                    </time>
                    <Link href={`/${uiLanguage}/blog/${post.slug}`} className="site-link-accent mt-4 inline-flex text-[13px] font-semibold">
                      {ui.readArticle}
                    </Link>
                  </article>
                ))
              )}
            </div>
          </section>

          <section id="plans" aria-labelledby="plans-heading" className="mt-20 scroll-mt-28">
            <SectionEyebrow>{copy.plans.free.eyebrow}</SectionEyebrow>
            <h2 id="plans-heading" className="sr-only">
              Pricing plans
            </h2>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <article className="group rounded-[22px] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#877cff]/25">
                <SectionEyebrow>{copy.plans.free.eyebrow}</SectionEyebrow>
                <h3 className="mt-2 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight tracking-[-0.02em]">
                  {copy.plans.free.title}
                </h3>
                <p className="mt-3 max-w-md text-[13px] leading-[1.75] text-[var(--site-muted)]">
                  {copy.plans.free.body}
                </p>
                <ul aria-label="Free plan features" className="mt-7 space-y-2">
                  {copy.plans.free.features.map((feature) => (
                    <li
                      key={feature}
                      className="rounded-[14px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-3 text-[13px]"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth?plan=free"
                  className="site-button-secondary mt-8 inline-flex rounded-[14px] border px-5 py-3 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
                >
                  {copy.plans.free.cta}
                </Link>
              </article>

              <article className="relative overflow-hidden rounded-[22px] border border-[#877cff]/30 bg-[var(--site-surface)] p-8 shadow-[0_0_0_1px_rgba(135,124,255,0.08)_inset] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[var(--site-primary)]/12 blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-[20%] h-32 w-32 rounded-full bg-[#3d8dff]/8 blur-2xl"
                />

                <SectionEyebrow>{copy.plans.paid.eyebrow}</SectionEyebrow>
                <h3 className="relative mt-2 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight tracking-[-0.02em]">
                  {copy.plans.paid.title}
                </h3>
                <p className="relative mt-3 max-w-md text-[13px] leading-[1.75] text-[var(--site-muted)]">
                  {copy.plans.paid.body}
                </p>
                <ul aria-label="Paid plan features" className="relative mt-7 grid gap-2 sm:grid-cols-2">
                  {copy.plans.paid.features.map((feature) => (
                    <li
                      key={feature}
                      className="rounded-[14px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-3 text-[13px]"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/choose-plan"
                  className="site-button-primary relative mt-8 inline-flex rounded-[14px] border px-6 py-3 text-[13px] font-black uppercase tracking-[0.04em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(131,246,215,0.2)]"
                >
                  {copy.plans.paid.cta}
                </Link>
              </article>
            </div>
          </section>

          <section
            id="faq"
            aria-labelledby="faq-heading"
            className="mt-20 scroll-mt-28 grid gap-10 xl:grid-cols-[0.75fr,1.25fr]"
          >
            <header>
              <SectionEyebrow>{copy.faq.eyebrow}</SectionEyebrow>
              <h2
                id="faq-heading"
                className="mt-3 text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.02em]"
              >
                {copy.faq.title}
              </h2>
              <p className="mt-4 max-w-md text-[13px] leading-[1.75] text-[var(--site-muted)]">{copy.faq.body}</p>
            </header>

            <div className="space-y-2">
              {copy.faq.items.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 transition-all duration-300 hover:border-[#877cff]/25 open:border-[#877cff]/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <span className="shrink-0 rounded-full border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--site-muted)]">
                      {ui.open}
                    </span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-[13px] leading-[1.75] text-[var(--site-muted)]">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="contact-heading" className="mt-20 grid gap-4 xl:grid-cols-[0.88fr,1.12fr]">
            <article className="rounded-[22px] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 transition-all duration-300 hover:border-[#877cff]/25">
              <SectionEyebrow>{copy.contact.eyebrow}</SectionEyebrow>
              <h2
                id="contact-heading"
                className="mt-3 text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em] md:text-5xl"
              >
                {copy.contact.title}
              </h2>
              <p className="mt-4 max-w-md text-[13px] leading-[1.75] text-[var(--site-muted)]">{copy.contact.body}</p>

              <ul aria-label="Contact highlights" className="mt-8 space-y-2">
                {[copy.platform.modules[0]?.title, copy.workflow.steps[0]?.title, copy.plans.paid.title].map(
                  (item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-center gap-3 rounded-[14px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-4 text-[13px]"
                    >
                      <SparkDot />
                      <span>{item}</span>
                    </li>
                  ),
                )}
              </ul>
            </article>

            <form
              onSubmit={handleContactSubmit}
              aria-label="Contact form"
              className="rounded-[22px] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.3)]"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold text-[var(--foreground)]">
                    {copy.contact.fields.name}
                  </span>
                  <input
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder={copy.contact.placeholders.name}
                    className="site-input w-full rounded-[14px] border px-4 py-3 text-[13px] outline-none transition-colors duration-200 focus:border-[#8d84ff]/55"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold text-[var(--foreground)]">
                    {copy.contact.fields.email}
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={copy.contact.placeholders.email}
                    className="site-input w-full rounded-[14px] border px-4 py-3 text-[13px] outline-none transition-colors duration-200 focus:border-[#8d84ff]/55"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold text-[var(--foreground)]">
                    {copy.contact.fields.company}
                  </span>
                  <input
                    name="company"
                    type="text"
                    autoComplete="organization"
                    placeholder={copy.contact.placeholders.company}
                    className="site-input w-full rounded-[14px] border px-4 py-3 text-[13px] outline-none transition-colors duration-200 focus:border-[#8d84ff]/55"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold text-[var(--foreground)]">
                    {copy.contact.fields.goal}
                  </span>
                  <input
                    name="goal"
                    type="text"
                    required
                    placeholder={copy.contact.placeholders.goal}
                    className="site-input w-full rounded-[14px] border px-4 py-3 text-[13px] outline-none transition-colors duration-200 focus:border-[#8d84ff]/55"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-[12px] font-semibold text-[var(--foreground)]">
                  {copy.contact.fields.details}
                </span>
                <textarea
                  name="details"
                  rows={5}
                  placeholder={copy.contact.placeholders.details}
                  className="site-input w-full resize-none rounded-[18px] border px-4 py-3 text-[13px] outline-none transition-colors duration-200 focus:border-[#8d84ff]/55"
                />
              </label>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p
                  aria-live="polite"
                  className={`text-[12px] transition-colors duration-300 ${
                    contactState === "success"
                      ? "text-[#83f6d7]"
                      : contactState === "error"
                        ? "text-[#ff9c9c]"
                        : "text-[var(--site-muted)]"
                  }`}
                >
                  {contactStatus}
                </p>

                <button
                  type="submit"
                  disabled={contactState === "sending"}
                  className="site-button-primary rounded-[14px] px-6 py-3 text-[13px] font-black uppercase tracking-[0.04em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(131,246,215,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {contactState === "sending" ? ui.sending : copy.contact.submit}
                </button>
              </div>
            </form>
          </section>

          <section
            aria-labelledby="cta-heading"
            className="relative mt-16 overflow-hidden rounded-[2.2rem] border border-[#877cff]/25 bg-[var(--site-surface)] px-8 py-14 text-center shadow-[0_32px_80px_rgba(0,0,0,0.4)] md:px-12"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-[#705dff]/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-[#3d8dff]/12 blur-3xl"
            />

            <SectionEyebrow>{copy.cta.eyebrow}</SectionEyebrow>
            <h2
              id="cta-heading"
              className="relative mt-4 text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.02em] md:text-5xl"
            >
              {copy.cta.title}
            </h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-[13px] leading-[1.75] text-[var(--site-muted)]">
              {copy.cta.body}
            </p>

            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth"
                className="site-button-primary rounded-[14px] border px-7 py-3.5 text-[13px] font-black uppercase tracking-[0.04em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(131,246,215,0.22)] active:translate-y-0"
              >
                {copy.cta.primary}
              </Link>
              <a
                href="#platform"
                className="site-button-secondary rounded-[14px] border px-7 py-3.5 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
              >
                {copy.cta.secondary}
              </a>
            </div>
          </section>

          <div className="mt-16">
            <PublicFooter language={uiLanguage} />
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";
import { useLanguage } from "@/components/language-provider";
import { type PublishedBlogPost } from "@/lib/blog-post-utils";
import { landingCopy } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

function SparkDot() {
  return <span className="h-2 w-2 rounded-full bg-[#83f6d7] shadow-[0_0_16px_rgba(131,246,215,0.6)]" />;
}

export default function HomePage() {
  const { language, uiLanguage } = useLanguage();
  const copy = useTranslatedCopy(landingCopy[uiLanguage], language, `home-page-copy-${uiLanguage}`);
  const [posts, setPosts] = useState<PublishedBlogPost[]>([]);
  const [contactState, setContactState] = useState<"idle" | "sending" | "success" | "error">("idle");

  const ui = useTranslatedCopy({
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
      sending: "Sending",
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
      sending: "Enviando",
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
      sending: "Envoi",
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
      sending: "Sending",
    },
  }[uiLanguage], language, `home-page-ui-${uiLanguage}`);

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
        const nextPosts = payload.posts || [];

        if (isMounted) {
          setPosts(nextPosts);
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
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error("Discord webhook failed");
      }

      form.reset();
      setContactState("success");
    } catch {
      setContactState("error");
    }
  }

  return (
    <div className="site-page min-h-screen overflow-x-hidden text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(116,96,255,0.24),transparent_32%),radial-gradient(circle_at_top_right,rgba(62,165,255,0.16),transparent_28%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[420px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#3d6dff]/10 blur-3xl" />

      <div className="relative z-10 px-3 pt-4">
        <PublicHeader language={uiLanguage} />

        <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-4 sm:px-6 md:pb-24">
        <section className="site-panel-hero site-animate-rise relative overflow-hidden rounded-[2.25rem] border border-[var(--site-border)] px-6 py-8 shadow-[var(--site-depth-shadow)] sm:px-7 md:px-10 md:py-12 xl:px-14">
          <div className="site-animate-float pointer-events-none absolute -left-24 top-6 h-52 w-52 rounded-full bg-[#705dff]/20 blur-3xl" />
          <div className="site-animate-float pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#3d8dff]/14 blur-3xl" />

          <div className="grid items-center gap-10">
            <div>
              <div className="site-chip inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em]">
                <SparkDot />
                {copy.hero.badge}
              </div>

              <h2 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.95] md:text-6xl xl:text-7xl">
                {copy.hero.title}
              </h2>

              <p className="site-muted mt-6 max-w-2xl text-base leading-7 md:text-lg">{copy.hero.body}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth"
                  className="site-button-primary rounded-2xl px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                >
                  {copy.hero.primaryCta}
                </Link>
                <a
                  href="#workflow"
                  className="site-button-secondary rounded-2xl border px-6 py-3 text-sm font-semibold transition hover:opacity-90"
                >
                  {copy.hero.workflowCta}
                </a>
                <a
                  href="#platform"
                  className="site-button-secondary rounded-2xl border px-6 py-3 text-sm font-semibold transition hover:opacity-90"
                >
                  {copy.hero.platformCta}
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {copy.heroSignals.map((signal) => (
                  <article key={signal.title} className="site-panel-soft site-hover-lift site-animate-rise group rounded-2xl border p-4 transition duration-300 hover:border-[#877cff]/40">
                    <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{signal.title}</p>
                    <p className="site-muted mt-3 text-sm leading-6 group-hover:opacity-90">{signal.body}</p>
                  </article>
                ))}
              </div>
            </div>

          </div>
        </section>

        <section className="site-animate-rise mt-8 grid gap-3 md:grid-cols-4">
          {copy.trustBar.map((item) => (
            <div key={item} className="site-chip site-hover-lift rounded-full border px-5 py-4 text-center text-sm backdrop-blur">
              {item}
            </div>
          ))}
        </section>

        <section id="platform" className="site-animate-rise scroll-mt-28 mt-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="site-accent-text text-xs uppercase tracking-[0.2em]">{copy.platform.eyebrow}</p>
              <h3 className="mt-2 max-w-3xl text-4xl font-semibold md:text-5xl">{copy.platform.title}</h3>
            </div>
            <p className="site-muted max-w-xl text-sm leading-7">{copy.platform.body}</p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {copy.platform.modules.map((module) => (
              <article
                key={module.title}
                className="site-panel site-hover-lift group relative overflow-hidden rounded-[1.75rem] border p-6 transition duration-300 hover:border-[#8b82ff]/35"
              >
                <div className="absolute -right-10 top-4 h-24 w-24 rounded-full bg-[#6c5cff]/10 blur-2xl transition duration-300 group-hover:bg-[#6c5cff]/18" />
                <p className="site-accent-text relative text-xs uppercase tracking-[0.18em]">{module.eyebrow}</p>
                <h4 className="relative mt-4 text-2xl font-semibold leading-tight">{module.title}</h4>
                <p className="site-muted relative mt-4 text-sm leading-7">{module.body}</p>
                <div className="relative mt-8 flex items-center gap-2 text-sm font-medium text-[var(--site-muted)]">
                  <SparkDot />
                  {ui.structured}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="site-panel-hero site-animate-rise scroll-mt-28 mt-16 grid gap-6 rounded-[2rem] border p-6 md:p-8 xl:grid-cols-[0.9fr,1.1fr]">
          <article className="site-panel-soft rounded-[1.75rem] border p-6">
            <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.workflow.eyebrow}</p>
            <h3 className="mt-3 text-4xl font-semibold">{copy.workflow.title}</h3>
            <p className="site-muted mt-4 max-w-xl text-sm leading-7">{copy.workflow.body}</p>

            <div className="mt-8 space-y-3">
              {copy.workflow.checklist.map((line) => (
                <div key={line} className="site-panel-soft flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm">
                  <SparkDot />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            {copy.workflow.steps.map((item) => (
              <article
                key={item.step}
                className="site-panel-soft site-hover-lift group rounded-[1.6rem] border p-5 transition duration-300 hover:border-[#8a80ff]/35"
              >
                <div className="flex items-center justify-between">
                  <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{item.step}</p>
                  <span className="site-chip rounded-full border px-3 py-1 text-xs">{ui.guided}</span>
                </div>
                <h4 className="mt-5 text-2xl font-semibold">{item.title}</h4>
                <p className="site-muted mt-3 text-sm leading-7 group-hover:opacity-90">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="site-animate-rise mt-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.blog.eyebrow}</p>
              <h3 className="mt-3 max-w-3xl text-4xl font-semibold md:text-5xl">{copy.blog.title}</h3>
            </div>
            <div className="max-w-xl">
              <p className="site-muted text-sm leading-7">{copy.blog.body}</p>
              <Link href={`/${uiLanguage}/blog`} className="site-link-accent mt-4 inline-flex text-sm font-semibold">
                {copy.blog.cta}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {posts.length === 0 ? (
              <article className="site-panel rounded-[1.75rem] border p-6 lg:col-span-3">
                <h4 className="text-2xl font-semibold leading-tight">No live articles yet</h4>
                <p className="site-muted mt-4 max-w-2xl text-sm leading-7">
                  The public blog feed is now live-data only. Publish the first article from the blog admin console and it will appear here.
                </p>
                <Link href="/aether-lab-ops" className="site-link-accent mt-6 inline-flex text-sm font-semibold">
                  Open publishing console
                </Link>
              </article>
            ) : (
              posts.map((post) => (
                <article
                  key={post.slug}
                  className="site-panel site-hover-lift rounded-[1.75rem] border p-6"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--site-muted)]">
                    <span>{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h4 className="mt-4 text-2xl font-semibold leading-tight">{post.title}</h4>
                  <p className="site-muted mt-4 text-sm leading-7">{post.excerpt}</p>
                  <p className="site-muted mt-6 text-xs">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                  <Link href={`/${uiLanguage}/blog/${post.slug}`} className="site-link-accent mt-6 inline-flex text-sm font-semibold">
                    {ui.readArticle}
                  </Link>
                </article>
              ))
            )}
          </div>
        </section>

        <section id="plans" className="site-animate-rise scroll-mt-28 mt-16 grid gap-4 xl:grid-cols-2">
          <article className="site-panel site-hover-lift rounded-[1.9rem] border p-7">
            <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.plans.free.eyebrow}</p>
            <h3 className="mt-3 text-4xl font-semibold">{copy.plans.free.title}</h3>
            <p className="site-muted mt-4 max-w-xl text-sm leading-7">{copy.plans.free.body}</p>
            <div className="mt-8 space-y-3">
              {copy.plans.free.features.map((feature) => (
                <div key={feature} className="site-panel-soft rounded-2xl border px-4 py-3 text-sm">
                  {feature}
                </div>
              ))}
            </div>
            <Link href="/auth?plan=free" className="site-button-secondary mt-8 inline-flex rounded-2xl border px-5 py-3 text-sm font-semibold transition hover:opacity-90">
              {copy.plans.free.cta}
            </Link>
          </article>

          <article className="site-panel-vibrant site-hover-lift relative overflow-hidden rounded-[1.9rem] border p-7">
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[var(--site-primary)]/10 blur-3xl" />
            <p className="site-accent-text relative text-xs uppercase tracking-[0.18em]">{copy.plans.paid.eyebrow}</p>
            <h3 className="relative mt-3 text-4xl font-semibold">{copy.plans.paid.title}</h3>
            <p className="site-muted relative mt-4 max-w-xl text-sm leading-7">{copy.plans.paid.body}</p>
            <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
              {copy.plans.paid.features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-3 text-sm">
                  {feature}
                </div>
              ))}
            </div>
            <Link
              href="/choose-plan"
              className="site-button-primary relative mt-8 inline-flex rounded-2xl border px-5 py-3 text-sm font-black uppercase tracking-[0.02em] transition hover:opacity-95 active:opacity-90"
            >
              <span>{copy.plans.paid.cta}</span>
            </Link>
          </article>
        </section>

        <section id="faq" className="site-animate-rise scroll-mt-28 mt-16 grid gap-6 xl:grid-cols-[0.75fr,1.25fr]">
          <article>
            <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.faq.eyebrow}</p>
            <h3 className="mt-3 text-4xl font-semibold">{copy.faq.title}</h3>
            <p className="site-muted mt-4 max-w-lg text-sm leading-7">{copy.faq.body}</p>
          </article>

          <div className="space-y-4">
            {copy.faq.items.map((item) => (
              <details key={item.question} className="site-panel-soft site-hover-lift group rounded-[1.6rem] border p-5 transition">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  <span>{item.question}</span>
                  <span className="site-chip rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]">{ui.open}</span>
                </summary>
                <p className="site-muted mt-4 max-w-3xl text-sm leading-7">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="site-animate-rise mt-16 grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
          <article className="site-panel site-hover-lift rounded-[2rem] border p-7">
            <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.contact.eyebrow}</p>
            <h3 className="mt-3 text-4xl font-semibold md:text-5xl">{copy.contact.title}</h3>
            <p className="site-muted mt-4 max-w-xl text-sm leading-7">{copy.contact.body}</p>

            <div className="mt-8 space-y-4">
              {[
                copy.platform.modules[0]?.title,
                copy.workflow.steps[0]?.title,
                copy.plans.paid.title,
              ].map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="site-panel-soft rounded-[1.4rem] border px-4 py-4 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <SparkDot />
                    <span>{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <form onSubmit={handleContactSubmit} className="site-panel site-hover-lift rounded-[2rem] border p-7 shadow-[0_26px_80px_rgba(10,18,52,0.34)]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">{copy.contact.fields.name}</span>
                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder={copy.contact.placeholders.name}
                  className="site-input w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-[#8d84ff]/55"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">{copy.contact.fields.email}</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={copy.contact.placeholders.email}
                  className="site-input w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-[#8d84ff]/55"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">{copy.contact.fields.company}</span>
                <input
                  name="company"
                  type="text"
                  autoComplete="organization"
                  placeholder={copy.contact.placeholders.company}
                  className="site-input w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-[#8d84ff]/55"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">{copy.contact.fields.goal}</span>
                <input
                  name="goal"
                  type="text"
                  required
                  placeholder={copy.contact.placeholders.goal}
                  className="site-input w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-[#8d84ff]/55"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">{copy.contact.fields.details}</span>
              <textarea
                name="details"
                rows={6}
                placeholder={copy.contact.placeholders.details}
                className="site-input w-full resize-none rounded-[1.5rem] border px-4 py-3 text-sm outline-none transition focus:border-[#8d84ff]/55"
              />
            </label>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p
                className={`text-sm ${
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
                className="site-button-primary rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-[0.02em] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {contactState === "sending" ? ui.sending : copy.contact.submit}
              </button>
            </div>
          </form>
        </section>

        <section className="site-panel-vibrant site-animate-rise mt-16 overflow-hidden rounded-[2rem] border px-7 py-10 text-center shadow-[0_26px_80px_rgba(10,18,52,0.48)] md:px-10">
          <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.cta.eyebrow}</p>
          <h3 className="mt-4 text-4xl font-semibold md:text-5xl">{copy.cta.title}</h3>
          <p className="site-muted mx-auto mt-4 max-w-2xl text-sm leading-7">{copy.cta.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth"
              className="site-button-primary rounded-2xl border px-6 py-3 text-sm font-black uppercase tracking-[0.02em] transition hover:opacity-95 active:opacity-90"
            >
              <span>{copy.cta.primary}</span>
            </Link>
            <a href="#platform" className="site-button-secondary rounded-2xl border px-6 py-3 text-sm font-semibold transition hover:opacity-95">
              {copy.cta.secondary}
            </a>
          </div>
        </section>

        <div className="site-animate-rise">
          <PublicFooter language={uiLanguage} />
        </div>
        </main>
      </div>
    </div>
  );
}

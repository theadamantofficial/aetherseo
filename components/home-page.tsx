"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import LanguageSwitcher from "@/components/language-switcher";
import PublicFooter from "@/components/public-footer";
import ThemeToggle from "@/components/theme-toggle";
import { useLanguage } from "@/components/language-provider";
import { getPublicBlogPosts, landingCopy } from "@/lib/site-language";

function SparkDot() {
  return <span className="h-2 w-2 rounded-full bg-[#83f6d7] shadow-[0_0_16px_rgba(131,246,215,0.6)]" />;
}

export default function HomePage() {
  const { language } = useLanguage();
  const copy = landingCopy[language];
  const posts = getPublicBlogPosts(language).slice(0, 3);
  const [contactState, setContactState] = useState<"idle" | "sending" | "success" | "error">("idle");

  const ui = {
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
  }[language];

  const contactStatus =
    contactState === "success"
      ? copy.contact.success
      : contactState === "error"
        ? copy.contact.error
        : copy.contact.helper;

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
    <div className="site-page min-h-screen overflow-hidden bg-[#050b21] text-[#edf1ff]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(116,96,255,0.24),transparent_32%),radial-gradient(circle_at_top_right,rgba(62,165,255,0.16),transparent_28%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[420px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#3d6dff]/10 blur-3xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-6">
        <div>
          <h1 className="text-xl font-semibold">Aether AI</h1>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">SEO Intelligence</p>
        </div>

        <nav className="site-panel-soft hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
          <a href="#platform" className="rounded-full px-4 py-2 text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
            {copy.nav.platform}
          </a>
          <a href="#workflow" className="rounded-full px-4 py-2 text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
            {copy.nav.workflow}
          </a>
          <Link href={`/${language}/blog`} className="rounded-full px-4 py-2 text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
            {copy.nav.blog}
          </Link>
          <a href="#plans" className="rounded-full px-4 py-2 text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
            {copy.nav.plans}
          </a>
          <a href="#faq" className="rounded-full px-4 py-2 text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
            {copy.nav.faq}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher hrefBuilder={(nextLanguage) => `/${nextLanguage}`} />
          <Link
            href="/auth"
            className="site-button-secondary rounded-full border border-white/20 px-5 py-2 text-sm transition hover:opacity-90"
          >
            {copy.nav.signIn}
          </Link>
          <a
            href="#plans"
            className="site-button-primary rounded-full px-5 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
          >
            {copy.nav.explorePlans}
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-6">
        <section className="site-panel-hero relative overflow-hidden rounded-[2.25rem] border border-white/10 px-7 py-8 shadow-[0_36px_120px_rgba(6,10,34,0.65)] md:px-10 md:py-12 xl:px-14">
          <div className="pointer-events-none absolute -left-24 top-6 h-52 w-52 rounded-full bg-[#705dff]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#3d8dff]/14 blur-3xl" />

          <div className="grid items-center gap-10 xl:grid-cols-[1.05fr,0.95fr]">
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

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {copy.heroSignals.map((signal) => (
                  <article
                    key={signal.title}
                    className="site-panel-soft group rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 hover:border-[#877cff]/40"
                  >
                    <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{signal.title}</p>
                    <p className="site-muted mt-3 text-sm leading-6 group-hover:opacity-90">{signal.body}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 translate-x-3 translate-y-4 rounded-[2rem] bg-[#25336f]/40 blur-2xl" />
              <div className="site-panel relative overflow-hidden rounded-[2rem] border border-white/12 p-5">
                <div className="site-panel-soft flex items-center justify-between rounded-2xl border px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/42">{ui.live}</p>
                    <p className="mt-1 text-lg font-semibold">{ui.workspaceHealth}</p>
                  </div>
                  <div className="rounded-full border border-[#82f0d6]/30 bg-[#82f0d6]/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#82f0d6]">
                    {ui.active}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.78fr,1fr]">
                  <article className="site-panel-soft rounded-[1.5rem] border p-5">
                    <p className="site-accent-text text-xs uppercase tracking-[0.16em]">{ui.workspaceHealth}</p>
                    <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-[#7c6fff]/45 bg-[#0b1232]">
                      <div className="text-center">
                        <p className="text-5xl font-semibold">92</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{ui.readiness}</p>
                      </div>
                    </div>
                    <p className="site-muted mt-5 text-sm leading-6">{copy.workflow.body}</p>
                  </article>

                  <div className="space-y-4">
                    {[
                      [ui.contentCluster, ui.contentClusterBody, "#82f0d6", "74%"],
                      [ui.domainAudit, ui.domainAuditBody, "#ffb56a", "49%"],
                      [ui.historyFeed, ui.historyFeedBody, "#9ba8ff", "88%"],
                    ].map(([title, body, tone, width]) => (
                      <article
                        key={title}
                        className="site-panel-soft group rounded-[1.4rem] border p-4 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{title}</p>
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone as string }} />
                        </div>
                        <p className="site-muted mt-3 text-sm group-hover:opacity-90">{body}</p>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                          <div className="h-full rounded-full" style={{ width: width as string, backgroundColor: tone as string }} />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    [ui.oneWorkspace, ui.oneWorkspaceBody],
                    [ui.fastHandoff, ui.fastHandoffBody],
                    [ui.planAware, ui.planAwareBody],
                  ].map(([title, body]) => (
                    <article key={title} className="site-panel-soft rounded-2xl border p-4 text-sm">
                      <p className="font-semibold text-white">{title}</p>
                      <p className="site-muted mt-2 leading-6">{body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-3 md:grid-cols-4">
          {copy.trustBar.map((item) => (
            <div key={item} className="site-chip rounded-full border px-5 py-4 text-center text-sm backdrop-blur">
              {item}
            </div>
          ))}
        </section>

        <section id="platform" className="mt-16">
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
                className="site-panel group relative overflow-hidden rounded-[1.75rem] border p-6 transition duration-300 hover:-translate-y-1 hover:border-[#8b82ff]/35"
              >
                <div className="absolute -right-10 top-4 h-24 w-24 rounded-full bg-[#6c5cff]/10 blur-2xl transition duration-300 group-hover:bg-[#6c5cff]/18" />
                <p className="site-accent-text relative text-xs uppercase tracking-[0.18em]">{module.eyebrow}</p>
                <h4 className="relative mt-4 text-2xl font-semibold leading-tight">{module.title}</h4>
                <p className="site-muted relative mt-4 text-sm leading-7">{module.body}</p>
                <div className="relative mt-8 flex items-center gap-2 text-sm font-medium text-white/80">
                  <SparkDot />
                  {ui.structured}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="site-panel-hero mt-16 grid gap-6 rounded-[2rem] border p-6 md:p-8 xl:grid-cols-[0.9fr,1.1fr]">
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
                className="site-panel-soft group rounded-[1.6rem] border p-5 transition duration-300 hover:-translate-y-1 hover:border-[#8a80ff]/35"
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

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.blog.eyebrow}</p>
              <h3 className="mt-3 max-w-3xl text-4xl font-semibold md:text-5xl">{copy.blog.title}</h3>
            </div>
            <div className="max-w-xl">
              <p className="site-muted text-sm leading-7">{copy.blog.body}</p>
              <Link href={`/${language}/blog`} className="site-link-accent mt-4 inline-flex text-sm font-semibold">
                {copy.blog.cta}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="site-panel rounded-[1.75rem] border p-6"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/45">
                  <span>{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <h4 className="mt-4 text-2xl font-semibold leading-tight">{post.title}</h4>
                <p className="site-muted mt-4 text-sm leading-7">{post.excerpt}</p>
                <p className="site-muted mt-6 text-xs">{post.date}</p>
                <Link href={`/${language}/blog/${post.slug}`} className="site-link-accent mt-6 inline-flex text-sm font-semibold">
                  {ui.readArticle}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section id="plans" className="mt-16 grid gap-4 xl:grid-cols-2">
          <article className="site-panel rounded-[1.9rem] border p-7">
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
            <Link href="/auth" className="site-button-secondary mt-8 inline-flex rounded-2xl border px-5 py-3 text-sm font-semibold transition hover:opacity-90">
              {copy.plans.free.cta}
            </Link>
          </article>

          <article className="site-panel-vibrant relative overflow-hidden rounded-[1.9rem] border p-7">
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <p className="relative text-xs uppercase tracking-[0.18em] text-white/88">{copy.plans.paid.eyebrow}</p>
            <h3 className="relative mt-3 text-4xl font-semibold">{copy.plans.paid.title}</h3>
            <p className="relative mt-4 max-w-xl text-sm leading-7 text-white/85">{copy.plans.paid.body}</p>
            <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
              {copy.plans.paid.features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-white/12 bg-black/18 px-4 py-3 text-sm text-white/82">
                  {feature}
                </div>
              ))}
            </div>
            <Link
              href="/auth"
              className="site-button-secondary relative mt-8 inline-flex rounded-2xl border px-5 py-3 text-sm font-black uppercase tracking-[0.02em] transition hover:opacity-95 active:opacity-90"
              style={{ backgroundColor: "#ffffff", color: "#000000" }}
            >
              <span>{copy.plans.paid.cta}</span>
            </Link>
          </article>
        </section>

        <section id="faq" className="mt-16 grid gap-6 xl:grid-cols-[0.75fr,1.25fr]">
          <article>
            <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.faq.eyebrow}</p>
            <h3 className="mt-3 text-4xl font-semibold">{copy.faq.title}</h3>
            <p className="site-muted mt-4 max-w-lg text-sm leading-7">{copy.faq.body}</p>
          </article>

          <div className="space-y-4">
            {copy.faq.items.map((item) => (
              <details key={item.question} className="site-panel-soft group rounded-[1.6rem] border p-5 transition">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  <span>{item.question}</span>
                  <span className="site-chip rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]">{ui.open}</span>
                </summary>
                <p className="site-muted mt-4 max-w-3xl text-sm leading-7">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
          <article className="site-panel rounded-[2rem] border p-7">
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

          <form
            onSubmit={handleContactSubmit}
            className="site-panel rounded-[2rem] border p-7 shadow-[0_26px_80px_rgba(10,18,52,0.34)]"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/82">{copy.contact.fields.name}</span>
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
                <span className="mb-2 block text-sm font-medium text-white/82">{copy.contact.fields.email}</span>
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
                <span className="mb-2 block text-sm font-medium text-white/82">{copy.contact.fields.company}</span>
                <input
                  name="company"
                  type="text"
                  autoComplete="organization"
                  placeholder={copy.contact.placeholders.company}
                  className="site-input w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-[#8d84ff]/55"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/82">{copy.contact.fields.goal}</span>
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
              <span className="mb-2 block text-sm font-medium text-white/82">{copy.contact.fields.details}</span>
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
                      : "text-white/58"
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

        <section className="site-panel-vibrant mt-16 overflow-hidden rounded-[2rem] border px-7 py-10 text-center shadow-[0_26px_80px_rgba(10,18,52,0.48)] md:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-white/78">{copy.cta.eyebrow}</p>
          <h3 className="mt-4 text-4xl font-semibold md:text-5xl">{copy.cta.title}</h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/76">{copy.cta.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth"
              className="site-button-secondary rounded-2xl border px-6 py-3 text-sm font-black uppercase tracking-[0.02em] transition hover:opacity-95 active:opacity-90"
              style={{ backgroundColor: "#ffffff", color: "#000000" }}
            >
              <span>{copy.cta.primary}</span>
            </Link>
            <a href="#platform" className="site-button-secondary rounded-2xl border px-6 py-3 text-sm font-semibold transition hover:opacity-95">
              {copy.cta.secondary}
            </a>
          </div>
        </section>

        <PublicFooter language={language} />
      </main>
    </div>
  );
}

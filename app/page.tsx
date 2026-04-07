import Link from "next/link";

/**
 * Render a marketing landing page inspired by the provided design.
 * @returns Full landing screen with CTA flow into auth and app pages.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#050b21] text-[#edf1ff]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <h1 className="text-xl font-semibold">Aether AI</h1>
          <p className="text-xs uppercase tracking-[0.24em] text-white/50">SEO Intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="rounded-full border border-white/20 px-4 py-2 text-sm">
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-[#6252ff] px-4 py-2 text-sm font-semibold text-white"
          >
            Open App
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#141f50] via-[#0d1538] to-[#090f2a] p-8 md:p-14">
          <p className="mb-4 text-sm uppercase tracking-[0.22em] text-[#7c8ce9]">Engine v2.4</p>
          <h2 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Grow Your Website with AI SEO Automation
          </h2>
          <p className="mt-6 max-w-xl text-white/70">
            Manage content generation, auditing, analytics and historical SEO performance in one
            workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/auth"
              className="rounded-xl bg-[#6557ff] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(98,82,255,0.45)]"
            >
              Start Free Trial
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm"
            >
              View Dashboard
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0e173a] p-6">
            <h3 className="text-xl font-semibold">Architected for High Performance</h3>
            <p className="mt-3 text-sm text-white/70">
              Real-time keyword movement, automated audits and AI-assisted content workflows.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0e173a] p-6">
            <h3 className="text-xl font-semibold">Simple, Scalable Pricing</h3>
            <p className="mt-3 text-sm text-white/70">
              Plans designed for solo projects, agencies and enterprise teams.
            </p>
            <Link href="/billing" className="mt-4 inline-block text-sm font-semibold text-[#9990ff]">
              Explore Billing →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

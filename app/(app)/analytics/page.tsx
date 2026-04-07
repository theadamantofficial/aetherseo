/**
 * Render analytics page with trend, keyword table and source split.
 * @returns Analytics screen.
 */
export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="text-sm text-white/60">Real-time SEO performance and traffic insights</p>
        </div>
        <button type="button" className="rounded-xl bg-[#b9b2ff] px-4 py-2 text-sm font-semibold text-[#121a42]">
          Export Data
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Organic Traffic", "842.6k"],
          ["Average Position", "12.8"],
          ["Keyword Growth", "2,148"],
          ["Domain Authority", "68"],
        ].map(([title, value]) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-[#0f1738] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">{title}</p>
            <p className="mt-2 text-4xl font-semibold">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
        <h2 className="text-2xl font-semibold">Organic Traffic Over Time</h2>
        <div className="mt-5 h-64 rounded-xl border border-white/10 bg-gradient-to-t from-[#1f2c73]/50 to-[#111936]" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-6 lg:col-span-2">
          <h3 className="text-2xl font-semibold">Top Performing Keywords</h3>
          <div className="mt-5 space-y-3 text-sm">
            {[
              ["ai marketing tools", "42.5k", "+18%"],
              ["seo intelligence platform", "18.2k", "+5%"],
              ["automated content generation", "8.9k", "+24%"],
              ["competitor analysis ai", "12.1k", "-2%"],
            ].map((row) => (
              <div key={row[0]} className="grid grid-cols-3 rounded-xl bg-white/5 p-3">
                <span>{row[0]}</span>
                <span>{row[1]}</span>
                <span className="text-right">{row[2]}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
          <h3 className="text-2xl font-semibold">Traffic Source Breakdown</h3>
          <div className="mx-auto mt-6 flex h-44 w-44 items-center justify-center rounded-full border-[14px] border-[#634fff]">
            <div className="text-center">
              <p className="text-4xl font-semibold">100%</p>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Total Share</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

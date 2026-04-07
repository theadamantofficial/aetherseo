/**
 * Render SEO audit report page with score and recommendations.
 * @returns Website audit page.
 */
export default function WebsiteAuditPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-5xl font-semibold">Domain Health Analysis</h1>
        <p className="mt-3 text-sm text-white/65">
          Deep crawl and technical diagnostic for enterprise-level performance.
        </p>
      </div>

      <section className="flex gap-3 rounded-2xl border border-white/10 bg-[#0f1738] p-4">
        <input
          type="text"
          defaultValue="https://www.yourdomain.com"
          className="w-full rounded-xl bg-[#151f46] px-4 py-3 text-white/90 outline-none"
        />
        <button type="button" className="rounded-xl bg-[#5f52f2] px-7 py-3 font-semibold">
          Audit Now
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-8">
          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full border-[16px] border-[#7d6cff]">
            <div className="text-center">
              <p className="text-7xl font-semibold">83</p>
              <p className="text-sm uppercase tracking-[0.2em] text-white/55">SEO Score</p>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-sm text-center text-sm text-white/65">
            Your technical health is excellent. Focus on backlink quality and mobile LCP metrics.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
          <h2 className="text-3xl font-semibold">Audit Breakdown</h2>
          <div className="mt-5 space-y-3">
            {[
              ["Missing Meta Descriptions", "Critical"],
              ["LCP Over 2.5s", "Warning"],
              ["SSL Certificate Valid", "Good"],
            ].map((item) => (
              <div key={item[0]} className="rounded-xl bg-white/5 p-4">
                <p className="font-medium">{item[0]}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-white/55">{item[1]}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <h3 className="text-2xl font-semibold">AI Fix Recommendations</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Automate Alt Text",
            "JSON-LD Generator",
            "NextGen Image Conversion",
          ].map((title) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
              <h4 className="text-xl font-semibold">{title}</h4>
              <p className="mt-2 text-sm text-white/65">Deploy AI-powered optimization instantly.</p>
              <button type="button" className="mt-4 text-sm font-semibold text-[#9f97ff]">
                Launch →
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Render the dashboard overview with metric cards and activity feed.
 * @returns Dashboard page.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Current Usage", value: "4 / 10", sub: "Blogs generated this month" },
          { title: "Organic Traffic", value: "84.2k", sub: "+24.5% this month" },
          { title: "Top 10 Keywords", value: "158", sub: "Visibility score +4.2%" },
        ].map((card) => (
          <article key={card.title} className="rounded-2xl border border-white/10 bg-[#0f1738] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">{card.title}</p>
            <p className="mt-3 text-4xl font-semibold">{card.value}</p>
            <p className="mt-1 text-sm text-white/60">{card.sub}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[#7665ff]/45 bg-gradient-to-r from-[#4f43e7] to-[#6b62ff] p-7">
          <h2 className="text-4xl font-semibold">Generate AI Blog Content</h2>
          <p className="mt-3 max-w-md text-sm text-white/85">
            Create SEO-optimized articles in seconds with your target keyword and tone.
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#2a2a74]"
          >
            Create New Draft →
          </button>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#353d54] p-7">
          <h2 className="text-4xl font-semibold">Comprehensive Website Audit</h2>
          <p className="mt-3 max-w-md text-sm text-white/75">
            Deep scan your domain for technical SEO issues and performance bottlenecks.
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-[#6253f1] px-4 py-2 text-sm font-semibold text-white"
          >
            Start Full Scan →
          </button>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Recent Activity</h3>
            <button type="button" className="text-sm text-[#9b92ff]">
              View History
            </button>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <p>Blog Generated: “Future of SaaS Architecture”</p>
              <span className="text-[#67e9cf]">Completed</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <p>Website Audit: aetherai.io</p>
              <span className="text-[#8b81ff]">Active</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <p>Blog Draft: “Mastering Tonal Design”</p>
              <span className="text-white/50">Draft</span>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
          <h3 className="text-2xl font-semibold">Domain Health</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between rounded-xl bg-white/5 p-3">
              <span>Page Speed</span>
              <strong>98/100</strong>
            </div>
            <div className="flex justify-between rounded-xl bg-white/5 p-3">
              <span>Backlinks</span>
              <strong>1,204</strong>
            </div>
            <div className="flex justify-between rounded-xl bg-white/5 p-3">
              <span>Dead Links</span>
              <strong>2</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

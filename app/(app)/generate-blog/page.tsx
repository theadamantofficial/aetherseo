/**
 * Render the blog generation workspace view.
 * @returns Generate blog page.
 */
export default function GenerateBlogPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <section className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
        <h1 className="text-3xl font-semibold">Generate Blog</h1>
        <p className="mt-2 text-sm text-white/60">Craft SEO-optimized articles with editorial precision.</p>
        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">Focus Keyword</p>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">Sustainable Fashion Trends 2024</div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">Content Tone</p>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">Professional & Authoritative</div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">Article Length</p>
            <div className="flex gap-2">
              {["Short", "Medium", "Long"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`rounded-lg px-3 py-2 ${opt === "Medium" ? "bg-[#5d50f2]" : "bg-white/10"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="w-full rounded-xl bg-[#5d50f2] px-4 py-3 font-semibold">
            Generate Blog ✦
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f1738] p-8">
        <h2 className="max-w-3xl text-5xl font-semibold leading-tight">
          The Future of Content: How Generative AI is Reshaping Editorial Standards
        </h2>
        <p className="mt-4 text-sm text-white/60">May 24, 2024 • 8 min read • Technology</p>
        <div className="mt-8 space-y-5 text-white/85">
          <p>
            In an era defined by rapid technological acceleration, creators use large language
            models to augment storytelling while preserving clarity and depth.
          </p>
          <h3 className="text-3xl font-semibold">The Rise of Co-Intelligence</h3>
          <p>
            AI supports synthesis, research and first-draft generation, while human reviewers
            provide context, voice and strategic editorial direction.
          </p>
          <div className="h-56 rounded-2xl border border-white/10 bg-gradient-to-r from-[#10214f] to-[#17376f]" />
          <h3 className="text-3xl font-semibold">Maintaining Editorial Integrity</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>• Focus on unique insights that generic datasets cannot provide.</li>
            <li>• Generate multiple viewpoints, then synthesize into a coherent voice.</li>
            <li>• Prioritize fact-checking and tonal consistency before publishing.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

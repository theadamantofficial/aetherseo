/**
 * Render billing and subscription management page.
 * @returns Billing page.
 */
export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Billing & Subscription</h1>
      <section className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9b92ff]">Current Plan</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-5xl font-semibold">Enterprise Pro</h2>
            <p className="text-5xl font-semibold">
              $149<span className="text-xl text-white/55">/mo</span>
            </p>
          </div>
          <button type="button" className="mt-6 rounded-xl bg-[#2f3c65] px-4 py-2 text-sm font-semibold">
            Manage Subscription
          </button>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
          <h3 className="text-2xl font-semibold">Invoice History</h3>
          <div className="mt-4 space-y-3 text-sm">
            {["Sep 14, 2024 — $149.00", "Aug 14, 2024 — $149.00", "Jul 14, 2024 — $149.00"].map(
              (invoice) => (
                <div key={invoice} className="rounded-xl bg-white/5 p-3">
                  {invoice}
                </div>
              ),
            )}
          </div>
        </article>
      </section>

      <section>
        <h3 className="text-center text-4xl font-semibold">Upgrade or Adjust Your Plan</h3>
        <p className="mt-2 text-center text-sm text-white/65">
          Transparent pricing designed for every stage of your growth.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Free", "$0/mo", "Perfect for side projects"],
            ["Pro", "$149/mo", "For professional growth"],
            ["Agency", "$499/mo", "Unlimited power for teams"],
          ].map((plan, index) => (
            <article
              key={plan[0]}
              className={`rounded-2xl border p-6 ${
                index === 1 ? "border-[#6b5dff] bg-[#131b42]" : "border-white/10 bg-[#0f1738]"
              }`}
            >
              <h4 className="text-3xl font-semibold">{plan[0]}</h4>
              <p className="mt-3 text-5xl font-semibold">{plan[1]}</p>
              <p className="mt-2 text-sm text-white/65">{plan[2]}</p>
              <button
                type="button"
                className={`mt-8 w-full rounded-xl px-4 py-3 text-sm font-semibold ${
                  index === 1 ? "bg-[#5f52f2]" : "bg-[#24305b]"
                }`}
              >
                {index === 1 ? "Already Active" : "Choose Plan"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

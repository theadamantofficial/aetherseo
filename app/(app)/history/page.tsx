/**
 * Render content history and archive table.
 * @returns History page.
 */
export default function HistoryPage() {
  const items = [
    ["The Future of Generative AI in SaaS", "Generate Blog", "Oct 24, 2024", "Published"],
    ["Quarterly SEO Performance Audit", "Website Audit", "Oct 22, 2024", "Archived"],
    ["10 Tips for Technical SEO Mastery", "Generate Blog", "Oct 20, 2024", "Draft"],
    ["Backlink Health Check: Q3", "Website Audit", "Oct 18, 2024", "Completed"],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">History and Archive</h1>
      <div className="flex flex-wrap gap-2">
        {["All Items", "Blogs", "Audits", "Reports"].map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${index === 0 ? "bg-[#5d50f2]" : "bg-white/10"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f1738]">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/45">
            <tr>
              <th className="p-4">Document Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Created Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item[0]} className="border-b border-white/5 text-sm">
                <td className="p-4">{item[0]}</td>
                <td className="p-4 text-white/70">{item[1]}</td>
                <td className="p-4 text-white/70">{item[2]}</td>
                <td className="p-4">{item[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/**
 * Render a simple terms of service placeholder page.
 * @returns Terms of service page.
 */
export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#050b21] px-6 py-12 text-[#edf1ff]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0f1738] p-8">
        <h1 className="text-4xl font-semibold">Terms of Service</h1>
        <p className="mt-4 text-sm text-white/70">
          This is a placeholder terms page for the prototype flow. Replace this content with your
          legal terms before production launch.
        </p>
      </div>
    </main>
  );
}

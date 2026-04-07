/**
 * Render a simple privacy policy placeholder page.
 * @returns Privacy policy page.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#050b21] px-6 py-12 text-[#edf1ff]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0f1738] p-8">
        <h1 className="text-4xl font-semibold">Privacy Policy</h1>
        <p className="mt-4 text-sm text-white/70">
          This is a placeholder policy page for the prototype flow. Replace this content with your
          legal copy before production launch.
        </p>
      </div>
    </main>
  );
}

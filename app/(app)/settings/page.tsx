/**
 * Render account settings placeholder page for navigation completeness.
 * @returns Settings page.
 */
export default function SettingsPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f1738] p-8">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <p className="mt-3 max-w-2xl text-sm text-white/65">
        Configure workspace branding, notification preferences, user roles and API integrations.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl bg-white/5 p-4">
          <h2 className="text-lg font-semibold">Workspace Preferences</h2>
          <p className="mt-2 text-sm text-white/65">Manage locale, timezone and interface defaults.</p>
        </article>
        <article className="rounded-xl bg-white/5 p-4">
          <h2 className="text-lg font-semibold">Security Controls</h2>
          <p className="mt-2 text-sm text-white/65">Set MFA, SSO and access control policies.</p>
        </article>
      </div>
    </div>
  );
}

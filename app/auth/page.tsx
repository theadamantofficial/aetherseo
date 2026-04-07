import Link from "next/link";

/**
 * Render the login page styled to match the provided authentication mock.
 * @returns Authentication screen with social and email actions.
 */
export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050b21] px-4 py-12 text-[#edf1ff]">
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#5548ff]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-[#742cff]/20 blur-3xl" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#161f47] text-lg">
            ✦
          </div>
          <h1 className="text-4xl font-semibold">Aether AI</h1>
          <p className="mt-2 text-sm text-white/65">Elevate your enterprise intelligence</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0b1434]/95 p-7 shadow-[0_24px_50px_rgba(0,0,0,0.45)]">
          <h2 className="text-3xl font-semibold">Welcome back</h2>
          <p className="mt-2 text-sm text-white/60">
            Continue to your dashboard to manage your SEO audits.
          </p>

          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-[#3a425a] px-4 py-3 text-sm font-medium text-white"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/40">
            <span className="h-px flex-1 bg-white/15" />
            Or Email
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <label className="block text-xs uppercase tracking-[0.16em] text-white/45">Email Address</label>
          <input
            type="email"
            placeholder="name@company.com"
            className="mt-2 w-full border-b border-white/15 bg-transparent px-0 py-2 text-sm outline-none placeholder:text-white/35"
          />

          <div className="mt-5 flex items-center justify-between">
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Password</label>
            <button type="button" className="text-xs text-white/65">
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            defaultValue="password"
            className="mt-2 w-full border-b border-white/15 bg-transparent px-0 py-2 text-sm outline-none"
          />

          <Link
            href="/dashboard"
            className="mt-7 block w-full rounded-xl bg-[#5d50f2] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(93,80,242,0.5)]"
          >
            Sign In →
          </Link>

          <p className="mt-6 text-center text-sm text-white/60">
            Don&apos;t have an account?{" "}
            <span className="font-semibold text-white/90">Create Account</span>
          </p>
        </div>
      </div>
    </div>
  );
}

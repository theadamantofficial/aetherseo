"use client";

/**
 * theme-provider.tsx
 *
 * Logic is identical to the original - only the exported UI component
 * (SiteThemeToggle) is new. Drop this file in place of the old one
 * and swap <SitePreferences /> references to <SiteThemeToggle /> where needed.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useCookieConsent } from "@/components/cookie-consent-provider";

/* ─── types ─────────────────────────────────────────────── */

type ThemeMode = "auto" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

/* ─── constants ─────────────────────────────────────────── */

const STORAGE_KEY = "aether-site-theme-mode";
const CONSENT_COOKIE = "aether-cookie-consent=accepted";
const INITIAL_MODE: ThemeMode = "auto";
const INITIAL_RESOLVED_THEME: ResolvedTheme = "dark";

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ─── helpers ───────────────────────────────────────────── */

function getAutoTheme(): ResolvedTheme {
  const h = new Date().getHours();
  return h >= 7 && h < 19 ? "light" : "dark";
}

function hasStoredPreferenceConsent() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").includes(CONSENT_COOKIE);
}

function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined" || !hasStoredPreferenceConsent()) {
    return "auto";
  }
  const s = window.localStorage.getItem(STORAGE_KEY);
  return s === "light" || s === "dark" || s === "auto" ? s : "auto";
}

/* ─── ThemeProvider ─────────────────────────────────────── */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { canStorePreferences } = useCookieConsent();
  const [mode, setMode] = useState<ThemeMode>(INITIAL_MODE);
  const [autoTheme, setAutoTheme] = useState<ResolvedTheme>(INITIAL_RESOLVED_THEME);

  const resolvedTheme = mode === "auto" ? autoTheme : mode;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setAutoTheme(getAutoTheme());
      setMode(getStoredThemeMode());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    if (canStorePreferences) window.localStorage.setItem(STORAGE_KEY, mode);
  }, [canStorePreferences, mode, resolvedTheme]);

  useEffect(() => {
    if (mode !== "auto") return;
    const id = window.setInterval(() => setAutoTheme(getAutoTheme()), 60_000);
    return () => window.clearInterval(id);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode: (next: ThemeMode) => {
        if (next === "auto") setAutoTheme(getAutoTheme());
        setMode(next);
      },
    }),
    [mode, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/* ─── icons ─────────────────────────────────────────────── */

function IconSun({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className} aria-hidden>
      <circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M6.5 1v1M6.5 11v1M1 6.5h1M11 6.5h1M2.9 2.9l.7.7M9.4 9.4l.7.7M9.4 2.9l-.7.7M3.6 9.4l-.7.7"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className} aria-hidden>
      <path
        d="M10.5 7.5A5 5 0 015.5 2.5a5 5 0 100 8 5 5 0 005-3z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAuto({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className} aria-hidden>
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M6.5 2v1M6.5 10v1M2 6.5h1M10 6.5h1M3.6 3.6l.7.7M8.7 8.7l.7.7"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── mode config ───────────────────────────────────────── */

type ModeConfig = {
  id: ThemeMode;
  label: string;
  desc: string;
  icon: React.ReactNode;
};

const MODES: ModeConfig[] = [
  { id: "light", label: "Light", desc: "Always light", icon: <IconSun /> },
  { id: "auto", label: "Auto", desc: "By time of day", icon: <IconAuto /> },
  { id: "dark", label: "Dark", desc: "Always dark", icon: <IconMoon /> },
];

/* ─── ThemePreview mini-renders ─────────────────────────── */

function LightPreview() {
  return (
    <div className="h-full w-full" style={{ background: "#f5f4f0" }}>
      <div
        className="flex items-center gap-1 border-b px-2"
        style={{ height: 18, background: "#fff", borderColor: "#e5e3dc" }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "#d4d2c9" }} />
        ))}
      </div>
      {[60, 80, 42].map((w, i) => (
        <div key={i} className="mx-2 mt-1.5 h-1 rounded-full" style={{ width: `${w}%`, background: "#e5e3dc" }} />
      ))}
    </div>
  );
}

function DarkPreview() {
  return (
    <div className="h-full w-full" style={{ background: "#141413" }}>
      <div
        className="flex items-center gap-1 border-b px-2"
        style={{ height: 18, background: "#1c1c1a", borderColor: "#2a2a28" }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "#3a3a38" }} />
        ))}
      </div>
      {[60, 80, 42].map((w, i) => (
        <div
          key={i}
          className="mx-2 mt-1.5 h-1 rounded-full"
          style={{ width: `${w}%`, background: i === 1 ? "#333330" : "#2a2a28" }}
        />
      ))}
    </div>
  );
}

function AutoPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1/2" style={{ background: "#f5f4f0" }} />
      <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: "#141413" }} />
      <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--color-border-secondary)]" />
      <div
        className="pointer-events-none absolute inset-x-0 h-3 opacity-60"
        style={{
          background: "linear-gradient(to bottom,transparent,rgba(255,255,255,.07),transparent)",
          animation: "themeScan 3s linear infinite",
        }}
      />
      <div className="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)]">
        <IconAuto className="text-[var(--color-text-secondary)]" />
      </div>
    </div>
  );
}

const PREVIEW_MAP: Record<ThemeMode, React.ReactNode> = {
  light: <LightPreview />,
  dark: <DarkPreview />,
  auto: <AutoPreview />,
};

/* ─── SiteThemeToggle ───────────────────────────────────── */

export function SiteThemeToggle({ className }: { className?: string }) {
  const { mode, resolvedTheme, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const TriggerIcon =
    mode === "dark" ? IconMoon : mode === "light" ? IconSun : IconAuto;

  if (!isMounted) {
    return (
      <div ref={ref} className={`relative ${className ?? ""}`}>
        <button
          type="button"
          aria-label="Theme preference"
          aria-expanded={false}
          disabled
          className="flex items-center gap-1.5 rounded-full border border-[var(--site-border)] bg-[var(--site-panel)] px-3 py-2 text-[12px] text-[var(--site-muted)]"
        >
          <IconAuto />
          <span className="hidden sm:inline capitalize">auto</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M2 3.5l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme preference"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-[var(--site-border)] bg-[var(--site-panel)] px-3 py-2 text-[12px] text-[var(--site-muted)] transition-colors hover:border-[var(--site-border-strong)] hover:text-[var(--site-fg)]"
      >
        <TriggerIcon />
        <span className="hidden sm:inline capitalize">{mode}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 3.5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] overflow-hidden rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-bg)]"
          style={{ animation: "themeMenuOpen .25s cubic-bezier(.16,1,.3,1) both" }}
        >
          <div className="flex items-center justify-between border-b border-[var(--site-border)] px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">Appearance</p>
              <p className="mt-0.5 text-[13px] font-medium text-[var(--site-fg)]">Display mode</p>
            </div>
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border border-dashed border-[var(--site-border)] opacity-60"
                style={{ animation: "glowCycle 2.5s ease-in-out infinite" }}
              />
              <div className="absolute inset-[6px] rounded-full border border-[var(--site-border)] opacity-40" />
              <div className="h-3 w-3 rounded-full bg-[var(--site-fg)]" />
              <div
                className="absolute left-1/2 top-1/2"
                style={{ transformOrigin: "0 0", animation: "themeOrbit 3s linear infinite" }}
              >
                <div className="h-[5px] w-[5px] rounded-full bg-[var(--site-muted)] opacity-70" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            {MODES.map(({ id, label, desc }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMode(id);
                    setOpen(false);
                  }}
                  className={`group relative overflow-hidden rounded-xl border text-left transition-colors ${
                    active
                      ? "border-[var(--site-fg)] bg-[var(--site-panel)]"
                      : "border-[var(--site-border)] bg-[var(--site-panel)] hover:border-[var(--site-border-strong)]"
                  }`}
                >
                  <div className="h-[60px] w-full overflow-hidden">{PREVIEW_MAP[id]}</div>
                  <div className="flex items-center justify-between border-t border-[var(--site-border)] px-2 py-2">
                    <div>
                      <p className="text-[12px] font-medium text-[var(--site-fg)]">{label}</p>
                      <p className="text-[10px] text-[var(--site-muted)]">{desc}</p>
                    </div>
                    {active && (
                      <div className="h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--site-fg)]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--site-border)] bg-[var(--site-panel)] px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <div
                className="h-[6px] w-[6px] rounded-full bg-emerald-500 opacity-80"
                style={{ animation: "glowCycle 2s ease-in-out infinite" }}
              />
              <p className="text-[11px] text-[var(--site-muted)]">
                {mode === "auto"
                  ? `Auto · currently ${resolvedTheme}`
                  : `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode active`}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[var(--site-border)] px-2.5 py-1 text-[10px] text-[var(--site-muted)]">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
                <path d="M5 2.5v2.5l1.5 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              {mode === "auto" ? "07:00-19:00" : "Always on"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

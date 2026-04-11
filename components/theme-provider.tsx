"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useCookieConsent } from "@/components/cookie-consent-provider";

type ThemeMode = "auto" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "aether-site-theme-mode";
const CONSENT_COOKIE = "aether-cookie-consent=accepted";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getAutoTheme(): ResolvedTheme {
  const currentHour = new Date().getHours();
  return currentHour >= 7 && currentHour < 19 ? "light" : "dark";
}

function hasStoredPreferenceConsent() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie.split("; ").includes(CONSENT_COOKIE);
}

function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined" || !hasStoredPreferenceConsent()) {
    return "auto";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { canStorePreferences } = useCookieConsent();
  const [mode, setMode] = useState<ThemeMode>(() => getStoredThemeMode());
  const [autoTheme, setAutoTheme] = useState<ResolvedTheme>(() => getAutoTheme());
  const resolvedTheme = mode === "auto" ? autoTheme : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;

    if (canStorePreferences) {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [canStorePreferences, mode, resolvedTheme]);

  useEffect(() => {
    if (mode !== "auto") {
      return;
    }

    const interval = window.setInterval(() => {
      setAutoTheme(getAutoTheme());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode: (nextMode: ThemeMode) => {
        if (nextMode === "auto") {
          setAutoTheme(getAutoTheme());
        }

        setMode(nextMode);
      },
    }),
    [mode, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

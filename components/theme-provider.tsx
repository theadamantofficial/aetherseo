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
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getAutoTheme(): ResolvedTheme {
  const currentHour = new Date().getHours();
  return currentHour >= 7 && currentHour < 19 ? "light" : "dark";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === "auto" ? getAutoTheme() : mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { canStorePreferences } = useCookieConsent();
  const [mode, setMode] = useState<ThemeMode>("auto");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    if (!canStorePreferences) {
      const nextMode = "auto";
      setMode(nextMode);
      setResolvedTheme(resolveTheme(nextMode));
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const nextMode = stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
    setMode(nextMode);
    setResolvedTheme(resolveTheme(nextMode));
  }, [canStorePreferences]);

  useEffect(() => {
    const nextTheme = resolveTheme(mode);
    setResolvedTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;

    if (canStorePreferences) {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }

    if (mode !== "auto") {
      return;
    }

    const interval = window.setInterval(() => {
      const autoTheme = getAutoTheme();
        setResolvedTheme(autoTheme);
        document.documentElement.dataset.theme = autoTheme;
        document.documentElement.style.colorScheme = autoTheme;
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [canStorePreferences, mode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode,
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

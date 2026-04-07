"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { defaultLanguage, siteLanguageCookieName, type SiteLanguage } from "@/lib/site-language";

const STORAGE_KEY = siteLanguageCookieName;

type LanguageContextValue = {
  language: SiteLanguage;
  setLanguage: (language: SiteLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: SiteLanguage;
}) {
  const [language, setLanguage] = useState<SiteLanguage>(initialLanguage ?? defaultLanguage);

  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "en" || stored === "es" || stored === "fr" || stored === "hi") {
      setLanguage(stored);
    }
  }, [initialLanguage]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.cookie = `${siteLanguageCookieName}=${language}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useCookieConsent } from "@/components/cookie-consent-provider";
import {
  defaultLanguage,
  isKnownPreferredLanguage,
  resolveUiLanguage,
  siteLanguageCookieName,
  type PreferredLanguageCode,
  type SiteLanguage,
} from "@/lib/site-language";

const STORAGE_KEY = siteLanguageCookieName;

type LanguageContextValue = {
  language: PreferredLanguageCode;
  uiLanguage: SiteLanguage;
  setLanguage: (language: PreferredLanguageCode) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: SiteLanguage;
}) {
  const { canStorePreferences } = useCookieConsent();
  const [language, setLanguage] = useState<PreferredLanguageCode>(initialLanguage ?? defaultLanguage);
  const uiLanguage = resolveUiLanguage(language, defaultLanguage);

  useEffect(() => {
    if (!canStorePreferences) {
      if (initialLanguage) {
        setLanguage(initialLanguage);
      }
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored && isKnownPreferredLanguage(stored)) {
      setLanguage(stored);
      return;
    }

    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [canStorePreferences, initialLanguage]);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;

    if (!canStorePreferences) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, language);
    document.cookie = `${siteLanguageCookieName}=${uiLanguage}; path=/; max-age=31536000; samesite=lax`;
  }, [canStorePreferences, language, uiLanguage]);

  return (
    <LanguageContext.Provider value={{ language, uiLanguage, setLanguage }}>
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

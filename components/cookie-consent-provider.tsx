"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CookieConsentStatus = "accepted" | "declined" | null;

type CookieConsentContextValue = {
  consent: CookieConsentStatus;
  canStorePreferences: boolean;
  acceptCookies: () => void;
  declineCookies: () => void;
};

const STORAGE_KEY = "aether-cookie-consent";
const COOKIE_KEY = "aether-cookie-consent";

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function persistConsent(value: Exclude<CookieConsentStatus, null>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {}

  try {
    document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentStatus>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "accepted" || stored === "declined") {
      setConsent(stored);
      return;
    }

    const cookieValue = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${COOKIE_KEY}=`))
      ?.split("=")[1];

    if (cookieValue === "accepted" || cookieValue === "declined") {
      setConsent(cookieValue);
    }
  }, []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      canStorePreferences: consent === "accepted",
      acceptCookies: () => {
        setConsent("accepted");
        persistConsent("accepted");
      },
      declineCookies: () => {
        setConsent("declined");
        persistConsent("declined");
      },
    }),
    [consent],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {consent === null ? <CookieConsentBanner /> : null}
    </CookieConsentContext.Provider>
  );
}

function CookieConsentBanner() {
  const { acceptCookies, declineCookies } = useCookieConsent();
  const [isHidden, setIsHidden] = useState(false);

  function handleAccept() {
    setIsHidden(true);
    acceptCookies();
  }

  function handleDecline() {
    setIsHidden(true);
    declineCookies();
  }

  if (isHidden) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 lg:bottom-2">
      <div className="cookie-consent pointer-events-auto mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[1.75rem] border p-5 shadow-2xl lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]">
            Cookie preferences
          </p>
          <h2 className="mt-2 text-xl font-semibold">Allow cookies to save your preferences and workspace experience</h2>
          <p className="site-muted mt-2 text-sm leading-6">
            We use essential storage for authentication and core app behavior. With your permission, we also store language,
            theme, and translation preferences to keep the site consistent across visits.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/privacy-policy" className="site-link-accent">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="site-link-accent">
              Terms of Service
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="site-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="site-button-primary rounded-full px-5 py-3 text-sm font-semibold"
          >
            Accept cookies
          </button>
        </div>
      </div>
    </div>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }

  return context;
}

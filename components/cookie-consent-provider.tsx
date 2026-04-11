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
    <div className="pointer-events-none fixed bottom-4 left-4 z-[80]">
      <div className="cookie-consent pointer-events-auto w-72 rounded-xl border p-5 shadow-lg">
        <div className="text-3xl leading-none">🍪</div>
        <p className="mt-3 text-sm leading-relaxed">
          We use cookies for essential website functions and to better understand how you use our site, so we can create the best possible experience for you.
        </p>
        <div className="mt-3">
          <Link href="/privacy-policy" className="site-link-accent text-sm">
            Privacy Policy
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleAccept}
            className="site-button-primary rounded-lg px-5 py-2 text-sm font-semibold"
          >
            Got it
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="text-sm text-[var(--site-muted)] transition-colors hover:text-[var(--foreground)]"
          >
            Decline
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

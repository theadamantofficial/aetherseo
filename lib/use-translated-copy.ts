"use client";

import { useEffect, useMemo, useState } from "react";
import { useCookieConsent } from "@/components/cookie-consent-provider";
import { isSiteLanguage } from "@/lib/site-language";

const translationCache = new Map<string, unknown>();

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function mergeTranslatedValue<T>(source: T, candidate: unknown): T {
  if (source === null || source === undefined) {
    return source;
  }

  if (Array.isArray(source)) {
    if (!Array.isArray(candidate)) {
      return source;
    }

    return source.map((item, index) => mergeTranslatedValue(item, candidate[index])) as T;
  }

  if (typeof source === "object") {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
      return source;
    }

    return Object.fromEntries(
      Object.entries(source).map(([key, value]) => [
        key,
        mergeTranslatedValue(value, (candidate as Record<string, unknown>)[key]),
      ]),
    ) as T;
  }

  return typeof candidate === typeof source ? (candidate as T) : source;
}

export function useTranslatedCopy<T>(
  source: T,
  language: string,
  cacheKey: string,
): T {
  const { canStorePreferences } = useCookieConsent();
  const serializedSource = useMemo(() => JSON.stringify(source), [source]);
  const sourceHash = useMemo(() => hashString(serializedSource), [serializedSource]);
  const stableSource = useMemo(() => source, [sourceHash]);
  const translationKey = useMemo(
    () => `aether-ui-translation:${language}:${cacheKey}:${sourceHash}`,
    [cacheKey, language, sourceHash],
  );
  const [translated, setTranslated] = useState<T>(stableSource);

  useEffect(() => {
    setTranslated(stableSource);
  }, [stableSource]);

  useEffect(() => {
    if (stableSource === null || stableSource === undefined || isSiteLanguage(language)) {
      setTranslated(stableSource);
      return;
    }

    const cached = translationCache.get(translationKey);
    if (cached) {
      setTranslated(mergeTranslatedValue(stableSource, cached));
      return;
    }

    const stored = canStorePreferences ? window.localStorage.getItem(translationKey) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as T;
        const merged = mergeTranslatedValue(stableSource, parsed);
        translationCache.set(translationKey, merged);
        setTranslated(merged);
        return;
      } catch {
        window.localStorage.removeItem(translationKey);
      }
    }

    let isCancelled = false;

    async function translate() {
      try {
        const response = await fetch("/api/translate-ui", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language,
            source: stableSource,
          }),
        });

        const payload = (await response.json().catch(() => null)) as { result?: T } | null;

        if (
          !response.ok ||
          !payload?.result ||
          isCancelled
        ) {
          return;
        }

        const merged = mergeTranslatedValue(stableSource, payload.result);
        translationCache.set(translationKey, merged);
        if (canStorePreferences) {
          window.localStorage.setItem(translationKey, JSON.stringify(merged));
        }
        setTranslated(merged);
      } catch {
        if (!isCancelled) {
          setTranslated(stableSource);
        }
      }
    }

    void translate();

    return () => {
      isCancelled = true;
    };
  }, [canStorePreferences, language, stableSource, translationKey]);

  return translated;
}

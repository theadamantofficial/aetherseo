import {
  defaultLanguage,
  isSiteLanguage,
  siteLanguages,
  type SiteLanguage,
} from "@/lib/site-language";

export const localeCodes: Record<SiteLanguage, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  hi: "hi-IN",
};

export function resolveSiteLanguage(value: string | null | undefined): SiteLanguage {
  return isSiteLanguage(value ?? "") ? value : defaultLanguage;
}

export function buildLanguageAlternates(
  pathnameBuilder: (language: SiteLanguage) => string,
): Record<string, string> {
  return Object.fromEntries(
    siteLanguages.map((language) => [localeCodes[language], pathnameBuilder(language)]),
  );
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

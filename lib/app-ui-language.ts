export const appUiLanguages = ["en", "hi", "fr", "de", "ja", "ko"] as const;

export type AppUiLanguage = (typeof appUiLanguages)[number];

const appUiLanguageSet = new Set<string>(appUiLanguages);

export function resolveAppUiLanguage(language: string, uiLanguage: string): AppUiLanguage {
  if (appUiLanguageSet.has(language)) {
    return language as AppUiLanguage;
  }

  if (appUiLanguageSet.has(uiLanguage)) {
    return uiLanguage as AppUiLanguage;
  }

  return "en";
}

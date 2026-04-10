"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { useTheme } from "@/components/theme-provider";
import {
  globalLanguageOptions,
  isSiteLanguage,
  type PreferredLanguageCode,
  type SiteLanguage,
} from "@/lib/site-language";

type SitePreferencesProps = {
  buildLanguagePath?: (language: SiteLanguage) => string;
  className?: string;
};

function ThemeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M19 15.5A7.5 7.5 0 0 1 8.5 5 8 8 0 1 0 19 15.5Z" strokeWidth="1.8" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M12 20.25a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5Z" strokeWidth="1.7" />
      <path d="M3.75 12h16.5M12 3.75c2.06 2.18 3.1 5 3.1 8.25 0 3.24-1.04 6.07-3.1 8.25m0-16.5c-2.06 2.18-3.1 5-3.1 8.25 0 3.24 1.04 6.07 3.1 8.25" strokeWidth="1.7" />
    </svg>
  );
}

export default function SitePreferences({
  buildLanguagePath,
  className = "",
}: SitePreferencesProps) {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { mode, setMode } = useTheme();

  return (
    <div className={`site-pref-bar grid w-full grid-cols-2 items-center gap-2 rounded-[1.2rem] p-0 sm:inline-flex sm:w-auto sm:rounded-full sm:p-1.5 ${className}`.trim()}>
      <label className="site-select-wrap min-w-0">
        <span className="site-select-icon" aria-hidden="true">
          <ThemeIcon />
        </span>
        <span className="sr-only">Theme</span>
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as "auto" | "light" | "dark")}
          className="site-select h-11 w-full min-w-0 rounded-[1rem] pl-10 pr-9 text-[13px] font-medium outline-none sm:min-w-[122px] sm:rounded-full sm:pr-10 sm:text-sm"
        >
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <span className="site-select-caret" aria-hidden="true">
          ▾
        </span>
      </label>

      <label className="site-select-wrap min-w-0">
        <span className="site-select-icon" aria-hidden="true">
          <GlobeIcon />
        </span>
        <span className="sr-only">Language</span>
        <select
          value={language}
          onChange={(event) => {
            const nextLanguage = event.target.value as PreferredLanguageCode;
            setLanguage(nextLanguage);
            if (buildLanguagePath && isSiteLanguage(nextLanguage)) {
              router.push(buildLanguagePath(nextLanguage));
            }
          }}
          className="site-select h-11 w-full min-w-0 rounded-[1rem] pl-10 pr-9 text-[13px] font-medium outline-none sm:min-w-[170px] sm:rounded-full sm:pr-10 sm:text-sm"
        >
          {globalLanguageOptions.map((option) => (
            <option key={option.code} value={option.code} title={option.label}>
              {option.nativeLabel}
            </option>
          ))}
        </select>
        <span className="site-select-caret" aria-hidden="true">
          ▾
        </span>
      </label>
    </div>
  );
}

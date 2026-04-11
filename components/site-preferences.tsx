"use client";

import { useTheme } from "@/components/theme-provider";

type SitePreferencesProps = {
  className?: string;
};

function ThemeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M19 15.5A7.5 7.5 0 0 1 8.5 5 8 8 0 1 0 19 15.5Z" strokeWidth="1.8" />
    </svg>
  );
}

export default function SitePreferences({
  className = "",
}: SitePreferencesProps) {
  const { mode, setMode } = useTheme();

  return (
    <div className={`site-pref-bar grid w-full grid-cols-1 items-center gap-2 rounded-[1.2rem] p-0 sm:inline-flex sm:w-auto sm:rounded-full sm:p-1.5 ${className}`.trim()}>
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
    </div>
  );
}

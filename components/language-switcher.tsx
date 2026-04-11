"use client";

import Link from "next/link";
import { languageOptions } from "@/lib/site-language";
import type { SiteLanguage } from "@/lib/site-language";
import { useLanguage } from "@/components/language-provider";

type LanguageSwitcherProps = {
  className?: string;
  hrefBuilder?: (language: SiteLanguage) => string;
};

export default function LanguageSwitcher({ className = "", hrefBuilder }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-1 ${className}`.trim()}
    >
      {languageOptions.map((option) => {
        const isActive = option.code === language;
        const sharedClassName = `rounded-full px-3 py-1.5 text-xs font-medium transition ${
          isActive ? "bg-[var(--site-primary)] text-white" : "text-[var(--site-muted)] hover:bg-[var(--site-surface)] hover:text-[var(--foreground)]"
        }`;

        if (hrefBuilder) {
          return (
            <Link
              key={option.code}
              href={hrefBuilder(option.code)}
              onClick={() => setLanguage(option.code)}
              aria-current={isActive ? "page" : undefined}
              className={sharedClassName}
            >
              {option.nativeLabel}
            </Link>
          );
        }

        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            className={sharedClassName}
          >
            {option.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}

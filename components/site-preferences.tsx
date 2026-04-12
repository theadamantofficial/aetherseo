"use client";

import { SiteThemeToggle } from "@/components/theme-provider";

type SitePreferencesProps = {
  className?: string;
};

export default function SitePreferences({
  className = "",
}: SitePreferencesProps) {
  return <SiteThemeToggle className={className} />;
}

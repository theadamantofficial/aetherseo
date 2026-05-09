"use client";

import { SiteThemeToggle } from "@/components/theme-provider";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  return <SiteThemeToggle className={className} />;
}

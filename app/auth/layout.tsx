import type { ReactNode } from "react";
import { LanguageProvider } from "@/components/language-provider";
import SiteLoaderWarmup from "@/components/site-loader-warmup";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <SiteLoaderWarmup />
      {children}
    </LanguageProvider>
  );
}

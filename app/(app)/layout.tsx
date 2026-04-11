import type { ReactNode } from "react";
import AetherShell from "@/components/aether-shell";
import { LanguageProvider } from "@/components/language-provider";
import SiteLoaderWarmup from "@/components/site-loader-warmup";

/**
 * Wrap all authenticated screens in the dashboard shell.
 * @param props - Route content for an app page.
 * @returns Shared app shell layout.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <SiteLoaderWarmup />
      <AetherShell>{children}</AetherShell>
    </LanguageProvider>
  );
}

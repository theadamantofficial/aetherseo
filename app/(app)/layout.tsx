import type { ReactNode } from "react";
import AetherShell from "@/components/aether-shell";
import { LanguageProvider } from "@/components/language-provider";

/**
 * Wrap all authenticated screens in the dashboard shell.
 * @param props - Route content for an app page.
 * @returns Shared app shell layout.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AetherShell>{children}</AetherShell>
    </LanguageProvider>
  );
}

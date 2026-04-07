import type { ReactNode } from "react";
import AetherShell from "@/components/aether-shell";

/**
 * Wrap all authenticated screens in the dashboard shell.
 * @param props - Route content for an app page.
 * @returns Shared app shell layout.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AetherShell>{children}</AetherShell>;
}

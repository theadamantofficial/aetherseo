import type { ReactNode } from "react";
import { LanguageProvider } from "@/components/language-provider";

export default function ChoosePlanLayout({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LanguageProvider } from "@/components/language-provider";
import { isSiteLanguage } from "@/lib/site-language";

export default async function LocalizedPublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    notFound();
  }

  return <LanguageProvider initialLanguage={lang}>{children}</LanguageProvider>;
}

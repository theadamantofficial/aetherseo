import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal-page";
import { termsCopy } from "@/lib/legal-copy";
import { isSiteLanguage, siteLanguages } from "@/lib/site-language";
import { buildLanguageAlternates, resolveSiteLanguage } from "@/lib/site-routing";

export function generateStaticParams() {
  return siteLanguages.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;

  if (!isSiteLanguage(rawLang)) {
    notFound();
  }

  const lang = resolveSiteLanguage(rawLang);
  const copy = termsCopy[lang];
  const tagline = "AI MEETS SEO";

  return {
    title: `${copy.title} | ${tagline}`,
    description: `${copy.intro} ${tagline}.`,
    alternates: {
      canonical: `/${lang}/terms-of-service`,
      languages: buildLanguageAlternates((language) => `/${language}/terms-of-service`),
    },
  };
}

export default async function LocalizedTermsOfServicePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    notFound();
  }

  return <LegalPage language={lang} type="terms" />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal-page";
import { privacyCopy } from "@/lib/legal-copy";
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
  const copy = privacyCopy[lang];

  return {
    title: copy.title,
    description: copy.intro,
    alternates: {
      canonical: `/${lang}/privacy-policy`,
      languages: buildLanguageAlternates((language) => `/${language}/privacy-policy`),
    },
  };
}

export default async function LocalizedPrivacyPolicyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    notFound();
  }

  return <LegalPage language={lang} type="privacy" />;
}

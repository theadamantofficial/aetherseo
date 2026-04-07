import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "@/components/home-page";
import { isSiteLanguage, landingCopy, siteLanguages } from "@/lib/site-language";
import { buildLanguageAlternates, getSiteUrl, localeCodes, resolveSiteLanguage } from "@/lib/site-routing";

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
  const copy = landingCopy[lang];

  return {
    title: copy.hero.title,
    description: copy.hero.body,
    keywords: copy.trustBar,
    alternates: {
      canonical: `/${lang}`,
      languages: buildLanguageAlternates((language) => `/${language}`),
    },
    openGraph: {
      title: copy.hero.title,
      description: copy.hero.body,
      type: "website",
      locale: localeCodes[lang],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.hero.title,
      description: copy.hero.body,
    },
  };
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;

  if (!isSiteLanguage(rawLang)) {
    notFound();
  }

  const lang = resolveSiteLanguage(rawLang);
  const copy = landingCopy[lang];
  const siteUrl = getSiteUrl();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.items.slice(0, 2).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    applicationCategory: "BusinessApplication",
    name: "Aether AI",
    operatingSystem: "Web",
    description: copy.hero.body,
    inLanguage: localeCodes[lang],
    url: `${siteUrl}/${lang}`,
  };

  return (
    <>
      <HomePage />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicBlogIndex from "@/components/public-blog-index";
import {
  blogIndexCopy,
  getPublicBlogPosts,
  isSiteLanguage,
  siteLanguages,
} from "@/lib/site-language";
import {
  buildLanguageAlternates,
  getSiteUrl,
  localeCodes,
  resolveSiteLanguage,
} from "@/lib/site-routing";

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
  const copy = blogIndexCopy[lang];

  return {
    title: copy.title,
    description: copy.body,
    alternates: {
      canonical: `/${lang}/blog`,
      languages: buildLanguageAlternates((language) => `/${language}/blog`),
    },
    openGraph: {
      title: copy.title,
      description: copy.body,
      type: "website",
      locale: localeCodes[lang],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.body,
    },
  };
}

export default async function LocalizedBlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;

  if (!isSiteLanguage(rawLang)) {
    notFound();
  }

  const lang = resolveSiteLanguage(rawLang);
  const posts = getPublicBlogPosts(lang);
  const siteUrl = getSiteUrl();
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Aether AI Blog",
    inLanguage: localeCodes[lang],
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: new Date(post.date).toISOString(),
      articleSection: post.category,
      url: `${siteUrl}/${lang}/blog/${post.slug}`,
    })),
  };

  return (
    <>
      <PublicBlogIndex />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
    </>
  );
}

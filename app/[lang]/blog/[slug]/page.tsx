import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicBlogArticle from "@/components/public-blog-article";
import {
  getPublicBlogPost,
  getPublicBlogPosts,
  isSiteLanguage,
  siteLanguages,
} from "@/lib/site-language";
import { getSiteUrl, localeCodes, resolveSiteLanguage } from "@/lib/site-routing";

export function generateStaticParams() {
  return siteLanguages.flatMap((lang) =>
    getPublicBlogPosts(lang).map((post) => ({
      lang,
      slug: post.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;

  if (!isSiteLanguage(rawLang)) {
    notFound();
  }

  const lang = resolveSiteLanguage(rawLang);
  const post = getPublicBlogPost(lang, slug);

  if (!post) {
    return {
      title: "Article not found",
      alternates: {
        canonical: `/${lang}/blog`,
      },
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/${lang}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      locale: localeCodes[lang],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function LocalizedBlogArticlePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;

  if (!isSiteLanguage(rawLang)) {
    notFound();
  }

  const lang = resolveSiteLanguage(rawLang);
  const post = getPublicBlogPost(lang, slug);
  const siteUrl = getSiteUrl();

  if (!post) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: new Date(post.date).toISOString(),
    articleSection: post.category,
    inLanguage: localeCodes[lang],
    mainEntityOfPage: `${siteUrl}/${lang}/blog/${post.slug}`,
  };

  return (
    <>
      <PublicBlogArticle slug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
    </>
  );
}

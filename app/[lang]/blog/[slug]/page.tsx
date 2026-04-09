import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicBlogArticle from "@/components/public-blog-article";
import { getPublishedBlogPost } from "@/lib/public-blog-posts";
import type { SiteLanguage } from "@/lib/site-language";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: SiteLanguage; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPublishedBlogPost(lang, slug);

  if (!post) {
    return {
      title: "Article not found | Aether SEO",
      description: "The requested article is not available.",
    };
  }

  return {
    title: `${post.seoTitle} | Aether SEO`,
    description: post.seoDescription,
    alternates: {
      canonical: `/${lang}/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.seoTitle} | Aether SEO`,
      description: post.seoDescription,
      type: "article",
      url: `${siteUrl}/${lang}/blog/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.seoTitle} | Aether SEO`,
      description: post.seoDescription,
    },
  };
}

export default async function LocalizedBlogArticlePage({
  params,
}: {
  params: Promise<{ lang: SiteLanguage; slug: string }>;
}) {
  const { lang, slug } = await params;
  const post = await getPublishedBlogPost(lang, slug);

  if (!post) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Aether SEO",
    },
    mainEntityOfPage: `${siteUrl}/${lang}/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <PublicBlogArticle language={lang} post={post} />
    </>
  );
}

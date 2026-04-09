import type { Metadata } from "next";
import PublicBlogIndex from "@/components/public-blog-index";
import { blogUiCopy } from "@/lib/blog-post-utils";
import { listPublishedBlogPosts } from "@/lib/public-blog-posts";
import type { SiteLanguage } from "@/lib/site-language";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: SiteLanguage }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const copy = blogUiCopy[lang];
  const canonical = `/${lang}/blog`;

  return {
    title: `Aether SEO Blog | AI MEETS SEO`,
    description: copy.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Aether SEO Blog | AI MEETS SEO`,
      description: copy.description,
      type: "website",
      url: `${siteUrl}${canonical}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Aether SEO Blog | AI MEETS SEO`,
      description: copy.description,
    },
  };
}

export default async function LocalizedBlogIndexPage({
  params,
}: {
  params: Promise<{ lang: SiteLanguage }>;
}) {
  const { lang } = await params;
  const posts = await listPublishedBlogPosts(lang);
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Aether SEO Blog",
    description: blogUiCopy[lang].description,
    url: `${siteUrl}/${lang}/blog`,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      author: {
        "@type": "Organization",
        name: post.authorName,
      },
      url: `${siteUrl}/${lang}/blog/${post.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <PublicBlogIndex language={lang} posts={posts} />
    </>
  );
}

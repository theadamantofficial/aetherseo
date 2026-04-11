"use client";

import Link from "next/link";
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";
import { blogUiCopy, type PublishedBlogPost } from "@/lib/blog-post-utils";
import type { SiteLanguage } from "@/lib/site-language";

type PublicBlogArticleProps = {
  language: SiteLanguage;
  post: PublishedBlogPost;
};

export default function PublicBlogArticle({ language, post }: PublicBlogArticleProps) {
  const copy = blogUiCopy[language];

  return (
    <div className="site-page min-h-screen px-4 py-4 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PublicHeader language={language} />

        <main className="space-y-8">
          <section className="site-panel-hero rounded-[2.4rem] px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              <span>{post.category}</span>
              <span>•</span>
              <span>{copy.readingTimeLabel}: {post.readTime}</span>
              <span>•</span>
              <span>{copy.publishedLabel}: {new Date(post.publishedAt).toLocaleDateString()}</span>
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              {post.title}
            </h1>
            <p className="site-muted mt-4 max-w-3xl text-sm leading-7 sm:text-base">{post.excerpt}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/${language}/blog`} className="site-button-secondary rounded-full px-5 py-3 text-sm font-medium">
                {copy.backToBlog}
              </Link>
              <Link href={`/${language}`} className="site-button-ink rounded-full px-5 py-3 text-sm font-semibold">
                {copy.backToHome}
              </Link>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.7fr,1.3fr]">
            <aside className="site-panel-soft rounded-[1.8rem] border px-5 py-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Article details</p>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="font-medium">Author</p>
                  <p className="site-muted mt-1">{post.authorName}</p>
                </div>
                <div>
                  <p className="font-medium">Language</p>
                  <p className="site-muted mt-1">{post.language.toUpperCase()}</p>
                </div>
                <div>
                  <p className="font-medium">SEO description</p>
                  <p className="site-muted mt-1 leading-6">{post.seoDescription}</p>
                </div>
              </div>
            </aside>

            <article className="site-panel rounded-[2rem] px-6 py-6 sm:px-8">
              <div
                className="site-article-body mx-auto max-w-3xl"
                dangerouslySetInnerHTML={{ __html: post.body }}
              />
            </article>
          </section>
        </main>

        <PublicFooter language={language} />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";
import { blogUiCopy, type PublishedBlogPost } from "@/lib/blog-post-utils";
import type { SiteLanguage } from "@/lib/site-language";

type PublicBlogIndexProps = {
  language: SiteLanguage;
  posts: PublishedBlogPost[];
};

export default function PublicBlogIndex({ language, posts }: PublicBlogIndexProps) {
  const router = useRouter();
  const copy = blogUiCopy[language];
  const buildLanguagePath = (nextLanguage: SiteLanguage) => `/${nextLanguage}/blog`;

  function formatBlogDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));
  }

  return (
    <div className="site-page min-h-screen px-4 py-4 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PublicHeader language={language} buildLanguagePath={buildLanguagePath} />

        <main className="space-y-8">
            <section className="site-panel-hero rounded-[2.4rem] px-6 py-8 sm:px-8 sm:py-10">
            <p className="site-chip inline-flex rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              {copy.title}
            </h1>
            <p className="site-muted mt-4 max-w-3xl text-sm leading-7 sm:text-base">
              {copy.description}
            </p>
            <div className="relative z-20 mt-6 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="site-button-ink inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                Company member login
              </Link>
              <Link
                href={`/${language}`}
                className="site-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-medium"
              >
                Back to home
              </Link>
            </div>
          </section>

          {posts.length === 0 ? (
            <section className="site-panel site-panel-static rounded-[2rem] px-6 py-10 text-center sm:px-8">
              <h2 className="relative z-20 text-2xl font-semibold tracking-[-0.03em]">{copy.emptyTitle}</h2>
              <p className="site-muted relative z-20 mx-auto mt-3 max-w-2xl text-sm leading-7 sm:text-base">
                {copy.emptyDescription}
              </p>
            </section>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="site-panel-soft flex h-full flex-col rounded-[1.8rem] border px-5 py-5">
                  <div className="relative z-10 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    <span>{post.category}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                    <span>•</span>
                    <span>{formatBlogDate(post.publishedAt)}</span>
                  </div>

                  <h2 className="relative z-10 mt-4 text-2xl font-semibold tracking-[-0.04em]">{post.title}</h2>
                  <p className="site-muted relative z-10 mt-3 text-sm leading-7">{post.excerpt}</p>

                  <div className="relative z-10 mt-6 flex items-center justify-between gap-4">
                    <div className="text-sm">
                      <p className="font-medium">{post.authorName}</p>
                      <p className="site-muted">{post.language.toUpperCase()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/${language}/blog/${post.slug}`)}
                      className="site-button-secondary site-button-stable rounded-full px-4 py-2 text-sm font-medium"
                    >
                      Read article
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </main>

        <PublicFooter language={language} />
      </div>
    </div>
  );
}

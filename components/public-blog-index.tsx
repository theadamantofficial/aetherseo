"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import PublicFooter from "@/components/public-footer";
import ThemeToggle from "@/components/theme-toggle";
import { useLanguage } from "@/components/language-provider";
import { blogIndexCopy, getPublicBlogPosts } from "@/lib/site-language";

export default function PublicBlogIndex() {
  const { language } = useLanguage();
  const copy = blogIndexCopy[language];
  const posts = getPublicBlogPosts(language);

  return (
    <div className="site-page min-h-screen px-6 py-8 text-[#edf1ff]">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.eyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold md:text-5xl">{copy.title}</h1>
            <p className="site-muted mt-4 max-w-3xl text-sm leading-7">{copy.body}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher hrefBuilder={(nextLanguage) => `/${nextLanguage}/blog`} />
            <Link href={`/${language}`} className="site-button-secondary rounded-full border px-4 py-2 text-sm">
              {copy.backHome}
            </Link>
          </div>
        </header>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="site-panel rounded-[1.75rem] border p-6"
            >
              <div className="site-muted flex items-center justify-between text-xs uppercase tracking-[0.16em]">
                <span>{post.category}</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold leading-tight">{post.title}</h2>
              <p className="site-muted mt-4 text-sm leading-7">{post.excerpt}</p>
              <p className="site-muted mt-5 text-xs">{post.date}</p>
              <Link href={`/${language}/blog/${post.slug}`} className="site-link-accent mt-6 inline-flex text-sm font-semibold">
                {copy.viewArticle}
              </Link>
            </article>
          ))}
        </section>

        <PublicFooter language={language} />
      </div>
    </div>
  );
}

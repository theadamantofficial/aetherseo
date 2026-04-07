"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import PublicFooter from "@/components/public-footer";
import ThemeToggle from "@/components/theme-toggle";
import { useLanguage } from "@/components/language-provider";
import { getPublicBlogPost } from "@/lib/site-language";

export default function PublicBlogArticle({ slug }: { slug: string }) {
  const { language } = useLanguage();
  const post = getPublicBlogPost(language, slug);
  const fallbackText =
    language === "es"
      ? { body: "Articulo no disponible en este idioma.", back: "Volver al blog" }
      : language === "fr"
        ? { body: "Article non disponible dans cette langue.", back: "Retour au blog" }
        : language === "hi"
          ? { body: "Ye article is language me available nahin hai.", back: "Blog par wapas jao" }
          : { body: "Article not available in this language.", back: "Back to blog" };

  if (!post) {
    return (
      <div className="site-page min-h-screen px-6 py-8 text-[#edf1ff]">
        <div className="site-panel mx-auto max-w-4xl rounded-[1.75rem] border p-8 text-center">
          <p className="text-xl font-semibold">{fallbackText.body}</p>
          <Link href={`/${language}/blog`} className="site-button-secondary mt-6 inline-flex rounded-full border px-4 py-2 text-sm">
            {fallbackText.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="site-page min-h-screen px-6 py-8 text-[#edf1ff]">
      <article className="mx-auto max-w-4xl">
        <header className="site-panel rounded-[2rem] border p-7 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="site-muted flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em]">
              <span>{post.category}</span>
              <span>{post.date}</span>
              <span>{post.readTime}</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageSwitcher hrefBuilder={(nextLanguage) => `/${nextLanguage}/blog`} />
              <Link href={`/${language}/blog`} className="site-button-secondary rounded-full border px-4 py-2 text-sm">
                {fallbackText.back}
              </Link>
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">{post.title}</h1>
          <p className="site-muted mt-5 max-w-3xl text-base leading-8">{post.hero}</p>
        </header>

        <div className="mt-8 space-y-6">
          {post.sections.map((section) => (
            <section
              key={section.title}
              className="site-panel-soft rounded-[1.75rem] border p-6 md:p-8"
            >
              <h2 className="text-3xl font-semibold">{section.title}</h2>
              <div className="site-muted mt-5 space-y-4 text-sm leading-8 md:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <PublicFooter language={language} />
      </article>
    </div>
  );
}

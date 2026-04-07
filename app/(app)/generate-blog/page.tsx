"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { blogWorkspaceCopy, languageOptions } from "@/lib/site-language";

export default function GenerateBlogPage() {
  const { language } = useLanguage();
  const copy = blogWorkspaceCopy[language];
  const currentLanguage = languageOptions.find((item) => item.code === language);
  const notesHeading =
    language === "es"
      ? "Notas editoriales"
      : language === "fr"
        ? "Notes editoriales"
        : language === "hi"
          ? "Editorial notes"
          : "Editorial Notes";

  return (
    <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <section className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{copy.title}</h1>
            <p className="mt-2 text-sm text-white/60">{copy.body}</p>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">{copy.keywordLabel}</p>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              Sustainable Fashion Trends 2026
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">{copy.toneLabel}</p>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              Professional & Authoritative
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">{copy.lengthLabel}</p>
            <div className="flex gap-2">
              {copy.lengths.map((opt, index) => (
                <button
                  key={opt}
                  type="button"
                  className={`rounded-lg px-3 py-2 ${
                    index === 1 ? "bg-[#5d50f2]" : "bg-white/10"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">{copy.languageLabel}</p>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              {currentLanguage?.nativeLabel}
            </div>
            <p className="mt-2 text-xs leading-6 text-white/48">{copy.languageHelper}</p>
          </div>
          <button type="button" className="w-full rounded-xl bg-[#5d50f2] px-4 py-3 font-semibold">
            {copy.generateButton} ✦
          </button>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#9f97ff]">{copy.companyBlogLink}</p>
            <p className="mt-3 text-sm leading-6 text-white/65">{copy.companyBlogBody}</p>
            <Link href={`/${language}/blog`} className="mt-4 inline-flex text-sm font-semibold text-[#9ea7ff]">
              {copy.companyBlogLink}
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f1738] p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9f97ff]">{copy.previewEyebrow}</p>
        <h2 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight">{copy.titlePreview}</h2>
        <p className="mt-4 text-sm text-white/60">{copy.previewMeta}</p>
        <div className="mt-8 space-y-5 text-white/85">
          {copy.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <h3 className="text-3xl font-semibold">{copy.sectionTitle}</h3>
          <p>{copy.sectionBody}</p>
          <div className="h-56 rounded-2xl border border-white/10 bg-gradient-to-r from-[#10214f] to-[#17376f]" />
          <h3 className="text-3xl font-semibold">{notesHeading}</h3>
          <ul className="space-y-2 text-sm text-white/80">
            {copy.bullets.map((bullet) => (
              <li key={bullet}>• {bullet}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

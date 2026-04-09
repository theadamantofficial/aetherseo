"use client";

import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import { privacyCopy, termsCopy } from "@/lib/legal-copy";
import type { SiteLanguage } from "@/lib/site-language";

type LegalPageProps = {
  language: SiteLanguage;
  type: "privacy" | "terms";
};

export default function LegalPage({ language, type }: LegalPageProps) {
  const copy = type === "privacy" ? privacyCopy[language] : termsCopy[language];

  return (
    <main className="site-page min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <PublicHeader
          language={language}
          buildLanguagePath={(nextLanguage) =>
            `/${nextLanguage}/${type === "privacy" ? "privacy-policy" : "terms-of-service"}`
          }
        />

        <section className="site-panel site-animate-rise mx-auto max-w-4xl rounded-[2rem] p-8 md:p-10">
          <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{type === "privacy" ? "Legal" : "Terms"}</p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{copy.title}</h1>
          <p className="site-muted mt-5 max-w-3xl text-sm leading-7 md:text-base">{copy.intro}</p>

          <div className="mt-10 space-y-6">
            {copy.sections.map((section) => (
              <article key={section.title} className="site-panel-soft site-hover-lift site-animate-rise rounded-[1.5rem] p-6">
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <p className="site-muted mt-3 text-sm leading-7 md:text-base">{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-4xl site-animate-rise">
          <PublicFooter language={language} />
        </div>
      </div>
    </main>
  );
}

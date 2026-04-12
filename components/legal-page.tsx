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
        <PublicHeader language={language} />

        <section className="site-panel site-animate-rise mx-auto max-w-4xl rounded-[2rem] p-8 md:p-10">
          <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{type === "privacy" ? "Legal" : "Terms"}</p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{copy.title}</h1>
          <p className="site-muted mt-5 max-w-3xl text-sm leading-7 md:text-base">{copy.intro}</p>

          {copy.meta?.length ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {copy.meta.map((item) => (
                <article key={item.label} className="site-panel-soft rounded-[1.35rem] border p-4">
                  <p className="site-accent-text text-[11px] uppercase tracking-[0.18em]">{item.label}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-3 block break-all text-sm font-medium text-[var(--foreground)] underline decoration-[color-mix(in_srgb,var(--site-primary)_60%,transparent)] underline-offset-4"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-3 text-sm font-medium text-[var(--foreground)]">{item.value}</p>
                  )}
                </article>
              ))}
            </div>
          ) : null}

          <div className="mt-10 space-y-6">
            {copy.sections.map((section) => (
              <article key={section.title} className="site-panel-soft site-hover-lift site-animate-rise rounded-[1.5rem] p-6">
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                {section.body ? (
                  <p className="site-muted mt-3 text-sm leading-7 md:text-base">{section.body}</p>
                ) : null}

                {section.bullets?.length ? (
                  <ul className="site-muted mt-4 list-disc space-y-2 pl-5 text-sm leading-7 md:text-base">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {section.subsections?.length ? (
                  <div className="mt-5 space-y-5">
                    {section.subsections.map((subsection) => (
                      <section key={subsection.title} className="rounded-[1.15rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
                        <h3 className="text-lg font-semibold">{subsection.title}</h3>
                        {subsection.body ? (
                          <p className="site-muted mt-2 text-sm leading-7 md:text-base">{subsection.body}</p>
                        ) : null}

                        {subsection.bullets?.length ? (
                          <ul className="site-muted mt-3 list-disc space-y-2 pl-5 text-sm leading-7 md:text-base">
                            {subsection.bullets.map((bullet) => (
                              <li key={bullet}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </section>
                    ))}
                  </div>
                ) : null}
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

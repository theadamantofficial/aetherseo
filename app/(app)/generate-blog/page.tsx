"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import SiteLoader from "@/components/site-loader";
import { auth } from "@/lib/firebase";
import {
  getDashboardForUser,
  saveGeneratedBlogForUser,
  type BillingPlan,
  type GeneratedBlog,
} from "@/lib/firebase-data";
import { blogWorkspaceCopy, globalLanguageOptions } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

function GenerateBlogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, uiLanguage } = useLanguage();
  const copy = useTranslatedCopy(
    blogWorkspaceCopy[uiLanguage],
    language,
    `generate-blog-copy-${uiLanguage}`,
  );
  const notesHeading = useTranslatedCopy(
    uiLanguage === "es"
      ? "Notas editoriales"
      : uiLanguage === "fr"
        ? "Notes editoriales"
        : uiLanguage === "hi"
          ? "Editorial notes"
          : "Editorial Notes",
    language,
    `generate-blog-notes-heading-${uiLanguage}`,
  );
  const toneOptions = useMemo(
    () => ["Professional & Authoritative", "Friendly & Practical", "Technical & Strategic"],
    [],
  );
  const [uid, setUid] = useState("");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [tone, setTone] = useState(toneOptions[0]);
  const [length, setLength] = useState(copy.lengths[1] ?? copy.lengths[0]);
  const [outputLanguage, setOutputLanguage] = useState(language);
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [blogCount, setBlogCount] = useState(0);
  const [blog, setBlog] = useState<GeneratedBlog | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setBusy] = useState(false);
  const currentLanguage = globalLanguageOptions.find((item) => item.code === outputLanguage) ?? globalLanguageOptions[0];
  const isFreeBlogLimitReached = plan === "free" && blogCount >= 3;

  useEffect(() => {
    const queryKeyword = searchParams.get("keyword");
    if (queryKeyword) {
      setKeyword(queryKeyword);
    }
  }, [searchParams]);

  useEffect(() => {
    setOutputLanguage(language);
  }, [language]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      setUid(currentUser.uid);
      try {
        const dashboard = await getDashboardForUser(currentUser.uid);
        setPlan(dashboard.plan);
        setBlogCount(dashboard.generatedBlogs.length);
        if (dashboard.plan === "free" && dashboard.generatedBlogs.length >= 3) {
          router.replace("/billing?upgrade=blog-limit");
          return;
        }
        if (dashboard.generatedBlogs[0]) {
          setBlog(dashboard.generatedBlogs[0]);
          setKeyword((currentKeyword) =>
            queryKeywordOrValue(currentKeyword) ? currentKeyword : dashboard.generatedBlogs[0].keyword,
          );
        }
      } catch {
        setStatus("Could not load your last generated draft.");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  async function handleGenerate() {
    if (!uid) {
      setStatus("You must be signed in to generate a blog.");
      return;
    }

    if (!keyword.trim()) {
      setStatus("Enter a target keyword first.");
      return;
    }

    if (isFreeBlogLimitReached) {
      router.replace("/billing?upgrade=blog-limit");
      return;
    }

    setBusy(true);
    setStatus("Generating blog draft...");

    try {
      const response = await fetch("/api/generate-blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
          tone,
          length,
          language: outputLanguage,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not generate the blog.");
      }

      const generatedBlog = payload.blog as GeneratedBlog;
      setBlog(generatedBlog);
      const nextDashboard = await saveGeneratedBlogForUser(uid, generatedBlog);
      setPlan(nextDashboard.plan);
      setBlogCount(nextDashboard.generatedBlogs.length);
      setStatus("Blog generated and saved to your workspace.");
    } catch (error) {
      if (error instanceof Error && error.message === "Free plan includes 3 blog drafts. Upgrade to continue.") {
        router.replace("/billing?upgrade=blog-limit");
        return;
      }
      setStatus(error instanceof Error ? error.message : "Could not generate the blog.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <section className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--site-muted)]">
              Internal workspace
            </p>
            <h1 className="text-lg font-semibold">{copy.title}</h1>
            <p className="site-muted mt-2 text-sm">{copy.body}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="site-muted mb-2 text-xs uppercase tracking-[0.2em]">{copy.keywordLabel}</p>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="AI SEO workflow for startups"
              className="site-input w-full rounded-xl px-4 py-3 outline-none"
            />
          </div>
          <div>
            <p className="site-muted mb-2 text-xs uppercase tracking-[0.2em]">{copy.toneLabel}</p>
            <div className="grid gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTone(option)}
                  className={`rounded-xl px-4 py-3 text-left ${
                    tone === option ? "site-button-primary" : "border border-[var(--site-border)] bg-[var(--site-surface-soft)]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="site-muted mb-2 text-xs uppercase tracking-[0.2em]">{copy.lengthLabel}</p>
            <div className="flex gap-2">
              {copy.lengths.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLength(opt)}
                  className={`rounded-lg px-3 py-2 ${
                    length === opt ? "site-button-primary" : "border border-[var(--site-border)] bg-[var(--site-surface-soft)]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="site-muted mb-2 text-xs uppercase tracking-[0.2em]">{copy.languageLabel}</p>
            <label className="site-select-wrap block">
              <select
                value={outputLanguage}
                onChange={(event) => setOutputLanguage(event.target.value)}
                className="site-input site-select h-12 w-full rounded-xl px-4 pr-10 outline-none"
              >
                {globalLanguageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.nativeLabel}
                  </option>
                ))}
              </select>
              <span className="site-select-caret" aria-hidden="true">
                ▾
              </span>
            </label>
            <p className="site-muted mt-2 text-xs leading-6">
              {copy.languageHelper} Current selection: {currentLanguage.nativeLabel}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isBusy || isFreeBlogLimitReached}
            className="site-button-primary w-full rounded-xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isBusy ? "Generating..." : `${copy.generateButton} ✦`}
          </button>
          <p className="site-muted text-xs">
            {status ??
              (isFreeBlogLimitReached
                ? "Free plan includes 3 blog drafts. Upgrade to continue."
                : "Generate a new draft and it will be saved to your workspace history.")}
          </p>

            <div className="rounded-lg border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4">
            <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.companyBlogLink}</p>
            <p className="site-muted mt-3 text-sm leading-6">{copy.companyBlogBody}</p>
            <Link href={`/${language}/blog`} className="site-link-accent mt-4 inline-flex text-sm font-semibold">
              {copy.companyBlogLink}
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--site-muted)]">
          {copy.previewEyebrow}
        </p>
        <h2 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight">
          {blog?.title || "No generated draft yet"}
        </h2>
        <p className="site-muted mt-4 text-sm">
          {blog?.previewMeta || "Generate a real blog draft and it will appear here immediately after saving."}
        </p>
        <div className="mt-8 space-y-5">
          {blog ? (
            <>
              {blog.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <h3 className="text-lg font-semibold">{blog.sectionTitle}</h3>
              <p>{blog.sectionBody}</p>
              <div className="h-56 rounded-lg border border-[var(--site-border)] bg-[var(--site-surface-soft)]" />
              <h3 className="text-lg font-semibold">{notesHeading}</h3>
              <ul className="site-muted space-y-2 text-sm">
                {blog.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </>
          ) : (
            <div className="rounded-lg border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4">
              <p className="text-lg font-semibold">No preview available yet</p>
              <p className="site-muted mt-3 text-sm leading-7">
                Use the controls on the left to generate a blog draft. Once the AI response is saved,
                this preview will show the actual title, body, bullets, and meta description from your workspace.
              </p>
            </div>
          )}
          {blog ? (
            <div className="rounded-lg border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4">
              <p className="site-accent-text text-xs uppercase tracking-[0.18em]">Meta description</p>
              <p className="mt-3 text-sm">{blog.metaDescription}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function queryKeywordOrValue(value: string) {
  return value.trim().length > 0;
}

export default function GenerateBlogPage() {
  return (
    <Suspense fallback={<SiteLoader size="lg" />}>
      <GenerateBlogPageContent />
    </Suspense>
  );
}

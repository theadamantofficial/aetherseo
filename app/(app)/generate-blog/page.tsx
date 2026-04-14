"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import SiteLoader from "@/components/site-loader";
import { getAssistantAddonDefinitions } from "@/lib/assistant-addons";
import { auth } from "@/lib/firebase";
import {
  getDashboardForUser,
  getUserProfile,
  saveGeneratedBlogForUser,
  type BillingPlan,
  type GeneratedBlog,
  type UserProfile,
} from "@/lib/firebase-data";
import {
  ensureRazorpayCheckout,
  postAuthenticatedJson,
  type RazorpayOrderResponse,
} from "@/lib/razorpay-client";
import { blogWorkspaceCopy, globalLanguageOptions } from "@/lib/site-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

type GeneratedBlogDraft = Omit<GeneratedBlog, "id" | "createdAt"> &
  Partial<Pick<GeneratedBlog, "id" | "createdAt">>;

type GenerateBlogApiResponse = {
  blog?: GeneratedBlogDraft;
  creditsUsed?: { image?: number };
  ephemeralImageDataUrl?: string | null;
  error?: string;
  warnings?: string[];
};

type BlogPdfRewriteResult = {
  cleanedContent: string;
  fileName: string;
  highlights: string[];
  model: string;
  pageCount: number;
  sourceFileName: string;
  summary: string;
  title: string;
  warnings: string[];
  wordCount: number;
};

type BlogPdfRewriteApiResponse = {
  document?: BlogPdfRewriteResult;
  error?: string;
};

const assistantAddonDefinitions = getAssistantAddonDefinitions();
const imageAddonDefinition = assistantAddonDefinitions["seo-image"];

/* ─── small icons ───────────────────────────────────────── */

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className} aria-hidden>
      <path
        d="M6.5 1.5v2M6.5 9.5v2M1.5 6.5h2M9.5 6.5h2M3.1 3.1l1.4 1.4M8.5 8.5l1.4 1.4M8.5 3.1L7.1 4.5M4.6 8.5L3.1 9.9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconArrowOut({ className }: { className?: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className={className} aria-hidden>
      <path d="M2 9L9 2M9 2H4M9 2v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDoc({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
      <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
      <path d="M3 4h6M3 6.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className} aria-hidden>
      <rect x="1.5" y="2" width="10" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="4.25" cy="4.75" r="1" fill="currentColor" />
      <path d="M2.3 9l2.3-2 1.5 1.4 1.6-1.2L10.7 9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUpload({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className} aria-hidden>
      <path d="M6.5 9V2.5M6.5 2.5L4.1 4.9M6.5 2.5l2.4 2.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.4 10.2h8.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className} aria-hidden>
      <path d="M6.5 2.4v6.3M6.5 8.7l2.4-2.4M6.5 8.7L4.1 6.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.4 10.2h8.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[rgba(255,255,255,.3)] border-t-white"
      style={{ animation: "spin .7s linear infinite" }}
      aria-hidden
    />
  );
}

/* ─── small helpers ─────────────────────────────────────── */

function formatAuthErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const maybeCode = "code" in error && typeof error.code === "string" ? error.code : null;
    const maybeMessage = "message" in error && typeof error.message === "string" ? error.message : null;
    if (maybeCode && maybeMessage) return `${fallback} (${maybeCode}: ${maybeMessage})`;
    if (maybeMessage) return `${fallback} (${maybeMessage})`;
  }
  return fallback;
}

async function postAuthenticatedFormData<T>(url: string, token: string, body: FormData): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  const rawText = await response.text();
  let payload: { error?: string } | null = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as { error?: string };
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? (rawText.trim() || "Request failed."));
  }

  return payload as T;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, bytes / 1024).toFixed(1)} KB`;
}

/* ─── SEO score mini-card ───────────────────────────────── */

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-[var(--site-border)] bg-[var(--site-panel)] p-2.5 text-center">
      <p className="text-[15px] font-medium text-[var(--site-fg)]">{value}</p>
      <p className="mt-0.5 text-[10px] text-[var(--site-muted)]">{label}</p>
      <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[var(--site-border)]">
        <div
          className="h-full rounded-full bg-[var(--site-primary)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/* ─── field label ───────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">
      {children}
    </p>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-[12px]">
      <span className="text-[var(--site-muted)]">{label}</span>
      <span className="font-semibold text-[var(--site-fg)]">{value}</span>
    </div>
  );
}

/* ─── image placeholder ─────────────────────────────────── */

function ImagePlaceholder() {
  return (
    <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel)]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--site-border-strong)]" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3 15l5-3 4 4 3-2 6 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function BlogImageCard({
  fileName,
  src,
  title,
  alt,
  sessionOnly,
}: {
  fileName: string;
  src: string | null;
  title: string;
  alt: string;
  sessionOnly: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)]">
      {src ? (
        // Data URLs and blob-backed image URLs are both supported here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="aspect-[16/10] w-full object-cover" />
      ) : (
        <div className="flex min-h-[12rem] items-center justify-center bg-[var(--site-bg)] px-5 text-center text-[12px] text-[var(--site-muted)]">
          Image metadata was saved, but no persistent preview is available for this session.
        </div>
      )}

      <div className="border-t border-[var(--site-border)] px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">SEO image</p>
            <p className="mt-1 text-[13px] font-medium text-[var(--site-fg)]">{title}</p>
            <p className="mt-1 text-[11px] leading-[1.6] text-[var(--site-muted)]">{alt}</p>
          </div>
          {src ? (
            <a
              href={src}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="site-button-secondary rounded-lg px-3 py-2 text-[11px] font-semibold"
            >
              Download image
            </a>
          ) : null}
        </div>
        {sessionOnly ? (
          <p className="mt-2 text-[10px] leading-[1.5] text-[var(--site-muted)]">
            Preview is available in the current session. Enable blob storage if you want the generated image URL to persist after refresh.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ─── main page content ─────────────────────────────────── */

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
    uiLanguage === "es" ? "Notas editoriales"
      : uiLanguage === "fr" ? "Notes éditoriales"
      : uiLanguage === "hi" ? "Editorial notes"
      : "Editorial notes",
    language,
    `generate-blog-notes-heading-${uiLanguage}`,
  );

  const toneOptions = useMemo(
    () => [
      "Professional & authoritative",
      "Friendly & practical",
      "Technical & strategic",
    ],
    [],
  );

  const [uid, setUid] = useState("");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [tone, setTone] = useState(toneOptions[0]);
  const [length, setLength] = useState(copy.lengths[1] ?? copy.lengths[0]);
  const [outputLanguage, setOutputLanguage] = useState(language);
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [blogCount, setBlogCount] = useState(0);
  const [blog, setBlog] = useState<GeneratedBlog | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setBusy] = useState(false);
  const [includeSeoImageAsset, setIncludeSeoImageAsset] = useState(false);
  const [ephemeralImageDataUrl, setEphemeralImageDataUrl] = useState<string | null>(null);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isCheckoutBusy, setCheckoutBusy] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [pdfRewrite, setPdfRewrite] = useState<BlogPdfRewriteResult | null>(null);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [isPdfBusy, setPdfBusy] = useState(false);

  const currentLanguage =
    globalLanguageOptions.find((option) => option.code === outputLanguage) ?? globalLanguageOptions[0];
  const isFreeLimitReached = plan === "free" && blogCount >= 3;
  const draftsLeft = plan === "free" ? Math.max(0, 3 - blogCount) : null;
  const imageCredits = profile?.assistantImageCredits ?? 0;
  const imagePreviewSrc = ephemeralImageDataUrl || blog?.imageAsset?.imageUrl || null;
  const isSessionOnlyImagePreview = Boolean(ephemeralImageDataUrl && !blog?.imageAsset?.imageUrl);

  useEffect(() => {
    const kw = searchParams.get("keyword");
    if (kw) setKeyword(kw);
  }, [searchParams]);

  useEffect(() => {
    setOutputLanguage(language);
  }, [language]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }

      setUid(user.uid);
      try {
        const [dash, nextProfile] = await Promise.all([
          getDashboardForUser(user.uid),
          getUserProfile(user.uid),
        ]);
        setPlan(dash.plan);
        setProfile(nextProfile);
        setBlogCount(dash.generatedBlogs.length);
        if (dash.plan === "free" && dash.generatedBlogs.length >= 3) {
          router.replace("/billing?upgrade=blog-limit");
          return;
        }
        if (dash.generatedBlogs[0]) {
          setBlog(dash.generatedBlogs[0]);
          setEphemeralImageDataUrl(null);
          setKeyword((current) => (current.trim() ? current : dash.generatedBlogs[0].keyword));
        }
      } catch {
        setStatus("Could not load your last generated draft.");
      }
    });
    return unsub;
  }, [router]);

  async function handleConfirmImageCheckout() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatus("You must be signed in to buy an SEO image credit.");
      return;
    }

    setCheckoutBusy(true);

    try {
      await ensureRazorpayCheckout();
    } catch (error) {
      setCheckoutBusy(false);
      setStatus(formatAuthErrorMessage(error, "Razorpay checkout could not be loaded."));
      return;
    }

    setStatus("Preparing Razorpay checkout...");

    try {
      const orderToken = await currentUser.getIdToken();
      const order = await postAuthenticatedJson<RazorpayOrderResponse>(
        "/api/assistant-addons/order",
        orderToken,
        { addonType: "seo-image", phone: profile?.phone ?? "" },
      );
      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const razorpay = new RazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Aether SEO",
        description: `${order.title} one-time credit`,
        order_id: order.orderId,
        prefill: {
          contact: profile?.phone || undefined,
          email: currentUser.email ?? undefined,
          name: currentUser.displayName ?? undefined,
        },
        notes: {
          addonType: "seo-image",
          source: "generate-blog",
          unitPriceUsd: imageAddonDefinition.priceLabel,
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => {
            setCheckoutBusy(false);
            setStatus("Payment was cancelled before completion.");
          },
        },
        handler: async (response) => {
          setStatus("Verifying Razorpay payment...");
          try {
            const verificationToken = await currentUser.getIdToken();
            await postAuthenticatedJson<{ ok: true }>(
              "/api/assistant-addons/verify",
              verificationToken,
              { addonType: "seo-image", ...response },
            );
            setProfile((current) =>
              current
                ? {
                    ...current,
                    assistantImageCredits: current.assistantImageCredits + 1,
                  }
                : current,
            );
            setIncludeSeoImageAsset(true);
            setCheckoutOpen(false);
            setCheckoutBusy(false);
            setStatus("SEO image credit added to your account.");
          } catch (error) {
            setCheckoutBusy(false);
            setStatus(formatAuthErrorMessage(error, "Could not verify the add-on payment."));
          }
        },
      });

      razorpay.open();
    } catch (error) {
      setCheckoutBusy(false);
      setStatus(formatAuthErrorMessage(error, "Could not create the add-on order."));
    }
  }

  async function handleGenerate() {
    if (!uid) {
      setStatus("You must be signed in to generate a blog.");
      return;
    }

    if (!keyword.trim()) {
      setStatus("Enter a target keyword first.");
      return;
    }

    if (isFreeLimitReached) {
      router.replace("/billing?upgrade=blog-limit");
      return;
    }

    if (includeSeoImageAsset && imageCredits < 1) {
      setStatus("SEO image credits are empty. Buy a $5 image credit before adding it to this run.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatus("You must be signed in to generate a blog.");
      return;
    }

    setBusy(true);
    setStatus(includeSeoImageAsset ? "Generating blog draft and SEO image..." : "Generating blog draft...");

    try {
      const token = await currentUser.getIdToken();
      const payload = await postAuthenticatedJson<GenerateBlogApiResponse>(
        "/api/generate-blog",
        token,
        { keyword, tone, length, language: outputLanguage, includeSeoImageAsset },
      );

      if (!payload.blog) {
        throw new Error("The blog generator returned an empty result.");
      }

      setEphemeralImageDataUrl(payload.ephemeralImageDataUrl ?? null);

      const next = await saveGeneratedBlogForUser(uid, payload.blog);
      const latestBlog = next.generatedBlogs[0] ?? null;

      setPlan(next.plan);
      setBlogCount(next.generatedBlogs.length);
      if (latestBlog) {
        setBlog(latestBlog);
      }

      if ((payload.creditsUsed?.image ?? 0) > 0) {
        setProfile((current) =>
          current
            ? {
                ...current,
                assistantImageCredits: Math.max(0, current.assistantImageCredits - (payload.creditsUsed?.image ?? 0)),
              }
            : current,
        );
        setIncludeSeoImageAsset(false);
      }

      setStatus(
        payload.warnings?.length
          ? `Blog generated and saved to your workspace. ${payload.warnings[0]}`
          : payload.creditsUsed?.image
            ? "Blog and SEO image generated and saved to your workspace."
            : "Blog generated and saved to your workspace.",
      );
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

  function handlePdfSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      setSelectedPdf(null);
      setPdfStatus(null);
      return;
    }

    if (!nextFile.name.toLowerCase().endsWith(".pdf")) {
      setSelectedPdf(null);
      setPdfRewrite(null);
      setPdfStatus("Select a PDF file.");
      event.target.value = "";
      return;
    }

    setSelectedPdf(nextFile);
    setPdfRewrite(null);
    setPdfStatus(`${nextFile.name} is ready for rewrite.`);
  }

  async function handleRewritePdf() {
    if (!uid) {
      setPdfStatus("You must be signed in to rewrite a PDF.");
      return;
    }

    if (!selectedPdf) {
      setPdfStatus("Upload a PDF first.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setPdfStatus("You must be signed in to rewrite a PDF.");
      return;
    }

    setPdfBusy(true);
    setPdfStatus("Uploading PDF and running the high-level rewrite model...");

    try {
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.set("file", selectedPdf);
      formData.set("language", outputLanguage);

      const payload = await postAuthenticatedFormData<BlogPdfRewriteApiResponse>(
        "/api/blog-pdf-rewrite",
        token,
        formData,
      );

      if (!payload.document) {
        throw new Error("The PDF rewrite returned an empty result.");
      }

      setPdfRewrite(payload.document);
      setPdfStatus("PDF rewrite is ready. Download the cleaned file below.");
    } catch (error) {
      setPdfStatus(error instanceof Error ? error.message : "Could not rewrite the PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  function handleDownloadPdfRewrite() {
    if (!pdfRewrite) {
      return;
    }

    const blob = new Blob([pdfRewrite.cleanedContent], {
      type: "text/plain;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = pdfRewrite.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 0);
  }

  return (
    <div className="space-y-4">
      {isCheckoutOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-image-checkout-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-[22px] border border-[var(--site-border)] bg-[var(--site-bg)] p-7 shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--site-muted)]">
                  {imageAddonDefinition.title}
                </p>
                <h2 id="blog-image-checkout-heading" className="mt-2 text-[1.3rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--site-fg)]">
                  Blog image credit checkout
                </h2>
                <p className="mt-2 text-[13px] leading-[1.7] text-[var(--site-muted)]">
                  This is a one-time Razorpay payment for a single SEO image credit. The credit is added to your account immediately after verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isCheckoutBusy) setCheckoutOpen(false);
                }}
                disabled={isCheckoutBusy}
                className="site-button-secondary rounded-full px-3 py-1.5 text-[12px] font-medium disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 divide-y divide-[var(--site-border)] overflow-hidden rounded-[14px] border border-[var(--site-border)] bg-[var(--site-panel)]">
              <SummaryRow label="One-time charge" value={imageAddonDefinition.priceLabel} />
              <SummaryRow label="Credit added" value="1 use" />
              <SummaryRow label="Add-on" value={imageAddonDefinition.title} />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                disabled={isCheckoutBusy}
                className="site-button-secondary rounded-[12px] border px-4 py-2.5 text-[12px] font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmImageCheckout()}
                disabled={isCheckoutBusy}
                className="site-button-primary rounded-[12px] px-5 py-2.5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue to payment
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2.5 lg:grid-cols-[320px,1fr]">
        {/* ══ Left: controls panel ════════════════════════════ */}
        <aside className="flex flex-col overflow-hidden rounded-[1.25rem] border border-[var(--site-border)] bg-[var(--site-bg)]">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--site-border)] px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">Workspace</p>
              <h1 className="mt-0.5 text-[15px] font-medium text-[var(--site-fg)]">{copy.title}</h1>
              <p className="mt-0.5 text-[12px] leading-[1.55] text-[var(--site-muted)]">{copy.body}</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--site-primary)] text-white">
              <IconSparkle />
            </div>
          </div>

          {/* Form controls */}
          <div className="flex-1 space-y-3.5 px-5 py-4">
            <div>
              <FieldLabel>{copy.keywordLabel}</FieldLabel>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="AI SEO workflow for startups"
                className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] px-3.5 py-2.5 text-[13px] text-[var(--site-fg)] placeholder:text-[var(--site-muted)] outline-none transition-colors focus:border-[var(--site-border-strong)]"
              />
            </div>

            <div>
              <FieldLabel>{copy.toneLabel}</FieldLabel>
              <div className="grid gap-1.5">
                {toneOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTone(option)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[12px] font-medium transition-colors ${
                      tone === option
                        ? "border-[var(--site-primary)] bg-[color-mix(in_srgb,var(--site-primary)_8%,var(--site-bg))] text-[var(--site-fg)]"
                        : "border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-muted)] hover:border-[var(--site-border-strong)] hover:text-[var(--site-fg)]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                        tone === option ? "bg-[var(--site-primary)]" : "bg-[var(--site-border-strong)]"
                      }`}
                    />
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>{copy.lengthLabel}</FieldLabel>
              <div className="flex gap-1.5">
                {copy.lengths.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLength(option)}
                    className={`flex-1 rounded-lg border py-2 text-center text-[11px] font-medium transition-colors ${
                      length === option
                        ? "border-[var(--site-primary)] bg-[color-mix(in_srgb,var(--site-primary)_8%,var(--site-bg))] text-[var(--site-fg)]"
                        : "border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-muted)] hover:border-[var(--site-border-strong)]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>{copy.languageLabel}</FieldLabel>
              <div className="relative">
                <select
                  value={outputLanguage}
                  onChange={(event) => setOutputLanguage(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] px-3.5 py-2.5 pr-8 text-[13px] text-[var(--site-fg)] outline-none transition-colors focus:border-[var(--site-border-strong)]"
                >
                  {globalLanguageOptions.map((option) => (
                    <option key={option.code} value={option.code}>{option.nativeLabel}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--site-muted)]">▾</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-[1.5] text-[var(--site-muted)]">
                {copy.languageHelper} Current: {currentLanguage.nativeLabel}.
              </p>
            </div>

            <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-panel)] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[var(--site-fg)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--site-primary)]/12 text-[var(--site-primary)]">
                      <IconImage />
                    </span>
                    <p className="text-[13px] font-semibold">SEO image generation</p>
                  </div>
                  <p className="mt-2 text-[11px] leading-[1.6] text-[var(--site-muted)]">
                    Generate one SEO-driven blog image per credit. The output includes alt text, a search-friendly filename, and a ready-to-download asset.
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[var(--site-muted)]">{imageAddonDefinition.priceLabel}</span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[1.75rem] font-semibold leading-none text-[var(--site-fg)]">
                  {imageCredits}
                  <span className="ml-1 text-[10px] font-normal uppercase tracking-[.12em] text-[var(--site-muted)]">
                    credits
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  className="site-button-secondary rounded-[10px] border px-3 py-1.5 text-[11px] font-semibold"
                >
                  Buy credit
                </button>
              </div>

              <label className={`mt-3 flex items-center gap-2 ${imageCredits > 0 ? "" : "opacity-40"}`}>
                <input
                  type="checkbox"
                  checked={includeSeoImageAsset}
                  onChange={(event) => setIncludeSeoImageAsset(event.target.checked)}
                  disabled={imageCredits < 1}
                  className="h-3.5 w-3.5 accent-[var(--site-primary)]"
                />
                <span className="text-[11px] text-[var(--site-muted)]">Include with this run</span>
              </label>
            </div>

            <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-panel)] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[var(--site-fg)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--site-primary)]/12 text-[var(--site-primary)]">
                      <IconDoc />
                    </span>
                    <p className="text-[13px] font-semibold">PDF originality rewrite</p>
                  </div>
                  <p className="mt-2 text-[11px] leading-[1.6] text-[var(--site-muted)]">
                    Upload a PDF, rewrite the copy to reduce AI-style phrasing and plagiarism risk, then download an editable cleaned file.
                  </p>
                </div>
                <span className="rounded-full border border-[var(--site-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--site-muted)]">
                  High-level model
                </span>
              </div>

              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-dashed border-[var(--site-border-strong)] bg-[var(--site-bg)] px-3 py-3 text-[12px] font-medium text-[var(--site-fg)] transition-colors hover:border-[var(--site-primary)]">
                <IconUpload />
                <span>{selectedPdf ? "Replace PDF" : "Upload PDF"}</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfSelection}
                  className="sr-only"
                />
              </label>

              {selectedPdf ? (
                <div className="mt-3 rounded-[12px] border border-[var(--site-border)] bg-[var(--site-bg)] px-3 py-2.5">
                  <p className="truncate text-[12px] font-medium text-[var(--site-fg)]">{selectedPdf.name}</p>
                  <p className="mt-1 text-[11px] text-[var(--site-muted)]">
                    {formatFileSize(selectedPdf.size)} • Output language: {currentLanguage.nativeLabel}
                  </p>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRewritePdf}
                  disabled={isPdfBusy || !selectedPdf}
                  className="site-button-primary flex items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPdfBusy ? <Spinner /> : <IconSparkle />}
                  {isPdfBusy ? "Rewriting..." : "Rewrite PDF"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdfRewrite}
                  disabled={!pdfRewrite}
                  className="site-button-secondary flex items-center justify-center gap-2 rounded-[10px] border px-4 py-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IconDownload />
                  Download cleaned file
                </button>
              </div>

              <p className="mt-2 text-[11px] leading-[1.6] text-[var(--site-muted)]">
                {pdfStatus ?? "Supports text-based PDF uploads up to 10 MB. The cleaned file downloads as editable text."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isBusy || isFreeLimitReached}
              className="site-button-primary btn-shimmer relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? <Spinner /> : <IconSparkle />}
              {isBusy ? "Generating..." : copy.generateButton}
            </button>

            <p className="text-[11px] leading-[1.5] text-[var(--site-muted)]">
              {status ?? (
                isFreeLimitReached
                  ? "Free plan includes 3 blog drafts. Upgrade to continue."
                  : "Draft will be saved to your workspace automatically."
              )}
            </p>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] p-3.5">
              <div>
                <p className="text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">{copy.companyBlogLink}</p>
                <p className="mt-0.5 text-[12px] leading-[1.5] text-[var(--site-muted)]">{copy.companyBlogBody}</p>
              </div>
              <Link
                href={`/${language}/blog`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] text-[var(--site-muted)] transition-colors hover:border-[var(--site-border-strong)] hover:text-[var(--site-fg)]"
              >
                <IconArrowOut />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-[var(--site-border)] bg-[var(--site-panel)] px-5 py-2.5">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${isBusy ? "bg-amber-400" : "bg-emerald-500"}`}
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
            <p className="text-[11px] text-[var(--site-muted)]">
              {isBusy
                ? "AI is drafting your blog..."
                : draftsLeft !== null
                  ? `${draftsLeft} free draft${draftsLeft === 1 ? "" : "s"} remaining`
                  : "Workspace ready"}
            </p>
          </div>
        </aside>

        {/* ══ Right: preview panel ════════════════════════════ */}
        <section className="flex flex-col overflow-hidden rounded-[1.25rem] border border-[var(--site-border)] bg-[var(--site-bg)]">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--site-border)] px-6 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">{copy.previewEyebrow}</p>

              {blog ? (
                <h2 className="mt-1.5 text-[1.6rem] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--site-fg)]">
                  {blog.title}
                </h2>
              ) : (
                <div className="mt-2 h-7 w-4/5 animate-pulse rounded-lg bg-[var(--site-border)]" />
              )}

              <div className={`mt-2 flex flex-wrap items-center gap-1.5 transition-opacity ${blog ? "opacity-100" : "opacity-30"}`}>
                {[
                  { label: length },
                  { label: "~5 min read" },
                  { label: currentLanguage.nativeLabel },
                  ...(blog?.imageAsset ? [{ label: "Image attached" }] : []),
                ].map(({ label }, index) => (
                  <span
                    key={`${label}-${index}`}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--site-border)] bg-[var(--site-panel)] px-2 py-0.5 text-[10px] text-[var(--site-muted)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className={`grid grid-cols-3 gap-1.5 transition-opacity ${blog ? "opacity-100" : "opacity-25 pointer-events-none"}`}>
              <ScoreCard label="SEO score" value={92} />
              <ScoreCard label="Readability" value={88} />
              <ScoreCard label="Originality" value={96} />
            </div>
          </div>

          <div className="flex-1 space-y-4 px-6 py-5">
            {blog ? (
              <>
                {blog.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-[13px] leading-[1.75] text-[var(--site-fg)]">{paragraph}</p>
                ))}

                {blog.imageAsset ? (
                  <BlogImageCard
                    fileName={blog.imageAsset.fileName}
                    src={imagePreviewSrc}
                    title={blog.imageAsset.title}
                    alt={blog.imageAsset.alt}
                    sessionOnly={isSessionOnlyImagePreview}
                  />
                ) : (
                  <ImagePlaceholder />
                )}

                <h3 className="text-[15px] font-medium text-[var(--site-fg)]">{blog.sectionTitle}</h3>
                <p className="text-[13px] leading-[1.75] text-[var(--site-fg)]">{blog.sectionBody}</p>

                <div className="overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)]">
                  <div className="border-b border-[var(--site-border)] px-4 py-2.5">
                    <p className="text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">{notesHeading}</p>
                  </div>
                  <div className="divide-y divide-[var(--site-border)]">
                    {blog.bullets.map((bullet, index) => (
                      <div key={index} className="flex items-start gap-2.5 px-4 py-2.5">
                        <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--site-muted)] opacity-50" />
                        <span className="text-[12px] leading-[1.6] text-[var(--site-muted)]">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--site-border)]">
                  <div className="flex items-center gap-2 border-b border-[var(--site-border)] bg-[var(--site-panel)] px-4 py-2.5">
                    <IconDoc className="text-[var(--site-muted)]" />
                    <p className="text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">Meta description</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[12px] leading-[1.6] text-[var(--site-muted)]">{blog.metaDescription}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {[90, 75, 83].map((width, index) => (
                  <div
                    key={index}
                    className="h-3 animate-pulse rounded-full bg-[var(--site-border)]"
                    style={{ width: `${width}%`, animationDelay: `${index * 150}ms` }}
                  />
                ))}

                <ImagePlaceholder />

                {[95, 60].map((width, index) => (
                  <div
                    key={index}
                    className="h-3 animate-pulse rounded-full bg-[var(--site-border)]"
                    style={{ width: `${width}%`, animationDelay: `${index * 150}ms` }}
                  />
                ))}

                <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] p-4">
                  <p className="text-[14px] font-medium text-[var(--site-fg)]">No preview available yet</p>
                  <p className="mt-1.5 text-[12px] leading-[1.65] text-[var(--site-muted)]">
                    Use the controls on the left to generate a blog draft. Once the AI response is saved,
                    this preview will show the actual title, body, bullets, meta description, and any generated blog image from your workspace.
                  </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--site-border)] opacity-40">
                  <div className="flex items-center gap-2 border-b border-[var(--site-border)] bg-[var(--site-panel)] px-4 py-2.5">
                    <IconDoc className="text-[var(--site-muted)]" />
                    <p className="text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">Meta description</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[12px] text-[var(--site-muted)]">Generate a draft to see the SEO meta description here.</p>
                  </div>
                </div>
              </>
            )}

            <div className="overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--site-border)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <IconDoc className="text-[var(--site-muted)]" />
                  <p className="text-[10px] uppercase tracking-[.14em] text-[var(--site-muted)]">PDF rewrite output</p>
                </div>
                {pdfRewrite ? (
                  <button
                    type="button"
                    onClick={handleDownloadPdfRewrite}
                    className="site-button-secondary inline-flex items-center gap-2 rounded-[10px] border px-3 py-1.5 text-[10px] font-semibold"
                  >
                    <IconDownload />
                    Download
                  </button>
                ) : null}
              </div>

              {pdfRewrite ? (
                <div className="space-y-3 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] px-2.5 py-1 text-[10px] text-[var(--site-muted)]">
                      {pdfRewrite.pageCount} pages
                    </span>
                    <span className="rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] px-2.5 py-1 text-[10px] text-[var(--site-muted)]">
                      {pdfRewrite.wordCount} words
                    </span>
                    <span className="rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] px-2.5 py-1 text-[10px] text-[var(--site-muted)]">
                      {pdfRewrite.model}
                    </span>
                  </div>

                  <div>
                    <p className="text-[14px] font-medium text-[var(--site-fg)]">{pdfRewrite.title}</p>
                    <p className="mt-1 text-[12px] leading-[1.6] text-[var(--site-muted)]">{pdfRewrite.summary}</p>
                    <p className="mt-2 text-[11px] text-[var(--site-muted)]">Source file: {pdfRewrite.sourceFileName}</p>
                  </div>

                  {pdfRewrite.highlights.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {pdfRewrite.highlights.map((highlight, index) => (
                        <span
                          key={`${highlight}-${index}`}
                          className="rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] px-2.5 py-1 text-[10px] text-[var(--site-muted)]"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="max-h-72 overflow-y-auto rounded-[12px] border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3">
                    <p className="whitespace-pre-wrap text-[12px] leading-[1.75] text-[var(--site-fg)]">
                      {pdfRewrite.cleanedContent}
                    </p>
                  </div>

                  {pdfRewrite.warnings.length > 0 ? (
                    <p className="text-[11px] leading-[1.6] text-[var(--site-muted)]">
                      {pdfRewrite.warnings[0]}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="px-4 py-4">
                  <p className="text-[13px] font-medium text-[var(--site-fg)]">No PDF rewrite yet</p>
                  <p className="mt-1.5 text-[12px] leading-[1.65] text-[var(--site-muted)]">
                    Upload a PDF from the left panel to rewrite the document and download a cleaner version from this workspace.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function GenerateBlogPage() {
  return (
    <Suspense fallback={<SiteLoader size="lg" />}>
      <GenerateBlogPageContent />
    </Suspense>
  );
}

/*
  Add to globals.css:

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .btn-shimmer::after {
    content: '';
    position: absolute; inset: 0;
    background: rgba(255,255,255,.1);
    transform: translateX(-100%) skewX(-12deg);
    animation: shimmer 2.5s 1s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes shimmer {
    from { transform: translateX(-100%) skewX(-12deg); }
    to   { transform: translateX(250%) skewX(-12deg); }
  }
*/

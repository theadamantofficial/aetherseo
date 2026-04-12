"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";
import SiteLoader from "@/components/site-loader";
import { auth } from "@/lib/firebase";
import {
  getDashboardForUser,
  getUserProfile,
  savePlagiarismRunForUser,
  type BillingPlan,
  type UserProfile,
} from "@/lib/firebase-data";
import { resolveAppUiLanguage, type AppUiLanguage } from "@/lib/app-ui-language";
import type { PlagiarismRiskLevel, PlagiarismRun, PlagiarismRunDraft } from "@/lib/plagiarism-scan";
import { postAuthenticatedJson } from "@/lib/razorpay-client";

type StatusState = {
  text: string;
  tone: "error" | "muted";
};

type PlagiarismApiResponse = {
  error?: string;
  scan?: PlagiarismRunDraft;
};

type UiCopy = {
  authRequired: string;
  badge: string;
  body: string;
  emptyBody: string;
  emptyTitle: string;
  exportButton: string;
  exportHint: string;
  generating: string;
  idle: string;
  iframeLabel: string;
  iframeNote: string;
  inputRequired: string;
  inputPlaceholder: string;
  keywords: string;
  latest: string;
  lockedBody: string;
  lockedTitle: string;
  notesTitle: string;
  overviewTitle: string;
  paidOnly: string;
  previewTitle: string;
  previewNote: string;
  reasoningLabel: string;
  rewriteTitle: string;
  runButton: string;
  saved: string;
  scoreLabel: string;
  seoIdeas: string;
  snapshotLabel: string;
  statusNote: string;
  subtitle: string;
  title: string;
  unlockCta: string;
  warningsLabel: string;
};

const baseCopy: UiCopy = {
  authRequired: "You must be signed in to use the AI plagiarism check.",
  badge: "Paid originality workflow",
  body: "Scan a live page, flag risky lines, rewrite them faster, and export a branded PDF from the same workspace.",
  emptyBody:
    "Enter a public page URL to extract its visible text, review likely plagiarism-risk lines, and generate paste-ready alternatives.",
  emptyTitle: "No plagiarism scan yet",
  exportButton: "Export PDF",
  exportHint: "Branded PDF export includes a watermark and a structured rewrite summary.",
  generating: "Running AI plagiarism check...",
  idle: "This is a risk-based AI review of the page copy, not verified external source proof.",
  iframeLabel: "Live page preview",
  iframeNote: "Some sites block embedded previews. The metadata snapshot still loads even if the live frame is restricted.",
  inputRequired: "Enter a public page URL first.",
  inputPlaceholder: "https://www.yourdomain.com/page",
  keywords: "Keyword alternatives",
  latest: "Latest saved scan",
  lockedBody: "Extended metadata, keyword packs, and replacement image directions stay behind extra credits.",
  lockedTitle: "Premium follow-ups",
  notesTitle: "Review notes",
  overviewTitle: "Risk overview",
  paidOnly: "AI plagiarism check is available on paid plans only. Upgrade to continue.",
  previewTitle: "Page snapshot",
  previewNote: "The snapshot is generated from the live page title, meta description, headings, and extracted copy.",
  reasoningLabel: "Why it was flagged",
  rewriteTitle: "Alternative draft",
  runButton: "Run check",
  saved: "Plagiarism scan generated and saved to your workspace.",
  scoreLabel: "Originality score",
  seoIdeas: "SEO follow-ups",
  snapshotLabel: "Metadata snapshot",
  statusNote: "Fast enough for single-page reviews and client-facing rewrite loops.",
  subtitle: "AI-assisted plagiarism check",
  title: "Plagiarism Check",
  unlockCta: "Open AI assistant add-ons",
  warningsLabel: "Generation notes",
};

const plagiarismUiCopy: Record<AppUiLanguage, UiCopy> = {
  en: baseCopy,
  hi: {
    ...baseCopy,
    authRequired: "AI plagiarism check use karne ke liye sign in hona zaruri hai.",
    body: "Live page scan karo, risky lines flag karo, fast rewrite pao, aur same workspace se branded PDF export karo.",
    emptyBody:
      "Public page URL do aur uska visible text extract karke plagiarism-risk lines aur paste-ready alternatives dekho.",
    emptyTitle: "Abhi koi plagiarism scan nahi hai",
    generating: "AI plagiarism check chal raha hai...",
    idle: "Ye page copy ka risk-based AI review hai, verified external source proof nahi.",
    inputRequired: "Pehle public page URL enter karo.",
    lockedBody: "Extended metadata, keyword packs aur replacement image directions extra credits ke peeche hain.",
    paidOnly: "AI plagiarism check sirf paid plans me available hai. Continue karne ke liye upgrade karo.",
    runButton: "Check chalao",
    saved: "Plagiarism scan generate ho gaya aur workspace me save ho gaya.",
    statusNote: "Single-page reviews aur client rewrite loops ke liye fast.",
  },
  fr: {
    ...baseCopy,
    authRequired: "Vous devez etre connecte pour utiliser la verification de plagiat IA.",
    body: "Scannez une page en direct, reperez les lignes a risque, reecrivez-les plus vite, puis exportez un PDF marque.",
    emptyBody:
      "Ajoutez une URL publique pour extraire le texte visible, examiner les lignes a risque et generer des alternatives pretes a coller.",
    emptyTitle: "Aucune analyse pour le moment",
    generating: "Verification de plagiat IA en cours...",
    idle: "Il s'agit d'une revue IA basee sur le risque, pas d'une preuve externe verifiee.",
    inputRequired: "Saisissez d'abord une URL publique.",
    paidOnly: "La verification de plagiat IA est reservee aux offres payantes. Passez a une offre superieure.",
    runButton: "Lancer l'analyse",
    saved: "Analyse de plagiat generee et enregistree dans le workspace.",
  },
  de: {
    ...baseCopy,
    authRequired: "Du musst angemeldet sein, um den KI-Plagiatscheck zu nutzen.",
    body: "Pruefe eine Live-Seite, markiere riskante Zeilen, erzeuge schnellere Umschreibungen und exportiere ein gebrandetes PDF.",
    emptyBody:
      "Gib eine oeffentliche Seiten-URL ein, um sichtbaren Text zu extrahieren, riskante Passagen zu pruefen und direkt nutzbare Alternativen zu erhalten.",
    emptyTitle: "Noch kein Plagiatscheck",
    generating: "KI-Plagiatscheck laeuft...",
    idle: "Das ist eine risikobasierte KI-Pruefung, kein verifizierter externer Quellennachweis.",
    inputRequired: "Gib zuerst eine oeffentliche URL ein.",
    paidOnly: "Der KI-Plagiatscheck ist nur in bezahlten Plaenen verfuegbar. Bitte upgrade.",
    runButton: "Pruefung starten",
    saved: "Plagiatscheck wurde erzeugt und im Workspace gespeichert.",
  },
  ja: {
    ...baseCopy,
    authRequired: "AI plagiarism check を使うにはサインインが必要です。",
    body: "ライブページを解析し、リスクの高い行を見つけ、すばやく書き換え案を作成し、そのまま透かし入り PDF を出力できます。",
    emptyBody:
      "公開 URL を入力すると、表示テキストを抽出し、重複リスクのある文と貼り付け可能な代替案を表示します。",
    emptyTitle: "まだスキャン結果はありません",
    generating: "AI plagiarism check を実行中...",
    idle: "これはリスクベースの AI レビューであり、外部ソースの検証結果ではありません。",
    inputRequired: "先に公開 URL を入力してください。",
    paidOnly: "AI plagiarism check は有料プランで利用できます。アップグレードしてください。",
    runButton: "チェックを実行",
    saved: "スキャン結果を生成し、ワークスペースに保存しました。",
  },
  ko: {
    ...baseCopy,
    authRequired: "AI 표절 검사를 사용하려면 로그인해야 합니다.",
    body: "실시간 페이지를 스캔하고, 위험한 문장을 표시하고, 빠르게 대체 문안을 만들고, 워터마크가 포함된 PDF를 내보낼 수 있습니다.",
    emptyBody:
      "공개 URL을 입력하면 보이는 텍스트를 추출하고, 표절 위험이 있는 문장과 바로 붙여 넣을 수 있는 대체 문안을 보여줍니다.",
    emptyTitle: "아직 스캔 결과가 없습니다",
    generating: "AI 표절 검사를 실행하는 중...",
    idle: "이 결과는 위험 기반 AI 리뷰이며, 외부 출처를 검증한 증거는 아닙니다.",
    inputRequired: "먼저 공개 URL을 입력하세요.",
    paidOnly: "AI 표절 검사는 유료 플랜에서만 사용할 수 있습니다. 업그레이드하세요.",
    runButton: "검사 실행",
    saved: "표절 스캔을 생성했고 워크스페이스에 저장했습니다.",
  },
};

function ScoreTone({ risk }: { risk: PlagiarismRiskLevel }) {
  const className =
    risk === "High"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
      : risk === "Medium"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}>
      {risk}
    </span>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--site-muted)] opacity-70">
      {children}
    </p>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[20px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{helper}</p>
    </article>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createPrintMarkup(scan: PlagiarismRun) {
  const flaggedRows = scan.matches
    .map(
      (match) => `
        <section class="block">
          <p class="label">Flagged line</p>
          <p class="body">${escapeHtml(match.line)}</p>
          <p class="chip">${escapeHtml(match.risk)}</p>
          <p class="label">Reason</p>
          <p class="body">${escapeHtml(match.reason)}</p>
          <p class="label">Alternative</p>
          <p class="body">${escapeHtml(match.alternative)}</p>
        </section>`,
    )
    .join("");
  const draftRows = scan.alternativeDraft
    .map((paragraph) => `<p class="body">${escapeHtml(paragraph)}</p>`)
    .join("");
  const keywordRows = scan.keywords
    .map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`)
    .join("");
  const altRows = scan.altTextSuggestions
    .map((suggestion) => `<li>${escapeHtml(suggestion)}</li>`)
    .join("");

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(scan.pdfExport.title)}</title>
      <style>
        body {
          color: #0f172a;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          line-height: 1.55;
          margin: 0;
          padding: 48px;
        }
        body::before {
          color: rgba(15, 23, 42, 0.06);
          content: "Aether SEO";
          font-size: 72px;
          font-weight: 700;
          left: 12%;
          letter-spacing: 0.24em;
          position: fixed;
          top: 38%;
          transform: rotate(-28deg);
          z-index: 0;
        }
        main {
          position: relative;
          z-index: 1;
        }
        h1 {
          font-size: 28px;
          margin: 0 0 8px;
        }
        h2 {
          font-size: 18px;
          margin: 28px 0 10px;
        }
        .subtitle {
          color: #475569;
          margin: 0 0 18px;
        }
        .grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin: 24px 0;
        }
        .card,
        .block {
          background: rgba(248, 250, 252, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 16px;
          padding: 18px;
        }
        .label {
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          margin: 0 0 8px;
          text-transform: uppercase;
        }
        .value {
          font-size: 26px;
          font-weight: 700;
          margin: 0;
        }
        .body {
          margin: 0 0 12px;
        }
        .chip {
          display: inline-block;
          margin: 0 0 14px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(30, 41, 59, 0.16);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .keyword {
          display: inline-block;
          margin: 0 8px 8px 0;
          padding: 7px 10px;
          border-radius: 999px;
          background: #e2e8f0;
          font-size: 12px;
          font-weight: 600;
        }
        ul {
          margin: 0;
          padding-left: 18px;
        }
      </style>
    </head>
    <body>
      <main>
        <h1>${escapeHtml(scan.pdfExport.title)}</h1>
        <p class="subtitle">${escapeHtml(scan.pdfExport.subtitle)}</p>
        <div class="grid">
          <section class="card">
            <p class="label">Page</p>
            <p class="value">${escapeHtml(scan.preview.host)}</p>
          </section>
          <section class="card">
            <p class="label">Originality score</p>
            <p class="value">${escapeHtml(String(scan.score))}</p>
          </section>
          <section class="card">
            <p class="label">Risk level</p>
            <p class="value">${escapeHtml(scan.riskLabel)}</p>
          </section>
        </div>
        <h2>Summary</h2>
        <p class="body">${escapeHtml(scan.summary)}</p>
        <h2>Flagged copy</h2>
        ${flaggedRows}
        <h2>Alternative draft</h2>
        ${draftRows}
        <h2>Keyword alternatives</h2>
        <div>${keywordRows}</div>
        <h2>Alt text ideas</h2>
        <ul>${altRows}</ul>
      </main>
    </body>
  </html>`;
}

export default function PlagiarismCheckPage() {
  const router = useRouter();
  const { language, uiLanguage } = useLanguage();
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [result, setResult] = useState<PlagiarismRun | null>(null);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<StatusState | null>(null);
  const [isBusy, setBusy] = useState(false);
  const [isReady, setReady] = useState(false);

  const activeLanguage = resolveAppUiLanguage(language, uiLanguage);
  const ui = plagiarismUiCopy[activeLanguage];
  const previewUrl = result?.preview.canonicalUrl || result?.url || url;
  const metrics = useMemo(
    () => [
      {
        label: ui.scoreLabel,
        value: result ? String(result.score) : "--",
        helper: result?.riskLabel ?? ui.idle,
      },
      {
        label: "Words scanned",
        value: result ? String(result.preview.wordCount) : "--",
        helper: result ? `${result.preview.sentenceCount} extracted sentences reviewed.` : ui.previewNote,
      },
      {
        label: "Flagged lines",
        value: result ? String(result.matches.length) : "--",
        helper: result ? "Each line includes an alternative version you can paste immediately." : ui.exportHint,
      },
    ],
    [result, ui.exportHint, ui.idle, ui.previewNote, ui.scoreLabel],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      setUid(currentUser.uid);

      try {
        const [dashboard, nextProfile] = await Promise.all([
          getDashboardForUser(currentUser.uid),
          getUserProfile(currentUser.uid),
        ]);
        setPlan(dashboard.plan);
        setProfile(nextProfile);

        if (dashboard.plan !== "paid") {
          router.replace("/billing?upgrade=assistant-locked");
          return;
        }

        const latestScan = dashboard.plagiarismRuns[0] ?? null;
        setResult(latestScan);
        if (latestScan?.url) {
          setUrl(latestScan.url);
        }
      } catch {
        setStatus({ tone: "error", text: ui.paidOnly });
      } finally {
        setReady(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, ui.paidOnly]);

  async function handleRunCheck() {
    if (!uid) {
      setStatus({ tone: "error", text: ui.authRequired });
      return;
    }

    if (plan !== "paid") {
      router.replace("/billing?upgrade=assistant-locked");
      return;
    }

    if (!url.trim()) {
      setStatus({ tone: "error", text: ui.inputRequired });
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatus({ tone: "error", text: ui.authRequired });
      return;
    }

    setBusy(true);
    setStatus({ tone: "muted", text: ui.generating });

    try {
      const token = await currentUser.getIdToken();
      const payload = await postAuthenticatedJson<PlagiarismApiResponse>("/api/plagiarism-check", token, {
        language: activeLanguage,
        url,
      });
      if (!payload.scan) {
        throw new Error("AI plagiarism check returned an empty result.");
      }

      const nextDashboard = await savePlagiarismRunForUser(uid, payload.scan);
      const nextResult = nextDashboard.plagiarismRuns[0] ?? null;
      setPlan(nextDashboard.plan);
      setResult(nextResult);
      setStatus({ tone: "muted", text: ui.saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not complete the plagiarism check.";
      if (message === ui.paidOnly || message.includes("paid plans only")) {
        router.replace("/billing?upgrade=assistant-locked");
        return;
      }
      setStatus({ tone: "error", text: message });
    } finally {
      setBusy(false);
    }
  }

  function handleExportPdf() {
    if (!result) {
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setStatus({ tone: "error", text: "Popup blocked. Allow popups to export the PDF." });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(createPrintMarkup(result));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  if (!isReady) {
    return <SiteLoader size="lg" />;
  }

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-6 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_65%)]"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <SectionEyebrow>{ui.badge}</SectionEyebrow>
            <h1 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.02em]">{ui.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--site-muted)]">{ui.body}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--site-muted)]">
              {ui.statusNote}
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--site-muted)]">
                Prompt credits
              </p>
              <p className="mt-2 text-2xl font-semibold leading-none">
                {profile?.assistantPromptCredits ?? 0}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--site-muted)]">
                Image credits
              </p>
              <p className="mt-2 text-2xl font-semibold leading-none">
                {profile?.assistantImageCredits ?? 0}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
        <div className="flex flex-col gap-3 xl:flex-row">
          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={ui.inputPlaceholder}
            className="site-input min-h-12 w-full rounded-[16px] px-4 py-3 outline-none"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleRunCheck()}
              disabled={isBusy}
              className="site-button-primary rounded-[16px] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? ui.generating : ui.runButton}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={!result}
              className="site-button-secondary rounded-[16px] border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ui.exportButton}
            </button>
          </div>
        </div>
        <p className={`mt-3 text-sm ${status?.tone === "error" ? "text-red-400" : "text-[var(--site-muted)]"}`}>
          {status?.text ?? ui.idle}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            helper={metric.helper}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </section>

      {result ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="overflow-hidden rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)]">
              <div className="border-b border-[var(--site-border)] px-5 py-4">
                <SectionEyebrow>{ui.previewTitle}</SectionEyebrow>
                <h2 className="mt-2 text-lg font-semibold">{result.preview.title || result.preview.host}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{ui.previewNote}</p>
              </div>
              <div className="grid gap-5 px-5 py-5 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[18px] border border-[var(--site-border)] bg-[linear-gradient(160deg,rgba(56,189,248,0.12),transparent_65%),var(--site-surface-soft)]">
                    {result.preview.imageUrl ? (
                      <img
                        src={result.preview.imageUrl}
                        alt={result.preview.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-end bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(15,23,42,0.04))] p-5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--site-muted)]">
                            {ui.snapshotLabel}
                          </p>
                          <p className="mt-2 text-lg font-semibold">{result.preview.host}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4">
                    <div className="flex items-center gap-3">
                      {result.preview.faviconUrl ? (
                        <img
                          src={result.preview.faviconUrl}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-6 w-6 rounded"
                        />
                      ) : null}
                      <p className="text-sm font-semibold">{result.preview.host}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
                      {result.preview.metaDescription || result.preview.excerpt}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-muted)]">
                      {ui.latest}
                    </p>
                    <p className="mt-2 text-lg font-semibold">{result.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{result.summary}</p>
                  </div>
                  <div className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-muted)]">
                      {ui.subtitle}
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      {result.preview.firstHeading || result.preview.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{result.preview.excerpt}</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)]">
              <div className="border-b border-[var(--site-border)] px-5 py-4">
                <SectionEyebrow>{ui.iframeLabel}</SectionEyebrow>
                <h2 className="mt-2 text-lg font-semibold">{previewUrl}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{ui.iframeNote}</p>
              </div>
              <div className="p-4">
                <div className="overflow-hidden rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface-soft)]">
                  <iframe
                    key={previewUrl}
                    src={previewUrl}
                    title={ui.iframeLabel}
                    loading="lazy"
                    className="h-[430px] w-full bg-white"
                  />
                </div>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="site-link-accent mt-3 inline-flex text-sm font-semibold"
                >
                  Open page in a new tab →
                </a>
              </div>
            </article>
          </section>

          <section className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionEyebrow>{ui.overviewTitle}</SectionEyebrow>
                <h2 className="mt-2 text-lg font-semibold">{result.riskLabel}</h2>
              </div>
              <div className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-2 text-sm font-semibold">
                {ui.scoreLabel}: {result.score}
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {result.matches.map((match) => (
                <article
                  key={`${match.line}-${match.reason}`}
                  className="rounded-[20px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="max-w-3xl text-base font-semibold leading-7">{match.line}</p>
                    <ScoreTone risk={match.risk} />
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-muted)]">
                        {ui.reasoningLabel}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{match.reason}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-muted)]">
                        Rewrite
                      </p>
                      <p className="mt-2 text-sm leading-6">{match.alternative}</p>
                      {match.keywordAlternatives.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {match.keywordAlternatives.map((keyword) => (
                            <span
                              key={`${match.line}-${keyword}`}
                              className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-medium text-[var(--site-muted)]"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
              <SectionEyebrow>{ui.rewriteTitle}</SectionEyebrow>
              <h2 className="mt-2 text-lg font-semibold">{result.pdfExport.subtitle}</h2>
              <div className="mt-5 space-y-4">
                {result.alternativeDraft.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`} className="text-sm leading-7 text-[var(--site-muted)]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>

            <div className="space-y-4">
              <article className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
                <SectionEyebrow>{ui.seoIdeas}</SectionEyebrow>
                <h2 className="mt-2 text-lg font-semibold">{ui.keywords}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--site-muted)]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-muted)]">
                    Alt text
                  </p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--site-muted)]">
                    {result.altTextSuggestions.map((suggestion) => (
                      <li key={suggestion} className="rounded-[16px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-3 py-2">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
                <SectionEyebrow>{ui.lockedTitle}</SectionEyebrow>
                <h2 className="mt-2 text-lg font-semibold">{ui.lockedBody}</h2>
                <div className="mt-4 space-y-3">
                  {result.lockedSuggestions.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[18px] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.title}</p>
                        <span className="rounded-full border border-[var(--site-border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--site-muted)]">
                          {item.creditCost} {item.creditType} credit
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{item.body}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/ai-assistant"
                  className="site-link-accent mt-4 inline-flex text-sm font-semibold"
                >
                  {ui.unlockCta} →
                </Link>
              </article>
            </div>
          </section>

          {result.warnings.length ? (
            <section className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
              <SectionEyebrow>{ui.warningsLabel}</SectionEyebrow>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {result.warnings.map((warning) => (
                  <article
                    key={warning}
                    className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4 text-sm leading-6 text-[var(--site-muted)]"
                  >
                    {warning}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 text-center">
          <SectionEyebrow>{ui.notesTitle}</SectionEyebrow>
          <h2 className="mt-2 text-xl font-semibold">{ui.emptyTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--site-muted)]">
            {ui.emptyBody}
          </p>
        </section>
      )}
    </div>
  );
}

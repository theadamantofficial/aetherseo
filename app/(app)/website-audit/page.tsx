"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { auth } from "@/lib/firebase";
import { resolveAppUiLanguage, type AppUiLanguage } from "@/lib/app-ui-language";
import {
  getDashboardForUser,
  saveAuditRunForUser,
  type AuditRun,
  type BillingPlan,
} from "@/lib/firebase-data";

type StatusState = {
  tone: "muted" | "error";
  text: string;
};

const auditUiCopy: Record<
  AppUiLanguage,
  {
    badge: string;
    title: string;
    body: string;
    placeholder: string;
    runButton: string;
    running: string;
    idle: string;
    authRequired: string;
    urlRequired: string;
    loadError: string;
    freeAuditLimitReached: string;
    runningStatus: string;
    savedStatus: string;
    score: string;
    scoreEmpty: string;
    breakdown: string;
    noIssuesTitle: string;
    noIssuesBody: string;
    recommendations: string;
    recommendationBody: string;
    launch: string;
    noRecommendationsTitle: string;
    noRecommendationsBody: string;
  }
> = {
  en: {
    badge: "Audit workspace",
    title: "Domain Health Analysis",
    body: "Deep crawl and technical diagnostic for enterprise-level performance.",
    placeholder: "https://www.yourdomain.com",
    runButton: "Audit Now",
    running: "Auditing...",
    idle: "Run an audit and save it to your workspace history.",
    authRequired: "You must be signed in to run an audit.",
    urlRequired: "Enter a domain or URL first.",
    loadError: "Could not load your last audit.",
    freeAuditLimitReached: "Free plan includes 1 website audit. Upgrade to run another.",
    runningStatus: "Running AI audit...",
    savedStatus: "Audit completed and saved to your workspace.",
    score: "SEO Score",
    scoreEmpty: "Run an audit to populate your first real SEO score and technical summary.",
    breakdown: "Audit Breakdown",
    noIssuesTitle: "No audit issues yet",
    noIssuesBody: "Once an audit is completed, critical issues, warnings, and passed checks will appear here.",
    recommendations: "AI Fix Recommendations",
    recommendationBody: "Turn this audit recommendation into the next action for your workspace.",
    launch: "Launch",
    noRecommendationsTitle: "No recommendations yet",
    noRecommendationsBody: "AI recommendations will appear here after the first saved website audit.",
  },
  hi: {
    badge: "Audit workspace",
    title: "Domain Health Analysis",
    body: "Enterprise-level performance ke liye deep crawl aur technical diagnostic.",
    placeholder: "https://www.yourdomain.com",
    runButton: "Audit Chalao",
    running: "Audit ho raha hai...",
    idle: "Audit chalao aur use workspace history me save karo.",
    authRequired: "Audit chalane ke liye sign in hona zaruri hai.",
    urlRequired: "Pehle domain ya URL enter karo.",
    loadError: "Aapka last audit load nahi ho paya.",
    freeAuditLimitReached: "Free plan me 1 website audit included hai. Dusra audit chalane ke liye upgrade karo.",
    runningStatus: "AI audit chal raha hai...",
    savedStatus: "Audit complete ho gaya aur workspace me save ho gaya.",
    score: "SEO Score",
    scoreEmpty: "Audit chalao aur apna pehla real SEO score aur technical summary dekho.",
    breakdown: "Audit Breakdown",
    noIssuesTitle: "Abhi koi audit issues nahi hain",
    noIssuesBody: "Audit complete hone ke baad critical issues, warnings aur passed checks yahan dikhengi.",
    recommendations: "AI Fix Recommendations",
    recommendationBody: "Is recommendation ko workspace ke next action me badlo.",
    launch: "Launch",
    noRecommendationsTitle: "Abhi recommendations nahi hain",
    noRecommendationsBody: "Pehle saved website audit ke baad AI recommendations yahan aayengi.",
  },
  fr: {
    badge: "Workspace d'audit",
    title: "Analyse de la sante du domaine",
    body: "Exploration profonde et diagnostic technique pour des performances de niveau entreprise.",
    placeholder: "https://www.votredomaine.com",
    runButton: "Lancer l'audit",
    running: "Audit en cours...",
    idle: "Lancez un audit et enregistrez-le dans l'historique du workspace.",
    authRequired: "Vous devez etre connecte pour lancer un audit.",
    urlRequired: "Saisissez d'abord un domaine ou une URL.",
    loadError: "Impossible de charger votre dernier audit.",
    freeAuditLimitReached: "Le plan Free inclut 1 audit de site. Passez a une offre payante pour en lancer un autre.",
    runningStatus: "Execution de l'audit IA...",
    savedStatus: "Audit termine et enregistre dans votre workspace.",
    score: "Score SEO",
    scoreEmpty: "Lancez un audit pour obtenir votre premier score SEO reel et un resume technique.",
    breakdown: "Detail de l'audit",
    noIssuesTitle: "Aucun probleme d'audit pour le moment",
    noIssuesBody: "Une fois l'audit termine, les problemes critiques, avertissements et validations apparaitront ici.",
    recommendations: "Recommandations IA",
    recommendationBody: "Transformez cette recommandation en prochaine action pour votre workspace.",
    launch: "Lancer",
    noRecommendationsTitle: "Aucune recommandation pour le moment",
    noRecommendationsBody: "Les recommandations IA apparaitront apres le premier audit enregistre.",
  },
  de: {
    badge: "Audit-Workspace",
    title: "Domain Health Analysis",
    body: "Tiefer Crawl und technische Diagnose fuer Performance auf Enterprise-Niveau.",
    placeholder: "https://www.deinedomain.com",
    runButton: "Audit starten",
    running: "Audit laeuft...",
    idle: "Fuehre ein Audit aus und speichere es im Workspace-Verlauf.",
    authRequired: "Du musst angemeldet sein, um ein Audit auszufuehren.",
    urlRequired: "Gib zuerst eine Domain oder URL ein.",
    loadError: "Dein letztes Audit konnte nicht geladen werden.",
    freeAuditLimitReached: "Der Free-Plan enthaelt 1 Website-Audit. Upgrade, um ein weiteres Audit zu starten.",
    runningStatus: "AI-Audit wird ausgefuehrt...",
    savedStatus: "Audit abgeschlossen und im Workspace gespeichert.",
    score: "SEO-Score",
    scoreEmpty: "Fuehre ein Audit aus, um den ersten echten SEO-Score und die technische Zusammenfassung zu sehen.",
    breakdown: "Audit-Aufschluesselung",
    noIssuesTitle: "Noch keine Audit-Probleme",
    noIssuesBody: "Nach dem Audit erscheinen hier kritische Probleme, Warnungen und bestandene Checks.",
    recommendations: "AI-Fix-Empfehlungen",
    recommendationBody: "Verwandle diese Empfehlung in die naechste Aktion fuer deinen Workspace.",
    launch: "Starten",
    noRecommendationsTitle: "Noch keine Empfehlungen",
    noRecommendationsBody: "AI-Empfehlungen erscheinen nach dem ersten gespeicherten Audit.",
  },
  ja: {
    badge: "監査ワークスペース",
    title: "ドメイン健全性分析",
    body: "エンタープライズ級の性能に向けた深いクロールと技術診断を実行します。",
    placeholder: "https://www.yourdomain.com",
    runButton: "監査を実行",
    running: "監査中...",
    idle: "監査を実行してワークスペース履歴に保存してください。",
    authRequired: "監査を実行するにはサインインが必要です。",
    urlRequired: "まずドメインまたは URL を入力してください。",
    loadError: "前回の監査を読み込めませんでした。",
    freeAuditLimitReached: "Free プランではサイト監査は 1 回までです。次の監査にはアップグレードしてください。",
    runningStatus: "AI 監査を実行中...",
    savedStatus: "監査が完了し、ワークスペースに保存されました。",
    score: "SEO スコア",
    scoreEmpty: "監査を実行すると最初の SEO スコアと技術概要が表示されます。",
    breakdown: "監査の内訳",
    noIssuesTitle: "監査結果はまだありません",
    noIssuesBody: "監査完了後、重要な問題、警告、合格項目がここに表示されます。",
    recommendations: "AI 修正提案",
    recommendationBody: "この監査提案を次のワークスペース作業に変換します。",
    launch: "開始",
    noRecommendationsTitle: "提案はまだありません",
    noRecommendationsBody: "最初の監査を保存すると AI 提案がここに表示されます。",
  },
  ko: {
    badge: "감사 워크스페이스",
    title: "도메인 상태 분석",
    body: "엔터프라이즈 수준 성능을 위한 심층 크롤링과 기술 진단을 실행합니다.",
    placeholder: "https://www.yourdomain.com",
    runButton: "감사 실행",
    running: "감사 중...",
    idle: "감사를 실행하고 워크스페이스 기록에 저장하세요.",
    authRequired: "감사를 실행하려면 로그인해야 합니다.",
    urlRequired: "먼저 도메인 또는 URL을 입력하세요.",
    loadError: "이전 감사를 불러오지 못했습니다.",
    freeAuditLimitReached: "Free 플랜에는 웹사이트 감사 1회가 포함됩니다. 다음 감사를 실행하려면 업그레이드하세요.",
    runningStatus: "AI 감사를 실행하는 중...",
    savedStatus: "감사가 완료되어 워크스페이스에 저장되었습니다.",
    score: "SEO 점수",
    scoreEmpty: "감사를 실행하면 첫 번째 실제 SEO 점수와 기술 요약이 표시됩니다.",
    breakdown: "감사 분석",
    noIssuesTitle: "아직 감사 이슈가 없습니다",
    noIssuesBody: "감사가 완료되면 중요 문제, 경고, 통과 항목이 여기에 표시됩니다.",
    recommendations: "AI 수정 추천",
    recommendationBody: "이 감사 추천을 워크스페이스의 다음 작업으로 전환하세요.",
    launch: "실행",
    noRecommendationsTitle: "아직 추천이 없습니다",
    noRecommendationsBody: "첫 저장된 감사 이후 AI 추천이 여기에 표시됩니다.",
  },
};

export default function WebsiteAuditPage() {
  const router = useRouter();
  const { language, uiLanguage } = useLanguage();
  const [uid, setUid] = useState("");
  const [url, setUrl] = useState("");
  const [auditRun, setAuditRun] = useState<AuditRun | null>(null);
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [auditCount, setAuditCount] = useState(0);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [isBusy, setBusy] = useState(false);
  const activeLanguage = resolveAppUiLanguage(language, uiLanguage);
  const ui = auditUiCopy[activeLanguage];
  const isFreeAuditLimitReached = plan === "free" && auditCount >= 1;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      setUid(currentUser.uid);
      try {
        const dashboard = await getDashboardForUser(currentUser.uid);
        if (dashboard.plan === "free" && dashboard.auditRuns.length >= 1) {
          router.replace("/billing?upgrade=audit-limit");
          return;
        }
        setPlan(dashboard.plan);
        setAuditCount(dashboard.auditRuns.length);
        if (dashboard.auditRuns[0]) {
          setAuditRun(dashboard.auditRuns[0]);
          setUrl(dashboard.auditRuns[0].url);
        }
      } catch {
        setStatus({ tone: "error", text: ui.loadError });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, ui.loadError]);

  async function handleAudit() {
    if (!uid) {
      setStatus({ tone: "error", text: ui.authRequired });
      return;
    }

    if (!url.trim()) {
      setStatus({ tone: "error", text: ui.urlRequired });
      return;
    }

    if (isFreeAuditLimitReached) {
      setStatus({ tone: "error", text: ui.freeAuditLimitReached });
      router.replace("/billing?upgrade=audit-limit");
      return;
    }

    setBusy(true);
    setStatus({ tone: "muted", text: ui.runningStatus });

    try {
      const response = await fetch("/api/website-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not run the website audit.");
      }

      const nextAuditRun = payload.audit as AuditRun;
      setAuditRun(nextAuditRun);
      const nextDashboard = await saveAuditRunForUser(uid, nextAuditRun);
      setPlan(nextDashboard.plan);
      setAuditCount(nextDashboard.auditRuns.length);
      setStatus({ tone: "muted", text: ui.savedStatus });
    } catch (error) {
      if (error instanceof Error && error.message === "Free plan includes 1 website audit. Upgrade to run another.") {
        router.replace("/billing?upgrade=audit-limit");
        return;
      }
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not run the website audit.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5 text-center">
        <p className="mx-auto text-xs font-medium uppercase tracking-wider text-[var(--site-muted)]">
          {ui.badge}
        </p>
        <h1 className="text-xl font-semibold">{ui.title}</h1>
        <p className="site-muted mt-3 text-sm">{ui.body}</p>
      </section>

      <section
        className="flex flex-col gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4 sm:flex-row"
      >
        <input
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={ui.placeholder}
          className="site-input w-full rounded-xl px-4 py-3 outline-none"
        />
        <button
          type="button"
          onClick={handleAudit}
          disabled={isBusy || isFreeAuditLimitReached}
          className="site-button-primary rounded-xl px-7 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isBusy ? ui.running : ui.runButton}
        </button>
      </section>
      <p className={`text-sm ${status?.tone === "error" ? "text-red-500" : "site-muted"}`}>
        {status?.text ?? (isFreeAuditLimitReached ? ui.freeAuditLimitReached : ui.idle)}
      </p>

      <section className="grid gap-4 lg:grid-cols-2">
        <article
          className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5"
        >
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-[8px] border-[#7d6cff]">
            <div className="text-center">
              <p className="text-2xl font-semibold">{auditRun ? auditRun.score : "--"}</p>
              <p className="site-muted text-xs uppercase tracking-[0.2em]">{ui.score}</p>
            </div>
          </div>
          <p className="site-muted mx-auto mt-4 max-w-sm text-center text-sm">
            {auditRun?.summary ?? ui.scoreEmpty}
          </p>
        </article>

        <article
          className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5"
        >
          <h2 className="text-lg font-semibold">{ui.breakdown}</h2>
          <div className="mt-5 space-y-3">
            {auditRun ? (
              auditRun.issues.map((item) => (
                <div key={item.title} className="rounded-lg border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="site-accent-text mt-1 text-xs uppercase tracking-[0.15em]">{item.severity}</p>
                  <p className="site-muted mt-2 text-sm">{item.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4">
                <p className="font-medium">{ui.noIssuesTitle}</p>
                <p className="site-muted mt-2 text-sm">{ui.noIssuesBody}</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">{ui.recommendations}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {auditRun ? (
            auditRun.recommendations.map((title) => (
              <article
                key={title}
                className="site-hover-lift rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5"
              >
                <h4 className="text-xl font-semibold">{title}</h4>
                <p className="site-muted mt-2 text-sm">{ui.recommendationBody}</p>
                <Link
                  href={`/ai-assistant?action=fix-plan&input=${encodeURIComponent(title)}&url=${encodeURIComponent(auditRun.url)}`}
                  className="site-link-accent mt-4 inline-flex text-sm font-semibold"
                >
                  {ui.launch} →
                </Link>
              </article>
            ))
          ) : (
            <article
              className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5 md:col-span-3"
            >
              <h4 className="text-xl font-semibold">{ui.noRecommendationsTitle}</h4>
              <p className="site-muted mt-2 text-sm">{ui.noRecommendationsBody}</p>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

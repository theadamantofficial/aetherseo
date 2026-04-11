"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";
import SiteLoader from "@/components/site-loader";
import { auth } from "@/lib/firebase";
import {
  getDashboardForUser,
  getPaidTierLabel,
  getUserProfile,
  type DashboardActivity,
  type DashboardCard,
  type DashboardData,
  type UserProfile,
} from "@/lib/firebase-data";
import { resolveAppUiLanguage, type AppUiLanguage } from "@/lib/app-ui-language";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

type DashboardViewState =
  | { loading: true; error: "" | "load_failed"; data: null; profile: null }
  | {
      loading: false;
      error: "" | "load_failed";
      data: DashboardData | null;
      profile: UserProfile | null;
    };

const initialState: DashboardViewState = {
  loading: true,
  error: "",
  data: null,
  profile: null,
};

const dashboardUiCopy: Record<
  AppUiLanguage,
  {
    loading: string;
    loadError: string;
    empty: string;
    currentTier: string;
    signedInAs: string;
    freeTier: string;
    generateTitle: string;
    generateBody: string;
    createStandardDraft: string;
    createPaidDraft: string;
    auditTitle: string;
    auditBody: string;
    runBasicAudit: string;
    runPaidAudit: string;
    assistantTitle: string;
    assistantBody: string;
    assistantLockedBody: string;
    openAssistant: string;
    upgradePlan: string;
    recentActivity: string;
    viewHistory: string;
    noActivity: string;
    domainHealth: string;
    noHealth: string;
    recommendedActions: string;
    noRecommendations: string;
    launchFixPlan: string;
    activityTypes: Record<DashboardActivity["type"], string>;
  }
> = {
  en: {
    loading: "Loading your workspace data...",
    loadError: "We could not load your workspace data.",
    empty: "No workspace data is available yet.",
    currentTier: "Current tier",
    signedInAs: "Signed in as",
    freeTier: "Free",
    generateTitle: "Generate AI Blog Content",
    generateBody: "Create SEO-optimized articles in seconds with your target keyword and tone.",
    createStandardDraft: "Create Standard Draft",
    createPaidDraft: "Create {tier} Draft",
    auditTitle: "Comprehensive Website Audit",
    auditBody: "Deep scan your domain for technical SEO issues and performance bottlenecks.",
    runBasicAudit: "Run Basic Audit",
    runPaidAudit: "Run {tier} Audit",
    assistantTitle: "SEO AI Assistant",
    assistantBody: "Build briefs, metadata, schema, keyword clusters, and fix plans from one workspace.",
    assistantLockedBody:
      "AI Assistant unlocks on paid plans. Upgrade to open briefs, metadata, schema, and fix plans.",
    openAssistant: "Open AI Assistant",
    upgradePlan: "Upgrade Plan",
    recentActivity: "Recent Activity",
    viewHistory: "View History",
    noActivity: "No workspace activity yet. Generate a blog draft or run an audit to start building history.",
    domainHealth: "Domain Health",
    noHealth: "No health metrics yet. Run an audit to populate technical health data.",
    recommendedActions: "Recommended Next Actions",
    noRecommendations: "Recommendations will appear here after you save an audit.",
    launchFixPlan: "Launch Fix Plan",
    activityTypes: { blog: "Blog", audit: "Audit", report: "Report", system: "System" },
  },
  hi: {
    loading: "Aapka workspace data load ho raha hai...",
    loadError: "Workspace data load nahi ho paya.",
    empty: "Abhi tak koi workspace data available nahi hai.",
    currentTier: "Current tier",
    signedInAs: "Signed in as",
    freeTier: "Free",
    generateTitle: "AI Blog Content Banao",
    generateBody: "Target keyword aur tone ke saath SEO-optimized articles seconds me banao.",
    createStandardDraft: "Standard Draft Banao",
    createPaidDraft: "{tier} Draft Banao",
    auditTitle: "Comprehensive Website Audit",
    auditBody: "Technical SEO issues aur performance bottlenecks ke liye domain ko deep scan karo.",
    runBasicAudit: "Basic Audit Chalao",
    runPaidAudit: "{tier} Audit Chalao",
    assistantTitle: "SEO AI Assistant",
    assistantBody: "Ek hi workspace se briefs, metadata, schema, keyword clusters aur fix plans banao.",
    assistantLockedBody:
      "AI Assistant paid plans par unlock hota hai. Briefs, metadata, schema aur fix plans ke liye upgrade karo.",
    openAssistant: "AI Assistant Khollo",
    upgradePlan: "Upgrade Karo",
    recentActivity: "Recent Activity",
    viewHistory: "History Dekho",
    noActivity: "Abhi koi workspace activity nahi hai. Blog draft ya audit chalao aur history banao.",
    domainHealth: "Domain Health",
    noHealth: "Abhi koi health metrics nahi hain. Audit chalao aur technical data populate karo.",
    recommendedActions: "Recommended Next Actions",
    noRecommendations: "Audit save karne ke baad recommendations yahan dikhengi.",
    launchFixPlan: "Fix Plan Shuru Karo",
    activityTypes: { blog: "Blog", audit: "Audit", report: "Report", system: "System" },
  },
  fr: {
    loading: "Chargement des donnees du workspace...",
    loadError: "Impossible de charger les donnees du workspace.",
    empty: "Aucune donnee de workspace n'est disponible pour le moment.",
    currentTier: "Niveau actuel",
    signedInAs: "Connecte en tant que",
    freeTier: "Free",
    generateTitle: "Generer du contenu blog IA",
    generateBody: "Creez des articles SEO en quelques secondes avec votre mot-cle cible et votre ton.",
    createStandardDraft: "Creer un brouillon standard",
    createPaidDraft: "Creer un brouillon {tier}",
    auditTitle: "Audit complet du site web",
    auditBody:
      "Analysez votre domaine pour detecter les problemes SEO techniques et les goulots de performance.",
    runBasicAudit: "Lancer un audit basique",
    runPaidAudit: "Lancer un audit {tier}",
    assistantTitle: "Assistant IA SEO",
    assistantBody:
      "Construisez briefs, metadata, schema, clusters de mots-cles et plans de correction depuis un seul workspace.",
    assistantLockedBody:
      "L'assistant IA est reserve aux offres payantes. Passez a une offre superieure pour les briefs et plans de correction.",
    openAssistant: "Ouvrir l'assistant IA",
    upgradePlan: "Mettre a niveau",
    recentActivity: "Activite recente",
    viewHistory: "Voir l'historique",
    noActivity: "Aucune activite pour le moment. Generez un blog ou lancez un audit pour commencer.",
    domainHealth: "Sante du domaine",
    noHealth: "Aucune metrique de sante pour le moment. Lancez un audit pour les remplir.",
    recommendedActions: "Actions recommandees",
    noRecommendations: "Les recommandations apparaitront apres un audit enregistre.",
    launchFixPlan: "Lancer le plan de correction",
    activityTypes: { blog: "Blog", audit: "Audit", report: "Rapport", system: "Systeme" },
  },
  de: {
    loading: "Workspace-Daten werden geladen...",
    loadError: "Die Workspace-Daten konnten nicht geladen werden.",
    empty: "Noch keine Workspace-Daten vorhanden.",
    currentTier: "Aktueller Tarif",
    signedInAs: "Angemeldet als",
    freeTier: "Free",
    generateTitle: "AI-Bloginhalt erstellen",
    generateBody: "Erstelle in Sekunden SEO-optimierte Artikel mit Keyword und Tonalitaet.",
    createStandardDraft: "Standard-Entwurf erstellen",
    createPaidDraft: "{tier} Entwurf erstellen",
    auditTitle: "Umfassendes Website-Audit",
    auditBody: "Pruefe deine Domain auf technische SEO-Probleme und Performance-Bremsen.",
    runBasicAudit: "Basis-Audit starten",
    runPaidAudit: "{tier} Audit starten",
    assistantTitle: "SEO AI Assistant",
    assistantBody: "Erstelle Briefings, Metadata, Schema, Keyword-Cluster und Fix-Plaene in einem Workspace.",
    assistantLockedBody:
      "Der AI Assistant ist nur in bezahlten Plaenen verfuegbar. Upgrade fuer Briefings und Fix-Plaene.",
    openAssistant: "AI Assistant oeffnen",
    upgradePlan: "Upgrade",
    recentActivity: "Letzte Aktivitaet",
    viewHistory: "Verlauf ansehen",
    noActivity: "Noch keine Aktivitaet. Erstelle einen Blog oder starte ein Audit, um Verlauf aufzubauen.",
    domainHealth: "Domain-Zustand",
    noHealth: "Noch keine Health-Metriken. Fuehre ein Audit aus, um Daten zu laden.",
    recommendedActions: "Empfohlene naechste Schritte",
    noRecommendations: "Empfehlungen erscheinen nach einem gespeicherten Audit.",
    launchFixPlan: "Fix-Plan starten",
    activityTypes: { blog: "Blog", audit: "Audit", report: "Bericht", system: "System" },
  },
  ja: {
    loading: "ワークスペースデータを読み込み中です...",
    loadError: "ワークスペースデータを読み込めませんでした。",
    empty: "まだワークスペースデータがありません。",
    currentTier: "現在のプラン",
    signedInAs: "サインイン中",
    freeTier: "Free",
    generateTitle: "AI ブログコンテンツを生成",
    generateBody: "ターゲットキーワードとトーンに合わせて SEO 記事を数秒で作成します。",
    createStandardDraft: "標準ドラフトを作成",
    createPaidDraft: "{tier} ドラフトを作成",
    auditTitle: "総合ウェブサイト監査",
    auditBody: "技術的 SEO の問題点と性能ボトルネックをドメイン全体で分析します。",
    runBasicAudit: "基本監査を実行",
    runPaidAudit: "{tier} 監査を実行",
    assistantTitle: "SEO AI アシスタント",
    assistantBody:
      "ブリーフ、メタデータ、スキーマ、キーワードクラスタ、修正計画を一つのワークスペースで作成します。",
    assistantLockedBody:
      "AI アシスタントは有料プランで利用できます。ブリーフや修正プランを使うにはアップグレードしてください。",
    openAssistant: "AI アシスタントを開く",
    upgradePlan: "アップグレード",
    recentActivity: "最近のアクティビティ",
    viewHistory: "履歴を見る",
    noActivity: "まだアクティビティがありません。ブログ生成か監査を実行してください。",
    domainHealth: "ドメイン健全性",
    noHealth: "健全性指標はまだありません。監査を実行してデータを追加してください。",
    recommendedActions: "推奨アクション",
    noRecommendations: "監査を保存すると推奨アクションがここに表示されます。",
    launchFixPlan: "修正プランを開始",
    activityTypes: { blog: "ブログ", audit: "監査", report: "レポート", system: "システム" },
  },
  ko: {
    loading: "워크스페이스 데이터를 불러오는 중...",
    loadError: "워크스페이스 데이터를 불러오지 못했습니다.",
    empty: "아직 워크스페이스 데이터가 없습니다.",
    currentTier: "현재 플랜",
    signedInAs: "로그인 계정",
    freeTier: "Free",
    generateTitle: "AI 블로그 콘텐츠 생성",
    generateBody: "타깃 키워드와 톤에 맞는 SEO 글을 몇 초 안에 만드세요.",
    createStandardDraft: "기본 초안 만들기",
    createPaidDraft: "{tier} 초안 만들기",
    auditTitle: "종합 웹사이트 감사",
    auditBody: "기술 SEO 문제와 성능 병목을 도메인 전체에서 분석합니다.",
    runBasicAudit: "기본 감사 실행",
    runPaidAudit: "{tier} 감사 실행",
    assistantTitle: "SEO AI Assistant",
    assistantBody:
      "브리프, 메타데이터, 스키마, 키워드 클러스터, 수정 계획을 한 워크스페이스에서 만드세요.",
    assistantLockedBody:
      "AI 도우미는 유료 플랜에서만 사용할 수 있습니다. 브리프와 수정 계획을 위해 업그레이드하세요.",
    openAssistant: "AI Assistant 열기",
    upgradePlan: "업그레이드",
    recentActivity: "최근 활동",
    viewHistory: "기록 보기",
    noActivity: "아직 활동이 없습니다. 블로그를 생성하거나 감사를 실행하세요.",
    domainHealth: "도메인 상태",
    noHealth: "아직 상태 지표가 없습니다. 감사를 실행해 데이터를 채우세요.",
    recommendedActions: "추천 다음 작업",
    noRecommendations: "감사를 저장하면 추천 작업이 여기에 표시됩니다.",
    launchFixPlan: "수정 계획 시작",
    activityTypes: { blog: "블로그", audit: "감사", report: "리포트", system: "시스템" },
  },
};

function SparkDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#83f6d7] shadow-[0_0_8px_rgba(131,246,215,0.7)]"
    />
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--site-muted)] opacity-70">
      {children}
    </p>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { language, uiLanguage } = useLanguage();
  const [state, setState] = useState<DashboardViewState>(initialState);
  const activeLanguage = resolveAppUiLanguage(language, uiLanguage);
  const ui = dashboardUiCopy[activeLanguage];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }
      try {
        const userProfile = await getUserProfile(currentUser.uid);
        if (!userProfile.plan) {
          router.replace("/auth");
          return;
        }
        const data = await getDashboardForUser(currentUser.uid);
        setState({ loading: false, error: "", profile: userProfile, data });
      } catch {
        setState({ loading: false, error: "load_failed", data: null, profile: null });
      }
    });
    return () => {
      unsubscribe();
    };
  }, [router]);

  const dashboard = state.data;
  const profile = state.profile;
  const isPaid = dashboard?.plan === "paid";
  const paidTierLabel = getPaidTierLabel(profile?.paidPlanTier);
  const latestAuditUrl = dashboard?.auditRuns?.[0]?.url ?? "";

  const translatedDashboard = useTranslatedCopy(
    dashboard
      ? {
          title: dashboard.title,
          body: dashboard.body,
          cards: dashboard.cards,
          activities: dashboard.activities,
          health: dashboard.health,
          recommendations: dashboard.recommendations,
        }
      : { title: "", body: "", cards: [], activities: [], health: [], recommendations: [] },
    activeLanguage,
    `dashboard-surface-${dashboard?.plan ?? "empty"}-${profile?.paidPlanTier ?? "free"}`,
  );

  const draftLabel = isPaid
    ? ui.createPaidDraft.replace("{tier}", paidTierLabel ?? "Paid")
    : ui.createStandardDraft;
  const auditLabel = isPaid
    ? ui.runPaidAudit.replace("{tier}", paidTierLabel ?? "Paid")
    : ui.runBasicAudit;

  if (state.loading) {
    return <SiteLoader size="lg" />;
  }

  if (state.error) {
    return (
      <div className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 text-[13px] text-[var(--site-muted)]">
        {ui.loadError}
      </div>
    );
  }

  if (!dashboard || !profile) {
    return <p className="text-[13px] text-[var(--site-muted)]">{ui.empty}</p>;
  }

  const isFreeBlogLimitReached = dashboard.plan === "free" && dashboard.generatedBlogs.length >= 3;
  const isFreeAuditLimitReached = dashboard.plan === "free" && dashboard.auditRuns.length >= 1;
  const blogHref = isFreeBlogLimitReached ? "/billing?upgrade=blog-limit" : "/generate-blog";
  const auditHref = isFreeAuditLimitReached ? "/billing?upgrade=audit-limit" : "/website-audit";
  const assistantHref = isPaid ? "/ai-assistant" : "/billing?upgrade=assistant-locked";
  const draftButtonLabel = isFreeBlogLimitReached ? ui.upgradePlan : draftLabel;
  const auditButtonLabel = isFreeAuditLimitReached ? ui.upgradePlan : auditLabel;
  const assistantButtonLabel = isPaid ? ui.openAssistant : ui.upgradePlan;

  return (
    <div className="space-y-4">
      <header className="animate-fade-up relative overflow-hidden flex items-center justify-between gap-4 rounded-[22px] border border-[var(--site-border)] bg-[var(--site-surface)] px-7 py-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#705dff]/10 blur-3xl"
        />

        <div className="relative">
          <h1 className="text-[1.2rem] font-semibold capitalize leading-tight tracking-[-0.01em]">
            {translatedDashboard.title}
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-[1.7] text-[var(--site-muted)]">
            {translatedDashboard.body}
          </p>
        </div>

        <span className="relative shrink-0 rounded-full border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--site-muted)]">
          {paidTierLabel ?? ui.freeTier}
        </span>
      </header>

      <section aria-label="Workspace statistics" className="grid gap-3 md:grid-cols-3">
        {translatedDashboard.cards.map((card: DashboardCard, index: number) => (
          <article
            key={card.label}
            style={{ animationDelay: `${index * 60}ms` }}
            className="animate-fade-up group rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#877cff]/30"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)] opacity-60">
              {card.label}
            </p>
            <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.02em]">{card.value}</p>
            <p className="mt-2 text-[12px] leading-[1.6] text-[var(--site-muted)]">{card.description}</p>
          </article>
        ))}
      </section>

      <section aria-label="Workspace actions" className="grid gap-3 md:grid-cols-3">
        <article className="flex h-full flex-col rounded-[18px] border border-[#877cff]/30 bg-[var(--site-surface)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#877cff]/50 hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
          <div className="flex-1">
            <SectionEyebrow>Content</SectionEyebrow>
            <h2 className="mt-2 text-[1.1rem] font-semibold leading-tight">{ui.generateTitle}</h2>
            <p className="mt-2 text-[13px] leading-[1.7] text-[var(--site-muted)]">{ui.generateBody}</p>
          </div>
          <Link
            href={blogHref}
            className="site-button-primary mt-6 inline-flex self-start rounded-[12px] px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(131,246,215,0.2)]"
          >
            {draftButtonLabel}
          </Link>
        </article>

        <article className="flex h-full flex-col rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#877cff]/30 hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
          <div className="flex-1">
            <SectionEyebrow>Audit</SectionEyebrow>
            <h2 className="mt-2 text-[1.1rem] font-semibold leading-tight">{ui.auditTitle}</h2>
            <p className="mt-2 text-[13px] leading-[1.7] text-[var(--site-muted)]">{ui.auditBody}</p>
          </div>
          <Link
            href={auditHref}
            className="site-button-primary mt-6 inline-flex self-start rounded-[12px] px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(131,246,215,0.2)]"
          >
            {auditButtonLabel}
          </Link>
        </article>

        <article
          className={`flex h-full flex-col rounded-[18px] border bg-[var(--site-surface)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] ${
            isPaid
              ? "border-[#83f6d7]/20 hover:border-[#83f6d7]/40"
              : "border-[var(--site-border)] opacity-75 hover:border-[#877cff]/25 hover:opacity-90"
          }`}
        >
          <div className="flex-1">
            <SectionEyebrow>Assistant</SectionEyebrow>
            <h2 className="mt-2 text-[1.1rem] font-semibold leading-tight">{ui.assistantTitle}</h2>
            <p className="mt-2 text-[13px] leading-[1.7] text-[var(--site-muted)]">
              {isPaid ? ui.assistantBody : ui.assistantLockedBody}
            </p>
          </div>
          <Link
            href={assistantHref}
            className="site-button-secondary mt-6 inline-flex self-start rounded-[12px] border px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
          >
            {assistantButtonLabel}
          </Link>
        </article>
      </section>

      <section aria-label="Activity and domain health" className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 lg:col-span-2">
          <header className="mb-5 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">{ui.recentActivity}</h2>
            <Link href="/history" className="site-link-accent text-[12px] font-semibold">
              {ui.viewHistory} {"->"}
            </Link>
          </header>

          {translatedDashboard.activities.length ? (
            <ul aria-label="Activity list" className="divide-y divide-[var(--site-border)]">
              {translatedDashboard.activities.map((activity: DashboardActivity, index: number) => (
                <li
                  key={`${index}-${activity.title}-${activity.date}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <p className="text-[13px]">
                    <span className="text-[var(--site-muted)]">
                      {ui.activityTypes[activity.type] ?? activity.type}:
                    </span>{" "}
                    {activity.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                    {activity.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[14px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4 text-[13px] text-[var(--site-muted)]">
              {ui.noActivity}
            </p>
          )}
        </article>

        <article className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
          <h2 className="mb-5 text-[15px] font-semibold">{ui.domainHealth}</h2>

          {translatedDashboard.health.length ? (
            <ul aria-label="Domain health metrics" className="divide-y divide-[var(--site-border)]">
              {translatedDashboard.health.map((metric: { label: string; value: string }) => (
                <li key={metric.label} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-[13px] text-[var(--site-muted)]">{metric.label}</span>
                  <span className="text-[13px] font-semibold">{metric.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[14px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4 text-[13px] text-[var(--site-muted)]">
              {ui.noHealth}
            </p>
          )}
        </article>
      </section>

      <section
        aria-labelledby="recommendations-heading"
        className="rounded-[18px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6"
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 id="recommendations-heading" className="text-[15px] font-semibold">
            {ui.recommendedActions}
          </h2>
          <Link href={assistantHref} className="site-link-accent text-[12px] font-semibold">
            {assistantButtonLabel} {"->"}
          </Link>
        </header>

        {translatedDashboard.recommendations.length ? (
          <ul aria-label="Recommended actions" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {translatedDashboard.recommendations.map((recommendation: string) => {
              const href = isPaid
                ? latestAuditUrl
                  ? `/ai-assistant?action=fix-plan&input=${encodeURIComponent(recommendation)}&url=${encodeURIComponent(latestAuditUrl)}`
                  : `/ai-assistant?action=fix-plan&input=${encodeURIComponent(recommendation)}`
                : "/billing?upgrade=assistant-locked";
              const actionLabel = isPaid ? ui.launchFixPlan : ui.upgradePlan;

              return (
                <li key={recommendation}>
                  <article className="flex h-full flex-col rounded-[14px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#877cff]/30">
                    <div className="flex items-start gap-2.5 flex-1">
                      <SparkDot />
                      <p className="text-[13px] font-medium leading-[1.55]">{recommendation}</p>
                    </div>
                    <Link href={href} className="site-link-accent mt-4 inline-flex text-[12px] font-semibold">
                      {actionLabel} {"->"}
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-[14px] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4 text-[13px] text-[var(--site-muted)]">
            {ui.noRecommendations}
          </p>
        )}
      </section>
    </div>
  );
}

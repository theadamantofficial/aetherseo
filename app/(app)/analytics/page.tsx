"use client";

import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { auth } from "@/lib/firebase";
import {
  getDashboardForUser,
  type DashboardData,
} from "@/lib/firebase-data";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

const analyticsUiCopy = {
  en: {
    badge: "Live workspace metrics",
    title: "Analytics",
    body: "Live workspace metrics pulled from your saved workspace data",
    export: "Export Data",
    overview: "Workspace Activity Overview",
    recentActions: "Recent actions",
    recentActionsBody: "Completed in the last 7 days from saved workspace activity.",
    latestBlog: "Latest blog",
    latestBlogEmpty: "No saved draft yet",
    latestBlogBody: "Generate a blog to populate content analytics.",
    latestAudit: "Latest audit",
    latestAuditEmpty: "No audit yet",
    latestAuditBody: "Run an audit to populate technical health analytics.",
    emptyOverview: "Generate blogs and audits to build live analytics history.",
    latestSignals: "Latest Audit Signals",
    latestSignalsEmpty: "No health metrics yet. Run an audit to populate analytics with real technical data.",
    actionVolume: "Action Volume",
    trackedActions: "Tracked actions",
    actionVolumeEmpty: "No workspace actions have been completed yet.",
    keywordLabel: "Keyword",
  },
  hi: {
    badge: "Live workspace metrics",
    title: "Analytics",
    body: "Saved workspace data se live workspace metrics yahan dikhte hain",
    export: "Data export karo",
    overview: "Workspace activity overview",
    recentActions: "Recent actions",
    recentActionsBody: "Pichhle 7 din me complete hui saved workspace activity.",
    latestBlog: "Latest blog",
    latestBlogEmpty: "Abhi koi saved draft nahi hai",
    latestBlogBody: "Content analytics populate karne ke liye blog generate karo.",
    latestAudit: "Latest audit",
    latestAuditEmpty: "Abhi koi audit nahi hai",
    latestAuditBody: "Technical health analytics ke liye audit run karo.",
    emptyOverview: "Live analytics history ke liye blogs aur audits generate karo.",
    latestSignals: "Latest audit signals",
    latestSignalsEmpty: "Abhi koi health metrics nahi hain. Real technical data ke liye audit run karo.",
    actionVolume: "Action volume",
    trackedActions: "Tracked actions",
    actionVolumeEmpty: "Abhi koi workspace action complete nahi hua hai.",
    keywordLabel: "Keyword",
  },
  fr: {
    badge: "Metriques live du workspace",
    title: "Analytique",
    body: "Metriques live du workspace issues de vos donnees enregistrees",
    export: "Exporter les donnees",
    overview: "Vue d'ensemble de l'activite",
    recentActions: "Actions recentes",
    recentActionsBody: "Terminees au cours des 7 derniers jours depuis l'activite enregistree.",
    latestBlog: "Dernier blog",
    latestBlogEmpty: "Aucun brouillon enregistre",
    latestBlogBody: "Generez un blog pour alimenter l'analytique de contenu.",
    latestAudit: "Dernier audit",
    latestAuditEmpty: "Aucun audit",
    latestAuditBody: "Lancez un audit pour remplir les donnees de sante technique.",
    emptyOverview: "Generez des blogs et des audits pour construire l'historique analytique.",
    latestSignals: "Derniers signaux d'audit",
    latestSignalsEmpty: "Aucune metrique de sante. Lancez un audit pour remplir l'analytique.",
    actionVolume: "Volume d'actions",
    trackedActions: "Actions suivies",
    actionVolumeEmpty: "Aucune action workspace n'a encore ete terminee.",
    keywordLabel: "Mot-cle",
  },
  de: {
    badge: "Live-Workspace-Metriken",
    title: "Analysen",
    body: "Live-Workspace-Metriken aus deinen gespeicherten Workspace-Daten",
    export: "Daten exportieren",
    overview: "Ubersicht der Workspace-Aktivitat",
    recentActions: "Letzte Aktionen",
    recentActionsBody: "In den letzten 7 Tagen aus gespeicherter Workspace-Aktivitat abgeschlossen.",
    latestBlog: "Letzter Blog",
    latestBlogEmpty: "Noch kein gespeicherter Entwurf",
    latestBlogBody: "Erstelle einen Blog, um Content-Analysen zu füllen.",
    latestAudit: "Letztes Audit",
    latestAuditEmpty: "Noch kein Audit",
    latestAuditBody: "Fuehre ein Audit aus, um technische SEO-Daten zu laden.",
    emptyOverview: "Erstelle Blogs und Audits, um die Live-Analysehistorie aufzubauen.",
    latestSignals: "Neueste Audit-Signale",
    latestSignalsEmpty: "Noch keine Health-Metriken. Fuehre ein Audit fuer echte technische Daten aus.",
    actionVolume: "Aktionsvolumen",
    trackedActions: "Erfasste Aktionen",
    actionVolumeEmpty: "Noch keine Workspace-Aktionen abgeschlossen.",
    keywordLabel: "Keyword",
  },
  ja: {
    badge: "ライブワークスペース指標",
    title: "分析",
    body: "保存されたワークスペースデータから取得したライブワークスペース指標",
    export: "データを書き出す",
    overview: "ワークスペース活動の概要",
    recentActions: "最近の操作",
    recentActionsBody: "保存されたワークスペース履歴から直近7日で完了した操作です。",
    latestBlog: "最新のブログ",
    latestBlogEmpty: "保存済みの下書きはありません",
    latestBlogBody: "コンテンツ分析を表示するにはブログを生成してください。",
    latestAudit: "最新の監査",
    latestAuditEmpty: "監査はまだありません",
    latestAuditBody: "技術的な健全性分析を表示するには監査を実行してください。",
    emptyOverview: "分析履歴を作るにはブログ生成と監査を実行してください。",
    latestSignals: "最新の監査シグナル",
    latestSignalsEmpty: "健全性指標はまだありません。監査を実行してください。",
    actionVolume: "操作量",
    trackedActions: "記録済み操作",
    actionVolumeEmpty: "まだ完了したワークスペース操作はありません。",
    keywordLabel: "キーワード",
  },
  ko: {
    badge: "실시간 워크스페이스 지표",
    title: "분석",
    body: "저장된 워크스페이스 데이터에서 가져온 실시간 워크스페이스 지표",
    export: "데이터 내보내기",
    overview: "워크스페이스 활동 개요",
    recentActions: "최근 작업",
    recentActionsBody: "저장된 워크스페이스 활동 기준 최근 7일 내 완료된 작업입니다.",
    latestBlog: "최신 블로그",
    latestBlogEmpty: "저장된 초안이 없습니다",
    latestBlogBody: "콘텐츠 분석을 보려면 블로그를 생성하세요.",
    latestAudit: "최신 감사",
    latestAuditEmpty: "감사가 없습니다",
    latestAuditBody: "기술 SEO 분석을 보려면 감사를 실행하세요.",
    emptyOverview: "실시간 분석 이력을 만들려면 블로그와 감사를 실행하세요.",
    latestSignals: "최신 감사 신호",
    latestSignalsEmpty: "건강 지표가 없습니다. 감사를 실행해 실제 데이터를 채우세요.",
    actionVolume: "작업량",
    trackedActions: "추적된 작업",
    actionVolumeEmpty: "아직 완료된 워크스페이스 작업이 없습니다.",
    keywordLabel: "키워드",
  },
} as const;

export default function AnalyticsPage() {
  const router = useRouter();
  const { language, uiLanguage } = useLanguage();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      const nextDashboard = await getDashboardForUser(currentUser.uid).catch(() => null);
      setDashboard(nextDashboard);
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const exportHref = useMemo(() => {
    if (!dashboard) {
      return "#";
    }

    return `data:application/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dashboard, null, 2),
    )}`;
  }, [dashboard]);

  const latestBlog = dashboard?.generatedBlogs[0] ?? null;
  const latestAudit = dashboard?.auditRuns[0] ?? null;
  const translatedDashboard = useTranslatedCopy(
    dashboard
      ? {
          cards: dashboard.cards,
          health: dashboard.health,
          usage: dashboard.usage,
          latestBlogTitle: latestBlog?.title ?? "",
          latestAuditSummary: latestAudit?.summary ?? "",
        }
      : {
          cards: [],
          health: [],
          usage: null,
          latestBlogTitle: "",
          latestAuditSummary: "",
        },
    language,
    `analytics-dashboard-${dashboard?.plan ?? "empty"}`,
  );
  const ui = analyticsUiCopy[(language === "de" || language === "ja" || language === "ko" ? language : uiLanguage) as keyof typeof analyticsUiCopy];
  const recentActionCount =
    dashboard?.activities.filter((item) => {
      const timestamp = Date.parse(item.date);
      if (Number.isNaN(timestamp)) {
        return false;
      }

      return Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1000;
    }).length ?? 0;

  return (
    <div className="space-y-6">
      <section className="site-panel site-animate-rise flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-6">
        <div>
          <p className="site-chip inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]">
            {ui.badge}
          </p>
          <h1 className="text-3xl font-semibold">{ui.title}</h1>
          <p className="site-muted text-sm">{ui.body}</p>
        </div>
        <a
          href={exportHref}
          download="aether-analytics.json"
          className="site-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
        >
          {ui.export}
        </a>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {translatedDashboard.cards.map((card) => (
          <article key={card.label} className="site-panel site-animate-rise rounded-2xl border p-5" style={{ ["--site-delay" as string]: "80ms" }}>
            <p className="site-muted text-xs uppercase tracking-[0.18em]">{card.label}</p>
            <p className="mt-2 text-4xl font-semibold">{card.value}</p>
            <p className="site-muted mt-2 text-sm">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="site-panel site-animate-rise rounded-2xl border p-6" style={{ ["--site-delay" as string]: "120ms" }}>
        <h2 className="text-2xl font-semibold">{ui.overview}</h2>
        <div className="site-panel-soft mt-5 h-64 rounded-xl border p-5">
          {dashboard ? (
            <div className="grid h-full gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[var(--site-border)] p-4">
                <p className="site-muted text-xs uppercase tracking-[0.18em]">{ui.recentActions}</p>
                <p className="mt-3 text-4xl font-semibold">{recentActionCount}</p>
                <p className="site-muted mt-2 text-sm">{ui.recentActionsBody}</p>
              </div>
              <div className="rounded-xl border border-[var(--site-border)] p-4">
                <p className="site-muted text-xs uppercase tracking-[0.18em]">{ui.latestBlog}</p>
                <p className="mt-3 text-lg font-semibold">{translatedDashboard.latestBlogTitle || ui.latestBlogEmpty}</p>
                <p className="site-muted mt-2 text-sm">
                  {latestBlog ? `${ui.keywordLabel}: ${latestBlog.keyword}` : ui.latestBlogBody}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--site-border)] p-4">
                <p className="site-muted text-xs uppercase tracking-[0.18em]">{ui.latestAudit}</p>
                <p className="mt-3 text-lg font-semibold">{latestAudit ? `${latestAudit.score}/100` : ui.latestAuditEmpty}</p>
                <p className="site-muted mt-2 text-sm">
                  {latestAudit ? translatedDashboard.latestAuditSummary : ui.latestAuditBody}
                </p>
              </div>
            </div>
          ) : (
            <p className="site-muted text-sm">{ui.emptyOverview}</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="site-panel site-animate-rise rounded-2xl border p-6 lg:col-span-2" style={{ ["--site-delay" as string]: "160ms" }}>
          <h3 className="text-2xl font-semibold">{ui.latestSignals}</h3>
          <div className="mt-5 space-y-3 text-sm">
            {translatedDashboard.health.length ? (
              translatedDashboard.health.map((row) => (
                <div key={row.label} className="site-panel-soft grid grid-cols-3 rounded-xl p-3">
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                  <span className="site-muted text-right">{row.description}</span>
                </div>
              ))
            ) : (
              <div className="site-panel-soft rounded-xl p-4">
                {ui.latestSignalsEmpty}
              </div>
            )}
          </div>
        </article>
        <article className="site-panel site-animate-rise rounded-2xl border p-6" style={{ ["--site-delay" as string]: "200ms" }}>
          <h3 className="text-2xl font-semibold">{ui.actionVolume}</h3>
          <div className="mx-auto mt-6 flex h-44 w-44 items-center justify-center rounded-full border-[14px] border-[#634fff]">
            <div className="text-center">
              <p className="text-4xl font-semibold">{translatedDashboard.usage?.current ?? 0}</p>
              <p className="site-muted text-xs uppercase tracking-[0.2em]">{translatedDashboard.usage?.label ?? ui.trackedActions}</p>
            </div>
          </div>
          <p className="site-muted mt-4 text-center text-sm">
            {translatedDashboard.usage?.text ?? ui.actionVolumeEmpty}
          </p>
        </article>
      </section>
    </div>
  );
}

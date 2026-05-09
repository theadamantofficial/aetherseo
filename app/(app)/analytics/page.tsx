"use client";

import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import SiteLoader from "@/components/site-loader";
import { useLanguage } from "@/components/language-provider";
import { resolveAppUiLanguage, type AppUiLanguage } from "@/lib/app-ui-language";
import { auth } from "@/lib/firebase";
import { getDashboardForUser, type DashboardActivity, type DashboardData } from "@/lib/firebase-data";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

type AnalyticsUiCopy = {
  badge: string;
  title: string;
  body: string;
  export: string;
  synced: string;
  neverSynced: string;
  planLabel: string;
  actionCapacity: string;
  cadence: string;
  cadenceBody: string;
  cadenceEmpty: string;
  signalMap: string;
  signalMapBody: string;
  signalMapEmpty: string;
  activityMix: string;
  activityMixBody: string;
  healthBoard: string;
  healthBoardBody: string;
  healthBoardEmpty: string;
  recentActions: string;
  recentActionsBody: string;
  latestBlog: string;
  latestBlogEmpty: string;
  latestBlogBody: string;
  latestAudit: string;
  latestAuditEmpty: string;
  latestAuditBody: string;
  latestSignals: string;
  latestSignalsEmpty: string;
  recentTimeline: string;
  recentTimelineEmpty: string;
  keywordLabel: string;
  healthScore: string;
  criticalIssues: string;
  warningIssues: string;
  goodChecks: string;
  trackedActions: string;
  loadFailed: string;
  activityTypes: Record<string, string>;
};

const analyticsUiCopyEn = {
  badge: "Live workspace metrics",
  title: "Analytics",
  body: "A responsive analytics workspace built from your saved blogs, audits, and AI assistant runs.",
  export: "Export data",
  synced: "Synced",
  neverSynced: "Waiting for first sync",
  planLabel: "Plan",
  actionCapacity: "Action capacity",
  cadence: "Workspace output cadence",
  cadenceBody: "Saved activity from the last 7 days, grouped by workflow type.",
  cadenceEmpty: "Generate a blog, run an audit, or save an AI task to chart daily workspace activity.",
  signalMap: "Audit signal map",
  signalMapBody: "A chart-first view of the latest audit score and issue distribution.",
  signalMapEmpty: "Run an audit to unlock the technical signal map.",
  activityMix: "Action mix",
  activityMixBody: "How saved workspace activity is distributed across blogs, audits, and AI tasks.",
  healthBoard: "Technical health board",
  healthBoardBody: "Latest audit quality signals, styled to match the current Aether theme.",
  healthBoardEmpty: "No health metrics yet. Run an audit to populate technical health analytics.",
  recentActions: "Recent actions",
  recentActionsBody: "Completed in the last 7 days from saved workspace activity.",
  latestBlog: "Latest blog",
  latestBlogEmpty: "No saved draft yet",
  latestBlogBody: "Generate a blog to populate content analytics.",
  latestAudit: "Latest audit",
  latestAuditEmpty: "No audit yet",
  latestAuditBody: "Run an audit to populate technical health analytics.",
  latestSignals: "Latest audit signals",
  latestSignalsEmpty: "No health metrics yet. Run an audit to populate analytics with real technical data.",
  recentTimeline: "Recent timeline",
  recentTimelineEmpty: "No workspace actions have been completed yet.",
  keywordLabel: "Keyword",
  healthScore: "SEO score",
  criticalIssues: "Critical issues",
  warningIssues: "Warnings",
  goodChecks: "Good checks",
  trackedActions: "Tracked actions",
  loadFailed: "We could not load your analytics right now.",
  activityTypes: {
    audit: "Audit",
    blog: "Blog",
    report: "Report",
    system: "System",
  },
} satisfies AnalyticsUiCopy;

const analyticsUiCopy: Record<AppUiLanguage, AnalyticsUiCopy> = {
  en: analyticsUiCopyEn,
  hi: {
    ...analyticsUiCopyEn,
    body: "Saved blogs, audits, aur AI assistant runs se bana responsive analytics workspace.",
    export: "Data export karo",
    recentActionsBody: "Pichhle 7 din me complete hui saved workspace activity.",
    latestBlogEmpty: "Abhi koi saved draft nahi hai",
    latestBlogBody: "Content analytics populate karne ke liye blog generate karo.",
    latestAuditEmpty: "Abhi koi audit nahi hai",
    latestAuditBody: "Technical health analytics ke liye audit run karo.",
    latestSignalsEmpty: "Abhi koi health metrics nahi hain. Real technical data ke liye audit run karo.",
    recentTimelineEmpty: "Abhi koi workspace action complete nahi hua hai.",
  },
  fr: {
    ...analyticsUiCopyEn,
    badge: "Metriques live du workspace",
    body: "Workspace analytique responsive base sur vos blogs, audits et executions IA enregistres.",
    export: "Exporter les donnees",
    recentActionsBody: "Terminees au cours des 7 derniers jours depuis l'activite enregistree.",
    latestBlogEmpty: "Aucun brouillon enregistre",
    latestBlogBody: "Generez un blog pour alimenter l'analytique de contenu.",
    latestAuditEmpty: "Aucun audit",
    latestAuditBody: "Lancez un audit pour remplir les donnees de sante technique.",
    latestSignalsEmpty: "Aucune metrique de sante. Lancez un audit pour remplir l'analytique.",
    recentTimelineEmpty: "Aucune action workspace n'a encore ete terminee.",
  },
  de: {
    ...analyticsUiCopyEn,
    badge: "Live-Workspace-Metriken",
    title: "Analysen",
    body: "Responsiver Analyse-Workspace auf Basis deiner gespeicherten Blogs, Audits und KI-Laufe.",
    export: "Daten exportieren",
    recentActionsBody: "In den letzten 7 Tagen aus gespeicherter Workspace-Aktivitat abgeschlossen.",
    latestBlogEmpty: "Noch kein gespeicherter Entwurf",
    latestBlogBody: "Erstelle einen Blog, um Content-Analysen zu fuellen.",
    latestAuditEmpty: "Noch kein Audit",
    latestAuditBody: "Fuehre ein Audit aus, um technische SEO-Daten zu laden.",
    latestSignalsEmpty: "Noch keine Health-Metriken. Fuehre ein Audit fuer echte technische Daten aus.",
    recentTimelineEmpty: "Noch keine Workspace-Aktionen abgeschlossen.",
  },
  ja: {
    ...analyticsUiCopyEn,
    badge: "ライブワークスペース指標",
    title: "分析",
    body: "保存されたブログ、監査、AI 実行から構成したレスポンシブ分析ワークスペースです。",
    export: "データを書き出す",
    recentActionsBody: "保存されたワークスペース履歴から直近7日で完了した操作です。",
    latestBlogEmpty: "保存済みの下書きはありません",
    latestBlogBody: "コンテンツ分析を表示するにはブログを生成してください。",
    latestAuditEmpty: "監査はまだありません",
    latestAuditBody: "技術的な健全性分析を表示するには監査を実行してください。",
    latestSignalsEmpty: "健全性指標はまだありません。監査を実行してください。",
    recentTimelineEmpty: "まだ完了したワークスペース操作はありません。",
  },
  ko: {
    ...analyticsUiCopyEn,
    badge: "실시간 워크스페이스 지표",
    title: "분석",
    body: "저장된 블로그, 감사, AI 실행으로 구성한 반응형 분석 워크스페이스입니다.",
    export: "데이터 내보내기",
    recentActionsBody: "저장된 워크스페이스 활동 기준 최근 7일 내 완료된 작업입니다.",
    latestBlogEmpty: "저장된 초안이 없습니다",
    latestBlogBody: "콘텐츠 분석을 보려면 블로그를 생성하세요.",
    latestAuditEmpty: "감사가 없습니다",
    latestAuditBody: "기술 SEO 분석을 보려면 감사를 실행하세요.",
    latestSignalsEmpty: "건강 지표가 없습니다. 감사를 실행해 실제 데이터를 채우세요.",
    recentTimelineEmpty: "아직 완료된 워크스페이스 작업이 없습니다.",
  },
};

const ACTIVITY_STYLES = {
  blog: { solid: "#6366f1", soft: "rgba(99, 102, 241, 0.16)" },
  audit: { solid: "#818cf8", soft: "rgba(129, 140, 248, 0.16)" },
  assistant: { solid: "#14b8a6", soft: "rgba(20, 184, 166, 0.16)" },
} as const;

const SIGNAL_STYLES = {
  score: { solid: "#6366f1", soft: "rgba(99, 102, 241, 0.18)" },
  critical: { solid: "#f97316", soft: "rgba(249, 115, 22, 0.18)" },
  warning: { solid: "#f59e0b", soft: "rgba(245, 158, 11, 0.18)" },
  good: { solid: "#22c55e", soft: "rgba(34, 197, 94, 0.18)" },
} as const;

const SIGNAL_LAYOUTS: Record<string, { left: string; top: string }> = {
  score: { left: "48%", top: "46%" },
  critical: { left: "78%", top: "31%" },
  warning: { left: "24%", top: "74%" },
  good: { left: "65%", top: "68%" },
} as const;

type ActivityKey = "blog" | "audit" | "assistant";

type ActivityBucket = {
  label: string;
  total: number;
  values: Record<ActivityKey, number>;
};

type MetricCard = {
  label: string;
  value: string;
  description: string;
  tone?: string;
  progress?: number;
};

type MixItem = {
  key: string;
  label: string;
  value: number;
  displayValue: string;
  percent: number;
  solid: string;
  soft: string;
};

type SignalBubble = {
  key: string;
  label: string;
  displayValue: string;
  value: number;
  bubbleValue: number;
  size: string;
  solid: string;
  soft: string;
};

type HealthBar = {
  key: string;
  label: string;
  value: string;
  description: string;
  percent: number;
  solid: string;
  soft: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function startOfDay(timestamp: number) {
  const value = new Date(timestamp);
  value.setHours(0, 0, 0, 0);
  return value.getTime();
}

function parseDateValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatCompactNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function summarizeAuditUrl(value: string) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).host.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function getUpdatedAtLabel(updatedAt: DashboardData["updatedAt"], locale: string) {
  if (!updatedAt) {
    return null;
  }

  const candidate = updatedAt as {
    seconds?: number;
    toDate?: () => Date;
  };
  const resolvedDate =
    typeof candidate.toDate === "function"
      ? candidate.toDate()
      : typeof candidate.seconds === "number"
        ? new Date(candidate.seconds * 1000)
        : null;

  if (!resolvedDate) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(resolvedDate);
}

function getTonePalette(tone?: string) {
  if (tone === "good") {
    return SIGNAL_STYLES.good;
  }

  if (tone === "warning") {
    return SIGNAL_STYLES.warning;
  }

  return SIGNAL_STYLES.score;
}

function getStatusPalette(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("active") || normalized.includes("running")) {
    return {
      solid: "#f59e0b",
      soft: "rgba(245, 158, 11, 0.16)",
    };
  }

  return {
    solid: "#22c55e",
    soft: "rgba(34, 197, 94, 0.16)",
  };
}

function getActivityPalette(type: DashboardActivity["type"]) {
  if (type === "audit") {
    return ACTIVITY_STYLES.audit;
  }

  if (type === "system") {
    return ACTIVITY_STYLES.assistant;
  }

  return ACTIVITY_STYLES.blog;
}

function getCapacityPercent(current: number, max: number) {
  if (!max) {
    return 0;
  }

  return clamp((current / max) * 100);
}

function getHealthPercent(kind: "score" | "critical" | "warning" | "good", value: number) {
  if (kind === "score") {
    return clamp(value);
  }

  if (kind === "critical") {
    return value === 0 ? 100 : clamp(100 - value * 24, 12, 100);
  }

  if (kind === "warning") {
    return value === 0 ? 100 : clamp(100 - value * 12, 18, 100);
  }

  return clamp(value * 12, 20, 100);
}

function getSignalBubbleTextConfig(key: string) {
  if (key === "score") {
    return {
      containerClassName: "px-4",
      valueClassName: "text-[2rem] leading-none font-semibold sm:text-[2.35rem]",
    };
  }

  return {
    containerClassName: "px-3",
    valueClassName: "text-3xl leading-none font-semibold sm:text-[2.4rem]",
  };
}

function createRecentBuckets(dashboard: DashboardData, locale: string): ActivityBucket[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));

    return {
      key: startOfDay(date.getTime()),
      label: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
      values: {
        blog: 0,
        audit: 0,
        assistant: 0,
      },
    };
  });
  const bucketIndex = new Map<number, number>(
    buckets.map((bucket, index) => [bucket.key, index]),
  );

  for (const blog of dashboard.generatedBlogs) {
    const parsed = parseDateValue(blog.createdAt);
    if (parsed === null) {
      continue;
    }

    const targetIndex = bucketIndex.get(startOfDay(parsed));
    if (targetIndex !== undefined) {
      buckets[targetIndex].values.blog += 1;
    }
  }

  for (const audit of dashboard.auditRuns) {
    const parsed = parseDateValue(audit.createdAt);
    if (parsed === null) {
      continue;
    }

    const targetIndex = bucketIndex.get(startOfDay(parsed));
    if (targetIndex !== undefined) {
      buckets[targetIndex].values.audit += 1;
    }
  }

  for (const assistant of dashboard.assistantRuns) {
    const parsed = parseDateValue(assistant.createdAt);
    if (parsed === null) {
      continue;
    }

    const targetIndex = bucketIndex.get(startOfDay(parsed));
    if (targetIndex !== undefined) {
      buckets[targetIndex].values.assistant += 1;
    }
  }

  for (const scan of dashboard.plagiarismRuns) {
    const parsed = parseDateValue(scan.createdAt);
    if (parsed === null) {
      continue;
    }

    const targetIndex = bucketIndex.get(startOfDay(parsed));
    if (targetIndex !== undefined) {
      buckets[targetIndex].values.assistant += 1;
    }
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    total: bucket.values.blog + bucket.values.audit + bucket.values.assistant,
    values: bucket.values,
  }));
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { language, uiLanguage } = useLanguage();
  const appUiLanguage = resolveAppUiLanguage(language, uiLanguage);
  const ui = analyticsUiCopy[appUiLanguage];
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      try {
        const nextDashboard = await getDashboardForUser(currentUser.uid);
        setDashboard(nextDashboard);
        setLoadFailed(false);
      } catch {
        setDashboard(null);
        setLoadFailed(true);
      } finally {
        setIsReady(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const latestBlog = dashboard?.generatedBlogs[0] ?? null;
  const latestAudit = dashboard?.auditRuns[0] ?? null;
  const latestAssistant = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    return [...dashboard.assistantRuns, ...dashboard.plagiarismRuns].sort((left, right) => {
      const leftDate = parseDateValue(left.createdAt) ?? 0;
      const rightDate = parseDateValue(right.createdAt) ?? 0;
      return rightDate - leftDate;
    })[0] ?? null;
  }, [dashboard]);
  const translatedDashboard = useTranslatedCopy(
    dashboard
      ? {
          cards: dashboard.cards,
          health: dashboard.health,
          usage: dashboard.usage,
          latestBlogTitle: latestBlog?.title ?? "",
          latestAuditSummary: latestAudit?.summary ?? "",
          latestAssistantTitle: latestAssistant?.title ?? "",
        }
      : {
          cards: [],
          health: [],
          usage: {
            label: "",
            current: 0,
            max: 0,
            text: "",
          },
          latestBlogTitle: "",
          latestAuditSummary: "",
          latestAssistantTitle: "",
        },
    language,
    `analytics-dashboard-${dashboard?.uid ?? "empty"}-${dashboard?.plan ?? "empty"}`,
  );
  const usage = translatedDashboard.usage;

  const exportHref = useMemo(() => {
    if (!dashboard) {
      return "#";
    }

    return `data:application/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dashboard, null, 2),
    )}`;
  }, [dashboard]);

  const recentActionCount = useMemo(
    () =>
      dashboard?.activities.filter((item) => {
        const timestamp = parseDateValue(item.date);
        if (timestamp === null) {
          return false;
        }

        return Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1000;
      }).length ?? 0,
    [dashboard],
  );

  const recentBuckets = useMemo(
    () => (dashboard ? createRecentBuckets(dashboard, appUiLanguage) : []),
    [appUiLanguage, dashboard],
  );

  const usageLimitLabel = useMemo(() => {
    if (!dashboard) {
      return "0";
    }

    return usage.max >= 999 ? "999+" : String(usage.max);
  }, [dashboard, usage]);

  const capacityPercent = useMemo(
    () => getCapacityPercent(usage.current, usage.max),
    [usage],
  );

  const metricCards = useMemo<MetricCard[]>(
    () =>
      dashboard
        ? [
            ...translatedDashboard.cards.map((card) => ({
              label: card.label,
              value: card.value,
              description: card.description,
              tone: card.tone,
            })),
            {
              label: ui.actionCapacity,
              value: `${usage.current} / ${usageLimitLabel}`,
              description: usage.text,
              tone: capacityPercent >= 85 ? "warning" : "good",
              progress: capacityPercent,
            },
          ]
        : [],
    [capacityPercent, dashboard, translatedDashboard.cards, ui.actionCapacity, usage, usageLimitLabel],
  );

  const mixItems = useMemo<MixItem[]>(() => {
    if (!dashboard) {
      return [];
    }

    const items = [
      {
        key: "blog",
        label: translatedDashboard.cards[0]?.label ?? ui.activityTypes.blog,
        value: dashboard.generatedBlogs.length,
        solid: ACTIVITY_STYLES.blog.solid,
        soft: ACTIVITY_STYLES.blog.soft,
      },
      {
        key: "audit",
        label: translatedDashboard.cards[1]?.label ?? ui.activityTypes.audit,
        value: dashboard.auditRuns.length,
        solid: ACTIVITY_STYLES.audit.solid,
        soft: ACTIVITY_STYLES.audit.soft,
      },
      {
        key: "assistant",
        label: translatedDashboard.cards[2]?.label ?? "AI tasks",
        value: dashboard.assistantRuns.length + dashboard.plagiarismRuns.length,
        solid: ACTIVITY_STYLES.assistant.solid,
        soft: ACTIVITY_STYLES.assistant.soft,
      },
    ];
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return items.map((item) => ({
      ...item,
      displayValue: formatCompactNumber(item.value, appUiLanguage),
      percent: total ? (item.value / total) * 100 : 0,
    }));
  }, [appUiLanguage, dashboard, translatedDashboard.cards, ui.activityTypes.audit, ui.activityTypes.blog]);

  const mixTotal = useMemo(
    () => mixItems.reduce((sum, item) => sum + item.value, 0),
    [mixItems],
  );
  const featuredMixItem = mixItems[0] ?? null;
  const secondaryMixItems = mixItems.slice(1);

  const donutBackground = useMemo(() => {
    if (!mixTotal) {
      return `conic-gradient(${ACTIVITY_STYLES.blog.soft} 0deg 360deg)`;
    }

    let rotation = -90;
    const segments = mixItems.map((item) => {
      const nextRotation = rotation + (item.percent / 100) * 360;
      const segment = `${item.solid} ${rotation}deg ${nextRotation}deg`;
      rotation = nextRotation;
      return segment;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, [mixItems, mixTotal]);

  const auditIssues = latestAudit?.issues ?? [];
  const criticalIssues = auditIssues.filter((issue) => issue.severity === "Critical").length;
  const warningIssues = auditIssues.filter((issue) => issue.severity === "Warning").length;
  const goodChecks = auditIssues.filter((issue) => issue.severity === "Good").length;

  const signalMap = useMemo<SignalBubble[]>(() => {
    if (!latestAudit) {
      return [];
    }

    const items = [
      {
        key: "score",
        label: ui.healthScore,
        displayValue: `${latestAudit.score}/100`,
        value: latestAudit.score,
        bubbleValue: Math.max(latestAudit.score, 22),
        solid: SIGNAL_STYLES.score.solid,
        soft: SIGNAL_STYLES.score.soft,
      },
      {
        key: "critical",
        label: ui.criticalIssues,
        displayValue: String(criticalIssues),
        value: criticalIssues,
        bubbleValue: criticalIssues > 0 ? criticalIssues * 18 : 8,
        solid: SIGNAL_STYLES.critical.solid,
        soft: SIGNAL_STYLES.critical.soft,
      },
      {
        key: "warning",
        label: ui.warningIssues,
        displayValue: String(warningIssues),
        value: warningIssues,
        bubbleValue: warningIssues > 0 ? warningIssues * 12 : 8,
        solid: SIGNAL_STYLES.warning.solid,
        soft: SIGNAL_STYLES.warning.soft,
      },
      {
        key: "good",
        label: ui.goodChecks,
        displayValue: String(goodChecks),
        value: goodChecks,
        bubbleValue: goodChecks > 0 ? goodChecks * 10 : 10,
        solid: SIGNAL_STYLES.good.solid,
        soft: SIGNAL_STYLES.good.soft,
      },
    ].filter((item) => item.key === "score" || item.value > 0);
    const maxBubble = Math.max(...items.map((item) => item.bubbleValue), 1);

    return items.map((item) => ({
      ...item,
      size:
        item.key === "score"
          ? `${40 + (item.bubbleValue / maxBubble) * 12}%`
          : `${28 + (item.bubbleValue / maxBubble) * 10}%`,
    }));
  }, [criticalIssues, goodChecks, latestAudit, ui.criticalIssues, ui.goodChecks, ui.healthScore, ui.warningIssues, warningIssues]);

  const healthBars = useMemo<HealthBar[]>(() => {
    if (!latestAudit) {
      return [];
    }

    return [
      {
        key: "score",
        label: ui.healthScore,
        value: `${latestAudit.score}/100`,
        description: translatedDashboard.latestAuditSummary || latestAudit.summary,
        percent: getHealthPercent("score", latestAudit.score),
        solid: SIGNAL_STYLES.score.solid,
        soft: SIGNAL_STYLES.score.soft,
      },
      {
        key: "critical",
        label: ui.criticalIssues,
        value: String(criticalIssues),
        description:
          criticalIssues > 0
            ? "Resolve the latest critical blockers first."
            : "No critical blockers found in the latest audit.",
        percent: getHealthPercent("critical", criticalIssues),
        solid: SIGNAL_STYLES.critical.solid,
        soft: SIGNAL_STYLES.critical.soft,
      },
      {
        key: "warning",
        label: ui.warningIssues,
        value: String(warningIssues),
        description:
          warningIssues > 0
            ? "Warning-level issues still need review."
            : `${goodChecks} good checks passed in the latest audit.`,
        percent: getHealthPercent("warning", warningIssues),
        solid: SIGNAL_STYLES.warning.solid,
        soft: SIGNAL_STYLES.warning.soft,
      },
      {
        key: "good",
        label: ui.goodChecks,
        value: String(goodChecks),
        description:
          goodChecks > 0
            ? "Healthy checks are landing consistently."
            : "Good checks will appear after the next saved audit.",
        percent: getHealthPercent("good", goodChecks),
        solid: SIGNAL_STYLES.good.solid,
        soft: SIGNAL_STYLES.good.soft,
      },
    ];
  }, [
    criticalIssues,
    goodChecks,
    latestAudit,
    translatedDashboard.latestAuditSummary,
    ui.criticalIssues,
    ui.goodChecks,
    ui.healthScore,
    ui.warningIssues,
    warningIssues,
  ]);

  const timelineItems = useMemo(
    () => dashboard?.activities.slice(0, 8) ?? [],
    [dashboard],
  );

  const updatedAtLabel = useMemo(
    () => getUpdatedAtLabel(dashboard?.updatedAt ?? null, appUiLanguage),
    [appUiLanguage, dashboard?.updatedAt],
  );

  const workspaceLabel = useMemo(() => {
    if (!dashboard) {
      return "";
    }

    return dashboard.title.replace(/ Workspace Dashboard$/, "");
  }, [dashboard]);

  const maxCadenceTotal = useMemo(
    () => Math.max(...recentBuckets.map((bucket) => bucket.total), 1),
    [recentBuckets],
  );

  if (!isReady && !dashboard) {
    return <SiteLoader size="md" />;
  }

  if (loadFailed || !dashboard) {
    return (
      <section className="site-panel rounded-[1.6rem] border p-6">
        <p className="text-sm font-medium">{ui.loadFailed}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="site-panel-vibrant relative overflow-hidden rounded-[1.8rem] border p-6 sm:p-7">
        <div className="absolute top-[-3rem] right-[-2rem] h-40 w-40 rounded-full bg-[var(--site-primary)]/16 blur-3xl" />
        <div className="absolute bottom-[-5rem] left-[-3rem] h-44 w-44 rounded-full bg-[var(--site-tertiary)]/12 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="site-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
                {ui.badge}
              </span>
              <span className="site-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
                {ui.planLabel}: {workspaceLabel}
              </span>
              <span className="site-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
                {ui.synced}: {updatedAtLabel ?? ui.neverSynced}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
              {ui.title}
            </h1>
            <p className="site-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
              {ui.body}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <article className="site-panel rounded-[1.25rem] border p-4">
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                  {translatedDashboard.usage.label || ui.trackedActions}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {translatedDashboard.usage.current}
                </p>
                <p className="site-muted mt-2 text-sm">{translatedDashboard.usage.text}</p>
              </article>
              <article className="site-panel rounded-[1.25rem] border p-4">
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                  {ui.latestAudit}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {latestAudit ? `${latestAudit.score}/100` : ui.latestAuditEmpty}
                </p>
                <p className="site-muted mt-2 text-sm">
                  {latestAudit ? summarizeAuditUrl(latestAudit.url) : ui.latestAuditBody}
                </p>
              </article>
              <article className="site-panel rounded-[1.25rem] border p-4">
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                  {ui.recentActions}
                </p>
                <p className="mt-2 text-2xl font-semibold">{recentActionCount}</p>
                <p className="site-muted mt-2 text-sm">{ui.recentActionsBody}</p>
              </article>
            </div>
          </div>

          <div className="site-panel w-full max-w-sm rounded-[1.5rem] border p-5 xl:sticky xl:top-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                  {ui.actionCapacity}
                </p>
                <p className="mt-2 text-3xl font-semibold">{Math.round(capacityPercent)}%</p>
              </div>
              <span className="site-chip rounded-full px-3 py-1 text-xs font-medium">
                {translatedDashboard.usage.current}/{usageLimitLabel}
              </span>
            </div>
            <div className="mt-5 h-2.5 rounded-full bg-[var(--site-surface-soft)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${capacityPercent}%`,
                  background: `linear-gradient(90deg, ${ACTIVITY_STYLES.blog.solid}, ${ACTIVITY_STYLES.assistant.solid})`,
                }}
              />
            </div>
            <p className="site-muted mt-4 text-sm leading-relaxed">
              {translatedDashboard.usage.text}
            </p>
            <a
              href={exportHref}
              download="aether-analytics.json"
              className="site-button-secondary mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold"
            >
              {ui.export}
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const palette = getTonePalette(card.tone);

          return (
            <article
              key={card.label}
              className="site-panel rounded-[1.4rem] border p-5"
              style={{
                backgroundImage: `linear-gradient(180deg, ${palette.soft}, transparent 70%)`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                </div>
                <span
                  className="mt-1 h-3 w-3 rounded-full"
                  style={{ backgroundColor: palette.solid }}
                />
              </div>
              <p className="site-muted mt-3 text-sm leading-relaxed">{card.description}</p>
              {typeof card.progress === "number" ? (
                <div className="mt-4 h-2 rounded-full bg-[var(--site-surface-soft)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${card.progress}%`,
                      backgroundColor: palette.solid,
                    }}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <article className="site-panel rounded-[1.6rem] border p-5 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="grid gap-3 lg:w-[270px]">
              <article className="site-panel-soft rounded-[1.2rem] border p-4">
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                  {ui.recentActions}
                </p>
                <p className="mt-2 text-2xl font-semibold">{recentActionCount}</p>
                <p className="site-muted mt-2 text-sm">{ui.recentActionsBody}</p>
              </article>
              <article className="site-panel-soft rounded-[1.2rem] border p-4">
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                  {ui.latestBlog}
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {translatedDashboard.latestBlogTitle || ui.latestBlogEmpty}
                </p>
                <p className="site-muted mt-2 text-sm">
                  {latestBlog ? `${ui.keywordLabel}: ${latestBlog.keyword}` : ui.latestBlogBody}
                </p>
              </article>
              <article className="site-panel-soft rounded-[1.2rem] border p-4">
                <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                  {ui.latestAudit}
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {latestAudit ? `${latestAudit.score}/100` : ui.latestAuditEmpty}
                </p>
                <p className="site-muted mt-2 text-sm">
                  {latestAudit
                    ? `${summarizeAuditUrl(latestAudit.url)}${translatedDashboard.latestAuditSummary ? ` • ${translatedDashboard.latestAuditSummary}` : ""}`
                    : ui.latestAuditBody}
                </p>
              </article>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{ui.cadence}</h2>
                  <p className="site-muted mt-1 text-sm">{ui.cadenceBody}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mixItems.map((item) => (
                    <span
                      key={item.key}
                      className="site-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.solid }}
                      />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              {recentBuckets.some((bucket) => bucket.total > 0) ? (
                <div className="mt-6 rounded-[1.35rem] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-4">
                  <div className="flex h-[280px] items-end gap-3">
                    {recentBuckets.map((bucket) => {
                      const columnHeight = Math.max((bucket.total / maxCadenceTotal) * 100, 10);

                      return (
                        <div key={bucket.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                          <div className="flex h-full items-end justify-center">
                            <div
                              className="flex w-full max-w-12 flex-col justify-end overflow-hidden rounded-[1rem] border border-white/8"
                              style={{
                                height: `${columnHeight}%`,
                                backgroundColor: "rgba(255, 255, 255, 0.02)",
                              }}
                              title={`${bucket.label}: ${bucket.total}`}
                            >
                              {(
                                [
                                  { key: "blog", ...ACTIVITY_STYLES.blog },
                                  { key: "audit", ...ACTIVITY_STYLES.audit },
                                  { key: "assistant", ...ACTIVITY_STYLES.assistant },
                                ] as const
                              ).map((segment) =>
                                bucket.values[segment.key] > 0 ? (
                                  <span
                                    key={segment.key}
                                    style={{
                                      flex: bucket.values[segment.key],
                                      backgroundColor: segment.solid,
                                    }}
                                  />
                                ) : null,
                              )}
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-medium">{bucket.total}</p>
                            <p className="site-muted mt-1 text-[11px] uppercase tracking-[0.18em]">
                              {bucket.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="site-panel-soft mt-6 rounded-[1.35rem] border p-5 text-sm">
                  {ui.cadenceEmpty}
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="site-panel rounded-[1.6rem] border p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{ui.signalMap}</h2>
          <p className="site-muted mt-1 text-sm">{ui.signalMapBody}</p>

          {signalMap.length ? (
            <>
              <div className="relative mx-auto mt-6 aspect-square w-full max-w-[320px] overflow-hidden rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-soft)]">
                {signalMap.map((item) => {
                  const position = SIGNAL_LAYOUTS[item.key] ?? SIGNAL_LAYOUTS.score;
                  const bubbleText = getSignalBubbleTextConfig(item.key);

                  return (
                    <div
                      key={item.key}
                      className="absolute flex items-center justify-center rounded-full border text-center shadow-[var(--site-depth-shadow-soft)]"
                      style={{
                        width: item.size,
                        height: item.size,
                        left: position.left,
                        top: position.top,
                        transform: "translate(-50%, -50%)",
                        backgroundColor: item.soft,
                        borderColor: item.solid,
                      }}
                      >
                      <div
                        className={`flex items-center justify-center text-center ${bubbleText.containerClassName}`}
                      >
                        <p className={bubbleText.valueClassName}>{item.displayValue}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid gap-2">
                {signalMap.map((item) => (
                  <div
                    key={item.key}
                    className="site-panel-soft flex items-center justify-between rounded-[1rem] border px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.solid }}
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-semibold">{item.displayValue}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="site-panel-soft mt-6 rounded-[1.35rem] border p-5 text-sm">
              {ui.signalMapEmpty}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.15fr)]">
        <article className="site-panel rounded-[1.6rem] border p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{ui.activityMix}</h2>
          <p className="site-muted mt-1 text-sm">{ui.activityMixBody}</p>

          {mixTotal ? (
            <div className="mt-6 flex flex-col gap-4">
              <div className="site-panel-soft flex flex-col items-center rounded-[1.2rem] border px-5 py-6">
                <div className="relative flex h-56 w-56 items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: donutBackground }}
                  />
                  <div className="absolute inset-[18%] rounded-full bg-[var(--site-surface)]" />
                  <div className="absolute inset-0 rounded-full border border-[var(--site-border)]" />
                  <div className="relative text-center">
                    <p className="text-3xl font-semibold">
                      {formatCompactNumber(mixTotal, appUiLanguage)}
                    </p>
                    <p className="site-muted mt-1 text-[11px] uppercase tracking-[0.18em]">
                      {ui.trackedActions}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid w-full max-w-sm grid-cols-3 gap-2 text-center">
                  {mixItems.map((item) => (
                    <div key={item.key} className="site-panel rounded-[0.95rem] border px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.solid }}
                        />
                        <span className="text-xs font-medium">{Math.round(item.percent)}%</span>
                      </div>
                      <p className="site-muted mt-1 text-[11px] uppercase tracking-[0.14em]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {featuredMixItem ? (
                <article className="site-panel-soft rounded-[1.1rem] border p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: featuredMixItem.solid }}
                      />
                      <div>
                        <p className="text-base font-semibold">{featuredMixItem.label}</p>
                        <p className="site-muted mt-1 text-sm">
                          {featuredMixItem.displayValue} saved items
                        </p>
                      </div>
                    </div>
                    <span className="text-base font-semibold">
                      {Math.round(featuredMixItem.percent)}%
                    </span>
                  </div>
                  <div className="mt-4 h-2.5 rounded-full bg-[var(--site-surface)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${featuredMixItem.percent}%`,
                        backgroundColor: featuredMixItem.solid,
                      }}
                    />
                  </div>
                </article>
              ) : null}

              <div className="grid gap-3">
                {secondaryMixItems.map((item) => (
                  <article
                    key={item.key}
                    className="site-panel-soft rounded-[1rem] border p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.solid }}
                        />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="site-muted mt-1 text-xs">
                            {item.displayValue} saved items
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">
                        {Math.round(item.percent)}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[var(--site-surface)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.solid,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="site-panel-soft mt-6 rounded-[1.35rem] border p-5 text-sm">
              {ui.recentTimelineEmpty}
            </div>
          )}
        </article>

        <article className="site-panel rounded-[1.6rem] border p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{ui.healthBoard}</h2>
          <p className="site-muted mt-1 text-sm">{ui.healthBoardBody}</p>

          {healthBars.length ? (
            <div className="mt-6 space-y-5">
              {healthBars.map((bar) => (
                <div key={bar.key}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{bar.label}</p>
                      <p className="site-muted mt-1 text-sm">{bar.description}</p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: bar.soft,
                        color: bar.solid,
                      }}
                    >
                      {bar.value}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-[var(--site-surface-soft)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${bar.percent}%`,
                        backgroundColor: bar.solid,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="site-panel-soft rounded-[1.35rem] border p-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold">{ui.latestSignals}</h3>
                  {latestAudit ? (
                    <span className="site-muted text-xs">{summarizeAuditUrl(latestAudit.url)}</span>
                  ) : null}
                </div>
                {translatedDashboard.health.length ? (
                  <div className="space-y-2.5">
                    {translatedDashboard.health.map((row) => {
                      const palette = getTonePalette(row.tone);

                      return (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-4 rounded-[0.95rem] bg-[var(--site-surface)] px-3 py-3 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: palette.solid }}
                            />
                            <div>
                              <p className="font-medium">{row.label}</p>
                              <p className="site-muted mt-1 text-xs">{row.description}</p>
                            </div>
                          </div>
                          <span className="font-semibold">{row.value}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm">{ui.latestSignalsEmpty}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="site-panel-soft mt-6 rounded-[1.35rem] border p-5 text-sm">
              {ui.healthBoardEmpty}
            </div>
          )}
        </article>
      </section>

      <section className="site-panel rounded-[1.6rem] border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{ui.recentTimeline}</h2>
            <p className="site-muted mt-1 text-sm">
              {dashboard.body}
            </p>
          </div>
          <span className="site-chip rounded-full px-3 py-1 text-xs font-medium">
            {timelineItems.length} items
          </span>
        </div>

        {timelineItems.length ? (
          <div className="mt-6 divide-y divide-[var(--site-border)]">
            {timelineItems.map((activity, index) => {
              const palette = getActivityPalette(activity.type);
              const statusPalette = getStatusPalette(activity.status);

              return (
                <div
                  key={`${activity.title}-${activity.date}-${index}`}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: palette.solid }}
                    />
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="site-muted mt-1 text-[11px] uppercase tracking-[0.18em]">
                        {ui.activityTypes[activity.type] ?? activity.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="site-muted text-sm">{activity.date}</span>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: statusPalette.soft,
                        color: statusPalette.solid,
                      }}
                    >
                      {activity.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="site-panel-soft mt-6 rounded-[1.35rem] border p-5 text-sm">
            {ui.recentTimelineEmpty}
          </div>
        )}
      </section>
    </div>
  );
}

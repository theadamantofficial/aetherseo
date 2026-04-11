"use client";

import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import SiteLoader from "@/components/site-loader";
import { auth } from "@/lib/firebase";
import { resolveAppUiLanguage, type AppUiLanguage } from "@/lib/app-ui-language";
import { getDashboardForUser, type DashboardActivity } from "@/lib/firebase-data";

type FilterKey = "all" | "blog" | "audit" | "other";

const historyUiCopy: Record<
  AppUiLanguage,
  {
    loading: string;
    badge: string;
    title: string;
    body: string;
    tabs: Record<FilterKey, string>;
    loadError: string;
    table: {
      name: string;
      type: string;
      date: string;
      status: string;
    };
    empty: string;
    typeLabels: Record<DashboardActivity["type"], string>;
  }
> = {
  en: {
    loading: "Loading workspace history...",
    badge: "Workspace archive",
    title: "History and Archive",
    body: "Every generated blog, audit, and workspace action is tracked here.",
    tabs: {
      all: "All Items",
      blog: "Blogs",
      audit: "Audits",
      other: "Reports",
    },
    loadError: "Could not load workspace history.",
    table: {
      name: "Document Name",
      type: "Type",
      date: "Created Date",
      status: "Status",
    },
    empty: "No saved items match this filter yet.",
    typeLabels: {
      blog: "Blog",
      audit: "Audit",
      report: "Report",
      system: "System",
    },
  },
  hi: {
    loading: "Workspace history load ho rahi hai...",
    badge: "Workspace archive",
    title: "History aur Archive",
    body: "Har generated blog, audit aur workspace action yahan track hota hai.",
    tabs: {
      all: "Sab Items",
      blog: "Blogs",
      audit: "Audits",
      other: "Reports",
    },
    loadError: "Workspace history load nahi ho payi.",
    table: {
      name: "Document Name",
      type: "Type",
      date: "Created Date",
      status: "Status",
    },
    empty: "Is filter ke liye abhi koi saved item nahi mila.",
    typeLabels: {
      blog: "Blog",
      audit: "Audit",
      report: "Report",
      system: "System",
    },
  },
  fr: {
    loading: "Chargement de l'historique du workspace...",
    badge: "Archive du workspace",
    title: "Historique et archive",
    body: "Chaque blog genere, audit et action du workspace est suivi ici.",
    tabs: {
      all: "Tous les elements",
      blog: "Blogs",
      audit: "Audits",
      other: "Rapports",
    },
    loadError: "Impossible de charger l'historique du workspace.",
    table: {
      name: "Nom du document",
      type: "Type",
      date: "Date de creation",
      status: "Statut",
    },
    empty: "Aucun element enregistre ne correspond encore a ce filtre.",
    typeLabels: {
      blog: "Blog",
      audit: "Audit",
      report: "Rapport",
      system: "Systeme",
    },
  },
  de: {
    loading: "Workspace-Verlauf wird geladen...",
    badge: "Workspace-Archiv",
    title: "Verlauf und Archiv",
    body: "Jeder generierte Blog, jedes Audit und jede Workspace-Aktion wird hier erfasst.",
    tabs: {
      all: "Alle Eintraege",
      blog: "Blogs",
      audit: "Audits",
      other: "Berichte",
    },
    loadError: "Der Workspace-Verlauf konnte nicht geladen werden.",
    table: {
      name: "Dokumentname",
      type: "Typ",
      date: "Erstellt am",
      status: "Status",
    },
    empty: "Keine gespeicherten Eintraege passen zu diesem Filter.",
    typeLabels: {
      blog: "Blog",
      audit: "Audit",
      report: "Bericht",
      system: "System",
    },
  },
  ja: {
    loading: "ワークスペース履歴を読み込み中...",
    badge: "ワークスペースアーカイブ",
    title: "履歴とアーカイブ",
    body: "生成したブログ、監査、ワークスペース操作はすべてここで追跡されます。",
    tabs: {
      all: "すべて",
      blog: "ブログ",
      audit: "監査",
      other: "レポート",
    },
    loadError: "ワークスペース履歴を読み込めませんでした。",
    table: {
      name: "ドキュメント名",
      type: "種類",
      date: "作成日",
      status: "状態",
    },
    empty: "このフィルタに一致する保存済みアイテムはまだありません。",
    typeLabels: {
      blog: "ブログ",
      audit: "監査",
      report: "レポート",
      system: "システム",
    },
  },
  ko: {
    loading: "워크스페이스 기록을 불러오는 중...",
    badge: "워크스페이스 아카이브",
    title: "기록과 아카이브",
    body: "생성된 블로그, 감사, 워크스페이스 작업이 모두 여기서 추적됩니다.",
    tabs: {
      all: "전체",
      blog: "블로그",
      audit: "감사",
      other: "리포트",
    },
    loadError: "워크스페이스 기록을 불러오지 못했습니다.",
    table: {
      name: "문서 이름",
      type: "유형",
      date: "생성일",
      status: "상태",
    },
    empty: "이 필터와 일치하는 저장된 항목이 아직 없습니다.",
    typeLabels: {
      blog: "블로그",
      audit: "감사",
      report: "리포트",
      system: "시스템",
    },
  },
};

export default function HistoryPage() {
  const router = useRouter();
  const { language, uiLanguage } = useLanguage();
  const [items, setItems] = useState<DashboardActivity[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const activeLanguage = resolveAppUiLanguage(language, uiLanguage);
  const ui = historyUiCopy[activeLanguage];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      try {
        const dashboard = await getDashboardForUser(currentUser.uid);
        setItems(dashboard.activities);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }

    if (filter === "blog") {
      return items.filter((item) => item.type === "blog");
    }

    if (filter === "audit") {
      return items.filter((item) => item.type === "audit");
    }

    return items.filter((item) => item.type === "report" || item.type === "system");
  }, [filter, items]);

  if (loading) {
    return <SiteLoader size="lg" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--site-muted)]">
          {ui.badge}
        </p>
        <h1 className="mt-4 text-lg font-semibold">{ui.title}</h1>
        <p className="site-muted mt-2 text-sm">{ui.body}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(["all", "blog", "audit", "other"] as FilterKey[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab
                  ? "bg-[var(--site-primary)] text-white"
                  : "text-[var(--site-muted)] hover:bg-[var(--site-surface-soft)]"
              }`}
            >
              {ui.tabs[tab]}
            </button>
          ))}
        </div>
      </section>
      {error ? (
        <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4 text-sm">
          {ui.loadError}
        </div>
      ) : null}

      <section className="overflow-x-auto rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--site-border)]">
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--site-muted)]">{ui.table.name}</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--site-muted)]">{ui.table.type}</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--site-muted)]">{ui.table.date}</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--site-muted)]">{ui.table.status}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <tr
                  key={item.title + item.date}
                  className="border-b border-[var(--site-border)] text-sm last:border-0"
                >
                  <td className="p-4">{item.title}</td>
                  <td className="site-muted p-4">{ui.typeLabels[item.type] ?? item.type}</td>
                  <td className="site-muted p-4">{item.date}</td>
                  <td className="p-4">{item.status}</td>
                </tr>
              ))
            ) : (
              <tr className="text-sm">
                <td className="p-4" colSpan={4}>
                  {ui.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

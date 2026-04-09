"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { auth } from "@/lib/firebase";
import { resolveAppUiLanguage, type AppUiLanguage } from "@/lib/app-ui-language";
import {
  getPaidTierLabel,
  getPaidTierMeta,
  getUserProfile,
  type PaidPlanTier,
  type UserProfile,
} from "@/lib/firebase-data";

type CurrencyCode = "usd" | "inr";

const planCards: Array<{
  id: "free" | PaidPlanTier;
  title: string;
  priceInr: string;
  priceUsd: string;
  bodyKey: "free" | PaidPlanTier;
}> = [
  {
    id: "free",
    title: "Free",
    priceInr: "₹0/mo",
    priceUsd: "$0/mo",
    bodyKey: "free",
  },
  {
    id: "starter",
    title: "Starter",
    priceInr: "₹299/mo",
    priceUsd: "$5/mo",
    bodyKey: "starter",
  },
  {
    id: "pro",
    title: "Pro",
    priceInr: "₹999/mo",
    priceUsd: "$15/mo",
    bodyKey: "pro",
  },
  {
    id: "agency",
    title: "Agency",
    priceInr: "₹2999/mo",
    priceUsd: "$39/mo",
    bodyKey: "agency",
  },
];

const billingUiCopy: Record<
  AppUiLanguage,
  {
    title: string;
    loading: string;
    intro: string;
    currencyUsd: string;
    currencyInr: string;
    currentPlan: string;
    currentPlanBodyPaid: string;
    currentPlanBodyFree: string;
    billedUsd: string;
    billedInr: string;
    managePaidTier: string;
    manageSubscription: string;
    subscriptionStatus: string;
    statusCurrentPlan: string;
    statusDisplayPrice: string;
    statusPaid: string;
    statusFree: string;
    upgradeTitle: string;
    upgradeBody: string;
    active: string;
    useFreePlan: string;
    choosePlan: string;
    alreadyActive: string;
    freePlanName: string;
    paidPlanName: string;
    planBodies: Record<"free" | PaidPlanTier, string>;
  }
> = {
  en: {
    title: "Billing & Subscription",
    loading: "Loading billing details...",
    intro: "Billing display defaults to USD for global pricing. Switch to INR only when needed.",
    currencyUsd: "USD",
    currencyInr: "INR",
    currentPlan: "Current Plan",
    currentPlanBodyPaid: "Paid workspace tier selected for your account.",
    currentPlanBodyFree: "Lead-magnet access with capped monthly volume.",
    billedUsd: "Billed monthly in USD.",
    billedInr: "Converted monthly INR display.",
    managePaidTier: "Manage Paid Tier",
    manageSubscription: "Manage Subscription",
    subscriptionStatus: "Subscription Status",
    statusCurrentPlan: "Current plan",
    statusDisplayPrice: "Display price",
    statusPaid: "Paid tier is active. Payment gateway sync has not been connected yet.",
    statusFree: "No paid subscription is active on this account yet.",
    upgradeTitle: "Upgrade or Adjust Your Plan",
    upgradeBody:
      "Transparent pricing designed for India-first conversion with clean global pricing anchors.",
    active: "Active",
    useFreePlan: "Use Free Plan",
    choosePlan: "Choose Plan",
    alreadyActive: "Already Active",
    freePlanName: "Free",
    paidPlanName: "Paid",
    planBodies: {
      free: "5 blogs, 3 website audits, basic features, and limited export.",
      starter: "50 blogs, 20 audits, faster generation, and no watermark.",
      pro: "200 blogs, 100 audits, priority AI, history, export, and advanced SEO suggestions.",
      agency: "Fair-usage scale, team access, API access, and automation features.",
    },
  },
  hi: {
    title: "Billing & Subscription",
    loading: "Billing details load ho rahi hain...",
    intro:
      "Global pricing ke liye billing display default me USD hai. Zarurat ho tabhi INR par switch karo.",
    currencyUsd: "USD",
    currencyInr: "INR",
    currentPlan: "Current Plan",
    currentPlanBodyPaid: "Aapke account ke liye paid workspace tier select hai.",
    currentPlanBodyFree: "Lead-magnet access capped monthly volume ke saath.",
    billedUsd: "Monthly billing USD me.",
    billedInr: "Converted monthly INR display.",
    managePaidTier: "Paid Tier Manage Karo",
    manageSubscription: "Subscription Manage Karo",
    subscriptionStatus: "Subscription Status",
    statusCurrentPlan: "Current plan",
    statusDisplayPrice: "Display price",
    statusPaid: "Paid tier active hai. Payment gateway sync abhi connect nahi hua.",
    statusFree: "Is account par abhi koi paid subscription active nahi hai.",
    upgradeTitle: "Apna Plan Upgrade ya Adjust Karo",
    upgradeBody:
      "Transparent pricing jo India-first conversion aur clean global pricing anchors ke saath design ki gayi hai.",
    active: "Active",
    useFreePlan: "Free Plan Use Karo",
    choosePlan: "Plan Chuno",
    alreadyActive: "Already Active",
    freePlanName: "Free",
    paidPlanName: "Paid",
    planBodies: {
      free: "5 blogs, 3 website audits, basic features aur limited export.",
      starter: "50 blogs, 20 audits, faster generation aur no watermark.",
      pro: "200 blogs, 100 audits, priority AI, history, export aur advanced SEO suggestions.",
      agency: "Fair-usage scale, team access, API access aur automation features.",
    },
  },
  fr: {
    title: "Facturation et abonnement",
    loading: "Chargement des informations de facturation...",
    intro:
      "L'affichage de facturation est en USD par defaut pour une tarification globale. Passez en INR seulement si necessaire.",
    currencyUsd: "USD",
    currencyInr: "INR",
    currentPlan: "Plan actuel",
    currentPlanBodyPaid: "Le niveau payant selectionne est actif pour votre compte.",
    currentPlanBodyFree: "Acces d'acquisition avec volume mensuel limite.",
    billedUsd: "Facture mensuelle en USD.",
    billedInr: "Affichage converti en INR mensuel.",
    managePaidTier: "Gerer le niveau payant",
    manageSubscription: "Gerer l'abonnement",
    subscriptionStatus: "Statut de l'abonnement",
    statusCurrentPlan: "Plan actuel",
    statusDisplayPrice: "Prix affiche",
    statusPaid:
      "Le niveau payant est actif. La synchro avec le paiement n'est pas encore connectee.",
    statusFree: "Aucun abonnement payant n'est encore actif sur ce compte.",
    upgradeTitle: "Mettre a niveau ou ajuster votre plan",
    upgradeBody:
      "Une tarification transparente pensee pour une conversion India-first avec des reperes globaux propres.",
    active: "Actif",
    useFreePlan: "Utiliser le plan Free",
    choosePlan: "Choisir le plan",
    alreadyActive: "Deja actif",
    freePlanName: "Free",
    paidPlanName: "Paid",
    planBodies: {
      free: "5 blogs, 3 audits de site, fonctions de base et export limite.",
      starter: "50 blogs, 20 audits, generation plus rapide et aucun watermark.",
      pro: "200 blogs, 100 audits, priority AI, historique, export et suggestions SEO avancees.",
      agency: "Usage raisonnable, acces equipe, acces API et fonctions d'automatisation.",
    },
  },
  de: {
    title: "Abrechnung und Abo",
    loading: "Abrechnungsdaten werden geladen...",
    intro: "Die Anzeige ist standardmaessig USD fuer globale Preise. Wechsle nur bei Bedarf zu INR.",
    currencyUsd: "USD",
    currencyInr: "INR",
    currentPlan: "Aktueller Plan",
    currentPlanBodyPaid: "Der bezahlte Workspace-Tarif ist fuer dein Konto aktiv.",
    currentPlanBodyFree: "Lead-Magnet-Zugang mit begrenztem Monatsvolumen.",
    billedUsd: "Monatliche Abrechnung in USD.",
    billedInr: "Umgerechnete monatliche INR-Anzeige.",
    managePaidTier: "Bezahlten Tarif verwalten",
    manageSubscription: "Abo verwalten",
    subscriptionStatus: "Abo-Status",
    statusCurrentPlan: "Aktueller Plan",
    statusDisplayPrice: "Angezeigter Preis",
    statusPaid:
      "Der bezahlte Tarif ist aktiv. Die Payment-Synchronisierung ist noch nicht verbunden.",
    statusFree: "Auf diesem Konto ist noch kein bezahltes Abo aktiv.",
    upgradeTitle: "Plan upgraden oder anpassen",
    upgradeBody:
      "Transparente Preise fuer India-first Conversion mit klaren globalen Preisankern.",
    active: "Aktiv",
    useFreePlan: "Free-Plan nutzen",
    choosePlan: "Plan waehlen",
    alreadyActive: "Bereits aktiv",
    freePlanName: "Free",
    paidPlanName: "Paid",
    planBodies: {
      free: "5 Blogs, 3 Website-Audits, Basisfunktionen und limitierter Export.",
      starter: "50 Blogs, 20 Audits, schnellere Generierung und kein Wasserzeichen.",
      pro: "200 Blogs, 100 Audits, Priority AI, Verlauf, Export und erweiterte SEO-Hinweise.",
      agency: "Fair Usage, Teamzugang, API-Zugang und Automatisierungsfunktionen.",
    },
  },
  ja: {
    title: "請求とサブスクリプション",
    loading: "請求情報を読み込み中...",
    intro: "グローバル価格のため請求表示はデフォルトで USD です。必要な場合のみ INR に切り替えてください。",
    currencyUsd: "USD",
    currencyInr: "INR",
    currentPlan: "現在のプラン",
    currentPlanBodyPaid: "有料ワークスペースのプランがこのアカウントに適用されています。",
    currentPlanBodyFree: "月間上限付きのリード獲得向けアクセスです。",
    billedUsd: "月額 USD 請求。",
    billedInr: "月額 INR 換算表示。",
    managePaidTier: "有料プランを管理",
    manageSubscription: "サブスクリプションを管理",
    subscriptionStatus: "契約状況",
    statusCurrentPlan: "現在のプラン",
    statusDisplayPrice: "表示価格",
    statusPaid: "有料プランは有効です。決済同期はまだ接続されていません。",
    statusFree: "このアカウントではまだ有料契約は有効ではありません。",
    upgradeTitle: "プランを変更またはアップグレード",
    upgradeBody: "India-first の導線とグローバル価格基準を両立した明確な価格設計です。",
    active: "利用中",
    useFreePlan: "Free プランを使う",
    choosePlan: "プランを選ぶ",
    alreadyActive: "利用中",
    freePlanName: "Free",
    paidPlanName: "Paid",
    planBodies: {
      free: "5 件のブログ、3 件のサイト監査、基本機能、制限付きエクスポート。",
      starter: "50 件のブログ、20 件の監査、高速生成、透かしなし。",
      pro: "200 件のブログ、100 件の監査、Priority AI、履歴、エクスポート、高度な SEO 提案。",
      agency: "フェアユース、チーム利用、API 利用、自動化機能。",
    },
  },
  ko: {
    title: "결제 및 구독",
    loading: "결제 정보를 불러오는 중...",
    intro: "글로벌 가격 기준으로 기본 표시는 USD입니다. 필요할 때만 INR로 전환하세요.",
    currencyUsd: "USD",
    currencyInr: "INR",
    currentPlan: "현재 플랜",
    currentPlanBodyPaid: "유료 워크스페이스 티어가 이 계정에 적용되어 있습니다.",
    currentPlanBodyFree: "월간 사용량이 제한된 리드 유입용 접근입니다.",
    billedUsd: "월별 USD 청구.",
    billedInr: "월별 INR 환산 표시.",
    managePaidTier: "유료 티어 관리",
    manageSubscription: "구독 관리",
    subscriptionStatus: "구독 상태",
    statusCurrentPlan: "현재 플랜",
    statusDisplayPrice: "표시 가격",
    statusPaid: "유료 티어가 활성화되어 있습니다. 결제 연동은 아직 연결되지 않았습니다.",
    statusFree: "이 계정에는 아직 유료 구독이 없습니다.",
    upgradeTitle: "플랜 업그레이드 또는 조정",
    upgradeBody:
      "India-first 전환을 고려하면서도 글로벌 가격 기준을 유지한 투명한 가격 구조입니다.",
    active: "활성",
    useFreePlan: "Free 플랜 사용",
    choosePlan: "플랜 선택",
    alreadyActive: "이미 활성",
    freePlanName: "Free",
    paidPlanName: "Paid",
    planBodies: {
      free: "블로그 5개, 웹사이트 감사 3개, 기본 기능, 제한된 내보내기.",
      starter: "블로그 50개, 감사 20개, 더 빠른 생성, 워터마크 없음.",
      pro: "블로그 200개, 감사 100개, Priority AI, 기록, 내보내기, 고급 SEO 제안.",
      agency: "공정 사용, 팀 접근, API 접근, 자동화 기능.",
    },
  },
};

export default function BillingPage() {
  const router = useRouter();
  const { language, uiLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>("usd");
  const activeLanguage = resolveAppUiLanguage(language, uiLanguage);
  const ui = billingUiCopy[activeLanguage];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      try {
        const nextProfile = await getUserProfile(currentUser.uid);
        setProfile(nextProfile);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <div className="site-muted text-sm">{ui.loading}</div>;
  }

  const paidTierLabel = getPaidTierLabel(profile?.paidPlanTier);
  const paidTierMeta = getPaidTierMeta(profile?.paidPlanTier);
  const currentPlanName = profile?.plan === "paid" ? paidTierLabel ?? ui.paidPlanName : ui.freePlanName;
  const currentPlanPriceInr = profile?.plan === "paid" ? paidTierMeta?.priceInr ?? "Custom" : "₹0/mo";
  const currentPlanPriceUsd = profile?.plan === "paid" ? paidTierMeta?.priceUsd ?? "Custom" : "$0/mo";
  const currentPlanPrice = currency === "usd" ? currentPlanPriceUsd : currentPlanPriceInr;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{ui.title}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="site-muted text-sm">{ui.intro}</p>
        <div className="site-pref-bar inline-flex items-center gap-2 rounded-full p-1.5">
          <button
            type="button"
            onClick={() => setCurrency("usd")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              currency === "usd" ? "site-button-ink" : "site-button-secondary"
            }`}
          >
            {ui.currencyUsd}
          </button>
          <button
            type="button"
            onClick={() => setCurrency("inr")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              currency === "inr" ? "site-button-ink" : "site-button-secondary"
            }`}
          >
            {ui.currencyInr}
          </button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
        <article className="site-panel rounded-2xl border p-6">
          <p className="site-accent-text text-xs uppercase tracking-[0.2em]">{ui.currentPlan}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-5xl font-semibold">{currentPlanName}</h2>
              <p className="site-muted mt-2 text-sm">
                {profile?.plan === "paid" ? ui.currentPlanBodyPaid : ui.currentPlanBodyFree}
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-semibold">{currentPlanPrice}</p>
              <p className="site-muted mt-1 text-sm">{currency === "usd" ? ui.billedUsd : ui.billedInr}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/choose-plan" className="site-button-secondary rounded-xl border px-4 py-2 text-sm font-semibold">
              {ui.managePaidTier}
            </Link>
            <Link href="/choose-plan" className="site-button-primary rounded-xl px-4 py-2 text-sm font-semibold">
              {ui.manageSubscription}
            </Link>
          </div>
        </article>

        <article className="site-panel rounded-2xl border p-6">
          <h3 className="text-2xl font-semibold">{ui.subscriptionStatus}</h3>
          <div className="mt-4 space-y-3 text-sm">
            {[
              `${ui.statusCurrentPlan}: ${currentPlanName}`,
              `${ui.statusDisplayPrice}: ${currentPlanPrice || (currency === "usd" ? "$0/mo" : "₹0/mo")}`,
              profile?.plan === "paid" ? ui.statusPaid : ui.statusFree,
            ].map((line) => (
              <div key={line} className="site-panel-soft rounded-xl p-3">
                {line}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section>
        <h3 className="text-center text-4xl font-semibold">{ui.upgradeTitle}</h3>
        <p className="site-muted mt-2 text-center text-sm">{ui.upgradeBody}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {planCards.map((plan) => {
            const isCurrent =
              plan.id === "free"
                ? profile?.plan === "free"
                : profile?.plan === "paid" && profile?.paidPlanTier === plan.id;
            const isFeatured = plan.id === "pro";
            const price = currency === "usd" ? plan.priceUsd : plan.priceInr;

            return (
              <article
                key={plan.id}
                className={`flex h-full flex-col rounded-2xl border p-6 ${
                  isFeatured ? "site-panel-vibrant border-[#6b5dff]" : "site-panel"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-3xl font-semibold">{plan.title}</h4>
                  {isCurrent ? (
                    <span
                      className={`${
                        isFeatured ? "bg-white text-[#111111]" : "site-chip"
                      } rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]`}
                    >
                      {ui.active}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-5xl font-semibold">{price}</p>
                <p className={`mt-2 text-sm ${isFeatured ? "text-white/80" : "site-muted"}`}>
                  {currency === "usd" ? ui.billedUsd : ui.billedInr}
                </p>
                <p className={`mt-4 flex-1 text-sm leading-6 ${isFeatured ? "text-white/80" : "site-muted"}`}>
                  {ui.planBodies[plan.bodyKey]}
                </p>
                <Link
                  href={plan.id === "free" ? "/auth?plan=free" : `/choose-plan?tier=${plan.id}`}
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${
                    isFeatured ? "site-button-secondary border" : "site-button-primary"
                  }`}
                  style={isFeatured ? { backgroundColor: "#ffffff", color: "#111111" } : undefined}
                >
                  {isCurrent ? ui.alreadyActive : plan.id === "free" ? ui.useFreePlan : ui.choosePlan}
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "@/components/language-provider";
import SitePreferences from "@/components/site-preferences";
import { auth } from "@/lib/firebase";
import {
  getUserProfile,
  isSupportedPaidTier,
  setUserPaidTier,
  type PaidPlanTier,
} from "@/lib/firebase-data";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

const PAID_TIER_STORAGE = "rankly-paid-tier-choice";
type CurrencyCode = "usd" | "inr";

const paidPlans: Array<{
  id: PaidPlanTier;
  priceInr: string;
  priceUsd: string;
  badge: string;
  title: string;
  subtitle: string;
  features: string[];
}> = [
  {
    id: "starter",
    priceInr: "₹299/month",
    priceUsd: "$5/month",
    badge: "Most popular entry",
    title: "Starter",
    subtitle: "For individuals and freelancers",
    features: [
      "50 blogs per month",
      "20 website audits",
      "Faster generation",
      "No watermark",
    ],
  },
  {
    id: "pro",
    priceInr: "₹999/month",
    priceUsd: "$15/month",
    badge: "Main money maker",
    title: "Pro",
    subtitle: "For serious users who need depth",
    features: [
      "200 blogs per month",
      "100 website audits",
      "Priority AI",
      "Advanced SEO suggestions",
      "History and export",
    ],
  },
  {
    id: "agency",
    priceInr: "₹2999/month",
    priceUsd: "$39/month",
    badge: "High-ticket tier",
    title: "Agency",
    subtitle: "For agencies and businesses",
    features: [
      "Unlimited usage with fair usage policy",
      "Team access",
      "API access",
      "Automation features",
    ],
  },
];

const pageCopy = {
  en: {
    eyebrow: "Paid workspace selection",
    title: "Choose the paid plan that fits your publishing volume.",
    body: "Free remains your lead-magnet plan. This screen is only for paid users choosing the right operating tier before entering the dashboard.",
    globalNote: "India-friendly pricing with optional global reference",
    helper: "You can switch tiers later from billing.",
    saving: "Saving your paid plan...",
    ready: "Your paid workspace is ready.",
    failed: "Could not save the selected paid plan.",
    cta: "Select plan",
    current: "Current plan",
    dashboard: "Go to dashboard",
    home: "Back home",
    signIn: "Sign in first",
    fairUsage: "Unlimited is governed by a fair usage policy.",
    currencyLabel: "Display currency",
    usd: "USD",
    inr: "INR",
  },
  es: {
    eyebrow: "Seleccion del plan pago",
    title: "Elige el plan pago segun tu volumen de publicacion.",
    body: "Free sigue siendo el plan de adquisicion. Esta pantalla es solo para usuarios pagos antes de entrar al dashboard.",
    globalNote: "Precio para India con referencia global opcional",
    helper: "Luego puedes cambiar el nivel desde billing.",
    saving: "Guardando tu plan pago...",
    ready: "Tu espacio pago ya esta listo.",
    failed: "No se pudo guardar el plan seleccionado.",
    cta: "Seleccionar plan",
    current: "Plan actual",
    dashboard: "Ir al dashboard",
    home: "Volver al inicio",
    signIn: "Inicia sesion primero",
    fairUsage: "Unlimited se rige por una politica de fair usage.",
    currencyLabel: "Moneda visible",
    usd: "USD",
    inr: "INR",
  },
  fr: {
    eyebrow: "Selection du forfait payant",
    title: "Choisissez le forfait payant adapte a votre volume de publication.",
    body: "Free reste le plan d'acquisition. Cet ecran concerne seulement les utilisateurs payants avant l'entree dans le dashboard.",
    globalNote: "Tarification adaptee a l'Inde avec reference mondiale optionnelle",
    helper: "Vous pourrez changer de niveau plus tard depuis billing.",
    saving: "Enregistrement du forfait payant...",
    ready: "Votre espace payant est pret.",
    failed: "Impossible d'enregistrer le forfait selectionne.",
    cta: "Choisir ce forfait",
    current: "Forfait actuel",
    dashboard: "Aller au dashboard",
    home: "Retour accueil",
    signIn: "Connectez-vous d'abord",
    fairUsage: "Unlimited est soumis a une politique de fair usage.",
    currencyLabel: "Devise affichee",
    usd: "USD",
    inr: "INR",
  },
  hi: {
    eyebrow: "Paid workspace selection",
    title: "Apne publishing volume ke hisab se paid plan choose karo.",
    body: "Free lead-magnet plan hi rahega. Ye page sirf paid users ke liye hai dashboard me jane se pehle.",
    globalNote: "India-friendly pricing with optional global reference",
    helper: "Baad me billing se tier change kar sakte ho.",
    saving: "Paid plan save ho raha hai...",
    ready: "Tumhara paid workspace ready hai.",
    failed: "Selected paid plan save nahi ho paya.",
    cta: "Plan select karo",
    current: "Current plan",
    dashboard: "Dashboard kholo",
    home: "Home par jao",
    signIn: "Pehle sign in karo",
    fairUsage: "Unlimited fair usage policy ke under rahega.",
    currencyLabel: "Display currency",
    usd: "USD",
    inr: "INR",
  },
} as const;

function formatFirebaseMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const maybeCode = "code" in error && typeof error.code === "string" ? error.code : null;
    const maybeMessage = "message" in error && typeof error.message === "string" ? error.message : null;

    if (maybeCode && maybeMessage) {
      return `${fallback} (${maybeCode}: ${maybeMessage})`;
    }

    if (maybeMessage) {
      return `${fallback} (${maybeMessage})`;
    }
  }

  return fallback;
}

export default function ChoosePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, uiLanguage } = useLanguage();
  const copy = useTranslatedCopy(pageCopy[uiLanguage], language, `choose-plan-copy-${uiLanguage}`);
  const [uid, setUid] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTier, setSelectedTier] = useState<PaidPlanTier | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setBusy] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("usd");

  useEffect(() => {
    const requestedTier = searchParams.get("tier");
    if (requestedTier && isSupportedPaidTier(requestedTier)) {
      setSelectedTier(requestedTier);
      setStatus(`Selected ${planLabel(requestedTier)}. Continue to sign in or confirm this tier.`);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PAID_TIER_STORAGE, requestedTier);
      }
      return;
    }

    if (typeof window !== "undefined") {
      const storedTier = window.localStorage.getItem(PAID_TIER_STORAGE);
      if (storedTier && isSupportedPaidTier(storedTier)) {
        setSelectedTier(storedTier);
        setStatus(`Selected ${planLabel(storedTier)}. Continue to sign in or confirm this tier.`);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUid("");
        return;
      }

      setUid(currentUser.uid);

      try {
        const profile = await getUserProfile(currentUser.uid);
        setPhone(profile.phone);
        setSelectedTier(profile.paidPlanTier);
      } catch {
        setStatus(copy.signIn);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [copy.signIn, router]);

  async function handleChoosePlan(tier: PaidPlanTier) {
    setSelectedTier(tier);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(PAID_TIER_STORAGE, tier);
    }

    if (!uid) {
      setStatus(`Selected ${planLabel(tier)}. Continue to sign in to activate this paid tier.`);
      router.push(`/auth?plan=paid&tier=${tier}`);
      return;
    }

    setBusy(true);
    setStatus(copy.saving);

    try {
      await setUserPaidTier(uid, tier, phone);
      setSelectedTier(tier);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PAID_TIER_STORAGE);
      }
      setStatus(copy.ready);
      router.replace("/dashboard");
    } catch (error) {
      setStatus(formatFirebaseMessage(error, copy.failed));
      setBusy(false);
    }
  }

  return (
    <div className="site-page min-h-screen px-4 py-10">
      <div className="relative mx-auto max-w-6xl">
        <header className="site-header-shell mb-8 flex items-center justify-between gap-4 rounded-[2rem] px-3 py-3">
          <Link href={`/${uiLanguage}`} className="flex items-center gap-3 rounded-full px-2 py-1.5">
            <Image
              src="/aether-logo-mark.png"
              alt="Aether SEO"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-full object-cover"
            />
            <span>
              <p className="text-base font-semibold md:text-lg">Aether SEO</p>
              <p className="site-muted text-[11px] uppercase tracking-[0.22em]">AI MEETS SEO</p>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <SitePreferences className="shrink-0" />
            <Link href={`/${uiLanguage}`} className="site-button-secondary rounded-full px-4 py-2.5 text-sm font-medium">
              {copy.home}
            </Link>
          </div>
        </header>

        <section className="site-panel-hero site-animate-rise rounded-[2.2rem] border px-7 py-8 md:px-10">
          <p className="site-chip inline-flex rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
            {copy.title}
          </h1>
          <p className="site-muted mt-5 max-w-3xl text-sm leading-7 md:text-base">
            {copy.body}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="site-panel-soft rounded-[1.5rem] border p-5">
              <p className="site-muted text-xs uppercase tracking-[0.16em]">Global + India friendly</p>
              <p className="mt-3 text-2xl font-semibold">{copy.globalNote}</p>
            </div>
            <div className="site-panel-soft rounded-[1.5rem] border p-5">
              <p className="site-muted text-xs uppercase tracking-[0.16em]">Pricing logic</p>
              <p className="mt-3 text-2xl font-semibold">Aggressive pricing, high margin potential.</p>
            </div>
            <div className="site-panel-soft rounded-[1.5rem] border p-5">
              <p className="site-muted text-xs uppercase tracking-[0.16em]">Note</p>
              <p className="mt-3 text-2xl font-semibold">{copy.fairUsage}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="site-muted text-sm">USD is the default display currency. Switch if the user prefers local pricing.</p>
            <div className="site-pref-bar inline-flex items-center gap-2 rounded-full p-1.5">
              <span className="site-muted px-2 text-xs uppercase tracking-[0.16em]">{copy.currencyLabel}</span>
              <button
                type="button"
                onClick={() => setCurrency("usd")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  currency === "usd" ? "site-button-ink" : "site-button-secondary"
                }`}
              >
                {copy.usd}
              </button>
              <button
                type="button"
                onClick={() => setCurrency("inr")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  currency === "inr" ? "site-button-ink" : "site-button-secondary"
                }`}
              >
                {copy.inr}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {paidPlans.map((plan) => {
            const isSelected = selectedTier === plan.id;
            const isFeatured = plan.id === "pro";
            const price = currency === "usd" ? plan.priceUsd : plan.priceInr;

            return (
              <article
                key={plan.id}
                className={`${isFeatured ? "site-panel-vibrant" : "site-panel"} site-hover-lift site-animate-rise flex h-full flex-col rounded-[2rem] border p-6`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`${isFeatured ? "text-white/75" : "site-accent-text"} text-xs uppercase tracking-[0.16em]`}>
                      {plan.badge}
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold">{plan.title}</h2>
                    <p className={`${isFeatured ? "text-white/78" : "site-muted"} mt-2 text-sm leading-6`}>
                      {plan.subtitle}
                    </p>
                  </div>
                  {isSelected ? (
                    <span className={`${isFeatured ? "bg-white text-[#111111]" : "site-chip"} rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]`}>
                      {copy.current}
                    </span>
                  ) : null}
                </div>

                <div className="mt-7">
                  <p className="text-4xl font-semibold">{price}</p>
                  <p className={`${isFeatured ? "text-white/72" : "site-muted"} mt-2 text-sm`}>
                    {currency === "usd" ? "Billed monthly in USD." : "Converted monthly INR display."}
                  </p>
                </div>

                <div className="mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className={`${isFeatured ? "bg-white/10 border-white/15 text-white" : "site-panel-soft"} rounded-[1.2rem] border px-4 py-3 text-sm`}
                    >
                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleChoosePlan(plan.id)}
                  className={`${isFeatured ? "site-button-secondary" : "site-button-primary"} mt-6 flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70`}
                  style={isFeatured ? { backgroundColor: "#ffffff", color: "#111111" } : undefined}
                >
                  {!uid ? `Continue with ${plan.title}` : isSelected ? copy.dashboard : copy.cta}
                </button>
              </article>
            );
          })}
        </section>

        <div className="site-panel mt-8 rounded-[1.8rem] border px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="site-muted text-sm">{status ?? copy.helper}</p>
            {uid ? (
              <Link href="/dashboard" className="site-button-secondary rounded-full px-4 py-2 text-sm font-medium">
                {copy.dashboard}
              </Link>
            ) : (
              <Link href="/auth?plan=paid" className="site-button-secondary rounded-full px-4 py-2 text-sm font-medium">
                {copy.signIn}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function planLabel(tier: PaidPlanTier): string {
  if (tier === "starter") {
    return "Starter";
  }

  if (tier === "pro") {
    return "Pro";
  }

  return "Agency";
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "@/components/language-provider";
import SitePreferences from "@/components/site-preferences";
import { auth } from "@/lib/firebase";
import { getUserProfile, isSupportedPaidTier } from "@/lib/firebase-data";
import {
  formatInrAmount,
  formatUsdAmount,
  getPaidPlanDefinition,
  PAID_PLAN_TIERS,
  PLATFORM_FEE_USD,
  type PaidPlanTier,
} from "@/lib/paid-plans";
import { useUsdInrRate } from "@/lib/use-usd-inr-rate";
import { useTranslatedCopy } from "@/lib/use-translated-copy";

const PAID_TIER_STORAGE = "rankly-paid-tier-choice";
const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type CurrencyCode = "usd" | "inr";

type RazorpayOrderResponse = {
  amount: number;
  currency: "INR" | "USD";
  keyId: string;
  mode: "test" | "prod";
  orderId: string;
  title: string;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  amount: number;
  currency: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  key: string;
  modal?: {
    ondismiss?: () => void;
  };
  name: string;
  notes?: Record<string, string>;
  order_id: string;
  prefill?: {
    contact?: string;
    email?: string;
    name?: string;
  };
  theme?: {
    color: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

let razorpayCheckoutPromise: Promise<void> | null = null;

const pageCopy = {
  en: {
    eyebrow: "Paid workspace selection",
    title: "Choose the paid plan that fits your publishing volume.",
    body: "Free remains your lead-magnet plan. This screen is only for paid users choosing the right operating tier before entering the dashboard.",
    globalNote: "India-friendly pricing with optional global reference",
    helper: "You can switch tiers later from billing. Payments run through Razorpay.",
    ready: "Your paid workspace is ready.",
    current: "Current plan",
    selected: "Selected",
    dashboard: "Go to dashboard",
    home: "Back home",
    signIn: "Sign in first",
    fairUsage: "Unlimited is governed by a fair usage policy.",
    currencyLabel: "Display currency",
    usd: "USD",
    inr: "INR",
    chargeNote: "INR is a daily reference only. Razorpay charges in USD, and a $0.50 non-refundable platform fee is added before checkout.",
    creatingOrder: "Preparing Razorpay checkout...",
    openingCheckout: "Opening Razorpay checkout...",
    verifyingPayment: "Verifying Razorpay payment...",
    paymentCancelled: "Payment was cancelled before completion.",
    paymentScriptError: "Razorpay checkout could not be loaded.",
    orderFailed: "Could not create a Razorpay order.",
    verifyFailed: "Could not verify the payment.",
    summaryTitle: "Checkout summary",
    summaryBody: "Review today's USD charge and INR reference before continuing. Razorpay will charge in USD.",
    exchangeRateLabel: "Exchange rate",
    planPriceLabel: "Plan price",
    platformFeeLabel: "Platform fee",
    totalTodayLabel: "Charged today",
    platformFeeNote: "The platform fee is non-refundable.",
    continueToPayment: "Continue",
    back: "Back",
    reviewReady: "Review your payment breakdown before continuing.",
  },
  es: {
    eyebrow: "Seleccion del plan pago",
    title: "Elige el plan pago segun tu volumen de publicacion.",
    body: "Free sigue siendo el plan de adquisicion. Esta pantalla es solo para usuarios pagos antes de entrar al dashboard.",
    globalNote: "Precio para India con referencia global opcional",
    helper: "Luego puedes cambiar el nivel desde billing. Los pagos usan Razorpay.",
    ready: "Tu espacio pago ya esta listo.",
    current: "Plan actual",
    selected: "Seleccionado",
    dashboard: "Ir al dashboard",
    home: "Volver al inicio",
    signIn: "Inicia sesion primero",
    fairUsage: "Unlimited se rige por una politica de fair usage.",
    currencyLabel: "Moneda visible",
    usd: "USD",
    inr: "INR",
    chargeNote: "INR es solo una referencia diaria. Razorpay cobra en USD y se agrega un cargo de plataforma no reembolsable de $0.50 antes del checkout.",
    creatingOrder: "Preparando el checkout de Razorpay...",
    openingCheckout: "Abriendo el checkout de Razorpay...",
    verifyingPayment: "Verificando el pago de Razorpay...",
    paymentCancelled: "El pago fue cancelado antes de completarse.",
    paymentScriptError: "No se pudo cargar el checkout de Razorpay.",
    orderFailed: "No se pudo crear la orden de Razorpay.",
    verifyFailed: "No se pudo verificar el pago.",
    summaryTitle: "Resumen del checkout",
    summaryBody: "Revisa el cobro en USD y la referencia en INR antes de continuar. Razorpay cobrara en USD.",
    exchangeRateLabel: "Tipo de cambio",
    planPriceLabel: "Precio del plan",
    platformFeeLabel: "Cargo de plataforma",
    totalTodayLabel: "Cobrado hoy",
    platformFeeNote: "El cargo de plataforma no es reembolsable.",
    continueToPayment: "Continuar",
    back: "Volver",
    reviewReady: "Revisa el desglose del pago antes de continuar.",
  },
  fr: {
    eyebrow: "Selection du forfait payant",
    title: "Choisissez le forfait payant adapte a votre volume de publication.",
    body: "Free reste le plan d'acquisition. Cet ecran concerne seulement les utilisateurs payants avant l'entree dans le dashboard.",
    globalNote: "Tarification adaptee a l'Inde avec reference mondiale optionnelle",
    helper: "Vous pourrez changer de niveau plus tard depuis billing. Les paiements passent par Razorpay.",
    ready: "Votre espace payant est pret.",
    current: "Forfait actuel",
    selected: "Selectionne",
    dashboard: "Aller au dashboard",
    home: "Retour accueil",
    signIn: "Connectez-vous d'abord",
    fairUsage: "Unlimited est soumis a une politique de fair usage.",
    currencyLabel: "Devise affichee",
    usd: "USD",
    inr: "INR",
    chargeNote: "L'INR n'est qu'une reference quotidienne. Razorpay facture en USD et des frais de plateforme non remboursables de $0.50 sont ajoutes avant le checkout.",
    creatingOrder: "Preparation du checkout Razorpay...",
    openingCheckout: "Ouverture du checkout Razorpay...",
    verifyingPayment: "Verification du paiement Razorpay...",
    paymentCancelled: "Le paiement a ete annule avant la fin.",
    paymentScriptError: "Impossible de charger le checkout Razorpay.",
    orderFailed: "Impossible de creer la commande Razorpay.",
    verifyFailed: "Impossible de verifier le paiement.",
    summaryTitle: "Resume du checkout",
    summaryBody: "Verifiez le montant facture en USD et la reference INR avant de continuer. Razorpay facturera en USD.",
    exchangeRateLabel: "Taux de change",
    planPriceLabel: "Prix du forfait",
    platformFeeLabel: "Frais de plateforme",
    totalTodayLabel: "Facture aujourd'hui",
    platformFeeNote: "Les frais de plateforme ne sont pas remboursables.",
    continueToPayment: "Continuer",
    back: "Retour",
    reviewReady: "Verifiez le detail du paiement avant de continuer.",
  },
  hi: {
    eyebrow: "Paid workspace selection",
    title: "Apne publishing volume ke hisab se paid plan choose karo.",
    body: "Free lead-magnet plan hi rahega. Ye page sirf paid users ke liye hai dashboard me jane se pehle.",
    globalNote: "India-friendly pricing with optional global reference",
    helper: "Baad me billing se tier change kar sakte ho. Payments Razorpay se chalenge.",
    ready: "Tumhara paid workspace ready hai.",
    current: "Current plan",
    selected: "Selected",
    dashboard: "Dashboard kholo",
    home: "Home par jao",
    signIn: "Pehle sign in karo",
    fairUsage: "Unlimited fair usage policy ke under rahega.",
    currencyLabel: "Display currency",
    usd: "USD",
    inr: "INR",
    chargeNote: "INR sirf daily reference hai. Razorpay USD me charge karega aur checkout se pehle $0.50 ka non-refundable platform fee add hoga.",
    creatingOrder: "Razorpay checkout prepare ho raha hai...",
    openingCheckout: "Razorpay checkout khul raha hai...",
    verifyingPayment: "Razorpay payment verify ho raha hai...",
    paymentCancelled: "Payment complete hone se pehle cancel ho gaya.",
    paymentScriptError: "Razorpay checkout load nahi ho paya.",
    orderFailed: "Razorpay order create nahi ho paya.",
    verifyFailed: "Payment verify nahi ho paya.",
    summaryTitle: "Checkout summary",
    summaryBody: "Continue karne se pehle USD charge aur INR reference dekh lo. Razorpay USD me charge karega.",
    exchangeRateLabel: "Exchange rate",
    planPriceLabel: "Plan price",
    platformFeeLabel: "Platform fee",
    totalTodayLabel: "Aaj charge hoga",
    platformFeeNote: "Platform fee non-refundable hai.",
    continueToPayment: "Continue karo",
    back: "Back",
    reviewReady: "Continue karne se pehle payment breakdown dekh lo.",
  },
} as const;

function formatAuthErrorMessage(error: unknown, fallback: string): string {
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

async function postJson<T>(url: string, token: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  return payload as T;
}

async function ensureRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Razorpay checkout can only open in the browser.");
  }

  if (window.Razorpay) {
    return;
  }

  if (razorpayCheckoutPromise) {
    return razorpayCheckoutPromise;
  }

  razorpayCheckoutPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_CHECKOUT_SRC}"]`,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");

    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    const handleLoad = () => {
      cleanup();

      if (window.Razorpay) {
        resolve();
        return;
      }

      razorpayCheckoutPromise = null;
      reject(new Error("Razorpay checkout could not be loaded."));
    };

    const handleError = () => {
      cleanup();
      razorpayCheckoutPromise = null;
      reject(new Error("Razorpay checkout could not be loaded."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });

  return razorpayCheckoutPromise;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="site-panel-soft flex items-center justify-between rounded-[1.25rem] border px-4 py-3 text-sm">
      <span className="site-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function ChoosePlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, uiLanguage } = useLanguage();
  const copy = useTranslatedCopy(pageCopy[uiLanguage], language, `choose-plan-copy-${uiLanguage}`);
  const requestedTier = searchParams.get("tier");
  const initialSelectedTier =
    requestedTier && isSupportedPaidTier(requestedTier) ? requestedTier : null;
  const [uid, setUid] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTier, setSelectedTier] = useState<PaidPlanTier | null>(() => {
    if (initialSelectedTier) {
      return initialSelectedTier;
    }

    if (typeof window !== "undefined") {
      const storedTier = window.localStorage.getItem(PAID_TIER_STORAGE);
      if (storedTier && isSupportedPaidTier(storedTier)) {
        return storedTier;
      }
    }

    return null;
  });
  const [checkoutTier, setCheckoutTier] = useState<PaidPlanTier | null>(null);
  const [currentPaidTier, setCurrentPaidTier] = useState<PaidPlanTier | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setBusy] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("usd");
  const { fxDate, usdToInrRate } = useUsdInrRate();
  const paidPlans = PAID_PLAN_TIERS.map((tier) => ({
    id: tier,
    ...getPaidPlanDefinition(tier, usdToInrRate),
  }));
  const checkoutPlan = checkoutTier ? getPaidPlanDefinition(checkoutTier, usdToInrRate) : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (selectedTier) {
      window.localStorage.setItem(PAID_TIER_STORAGE, selectedTier);
    } else {
      window.localStorage.removeItem(PAID_TIER_STORAGE);
    }
  }, [selectedTier]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUid("");
        setCurrentPaidTier(null);
        return;
      }

      setUid(currentUser.uid);

      try {
        const profile = await getUserProfile(currentUser.uid);
        setPhone(profile.phone);
        setCurrentPaidTier(profile.paidPlanTier);
        setSelectedTier((existingSelection) => existingSelection ?? profile.paidPlanTier);
      } catch {
        setStatus(copy.signIn);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [copy.signIn]);

  function handleChoosePlan(tier: PaidPlanTier) {
    setSelectedTier(tier);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(PAID_TIER_STORAGE, tier);
    }

    if (!uid) {
      router.push(`/auth?plan=paid&tier=${tier}`);
      return;
    }

    if (currentPaidTier === tier) {
      router.replace("/dashboard");
      return;
    }

    setCheckoutTier(tier);
    setStatus(copy.reviewReady);
  }

  async function handleConfirmCheckout() {
    if (!checkoutTier) {
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatus(copy.signIn);
      return;
    }

    setBusy(true);

    try {
      await ensureRazorpayCheckout();
    } catch (error) {
      setBusy(false);
      setStatus(formatAuthErrorMessage(error, copy.paymentScriptError));
      return;
    }

    setStatus(copy.creatingOrder);

    try {
      const orderToken = await currentUser.getIdToken();
      const order = await postJson<RazorpayOrderResponse>("/api/razorpay/order", orderToken, {
        paidPlanTier: checkoutTier,
        phone,
      });

      setStatus(copy.openingCheckout);

      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) {
        throw new Error(copy.paymentScriptError);
      }

      setCheckoutTier(null);

      const razorpay = new RazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Aether SEO",
        description: `${order.title} plan + platform fee`,
        order_id: order.orderId,
        prefill: {
          contact: phone || undefined,
          email: currentUser.email ?? undefined,
          name: currentUser.displayName ?? undefined,
        },
        notes: {
          planTier: checkoutTier,
          fxRateDate: fxDate ?? "unavailable",
          platformFeeUsd: String(PLATFORM_FEE_USD),
          usdToInrRate: String(usdToInrRate),
        },
        theme: {
          color: "#111111",
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setStatus(copy.paymentCancelled);
          },
        },
        handler: async (response) => {
          setStatus(copy.verifyingPayment);

          try {
            const verificationToken = await currentUser.getIdToken();
            await postJson<{ ok: true }>("/api/razorpay/verify", verificationToken, {
              paidPlanTier: checkoutTier,
              ...response,
            });

            if (typeof window !== "undefined") {
              window.localStorage.removeItem(PAID_TIER_STORAGE);
            }

            setCurrentPaidTier(checkoutTier);
            setStatus(copy.ready);
            router.replace("/dashboard");
          } catch (error) {
            setBusy(false);
            setStatus(formatAuthErrorMessage(error, copy.verifyFailed));
          }
        },
      });

      razorpay.open();
    } catch (error) {
      setBusy(false);
      setStatus(formatAuthErrorMessage(error, copy.orderFailed));
    }
  }

  return (
    <div className="site-page min-h-screen px-4 py-10">
      {checkoutPlan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#081120]/72 p-4 backdrop-blur-sm">
          <div className="site-panel-hero w-full max-w-2xl rounded-[2rem] border p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="site-chip inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em]">
                  {checkoutPlan.title}
                </p>
                <h2 className="mt-4 text-3xl font-semibold">{copy.summaryTitle}</h2>
                <p className="site-muted mt-3 text-sm leading-6">{copy.summaryBody}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isBusy) {
                    setCheckoutTier(null);
                  }
                }}
                className="site-button-secondary rounded-full px-4 py-2 text-sm font-medium"
                disabled={isBusy}
              >
                {copy.back}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <SummaryRow
                label={fxDate ? `${copy.exchangeRateLabel} (${fxDate})` : copy.exchangeRateLabel}
                value={`1 USD = ${usdToInrRate.toFixed(2)} INR`}
              />
              <SummaryRow
                label={copy.planPriceLabel}
                value={`${formatUsdAmount(checkoutPlan.monthlyPriceUsd, "/month")} (${formatInrAmount(checkoutPlan.monthlyPriceInr, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })})`}
              />
              <SummaryRow
                label={copy.platformFeeLabel}
                value={`${formatUsdAmount(PLATFORM_FEE_USD)} (${formatInrAmount(checkoutPlan.platformFeeInr, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })})`}
              />
              <SummaryRow
                label={copy.totalTodayLabel}
                value={`${checkoutPlan.totalPriceUsdLabel} (${checkoutPlan.totalPriceInrLabel})`}
              />
            </div>

            <p className="site-muted mt-4 text-xs leading-6">{copy.platformFeeNote}</p>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckoutTier(null)}
                className="site-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
                disabled={isBusy}
              >
                {copy.back}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCheckout()}
                className="site-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isBusy}
              >
                {copy.continueToPayment}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
            <div>
              <p className="site-muted text-sm">
                USD is the checkout currency. Switch to INR to preview today&apos;s local reference pricing.
              </p>
              <p className="site-muted mt-2 text-xs">{copy.chargeNote}</p>
            </div>
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
            const isCurrent = currentPaidTier === plan.id;
            const isSelected = selectedTier === plan.id;
            const isFeatured = plan.id === "pro";
            const price = currency === "usd" ? plan.priceUsd : plan.priceInr;

            return (
              <article
                key={plan.id}
                className={`${isFeatured ? "site-panel-vibrant" : "site-panel"} ${isSelected && !isCurrent ? "border-[#f5b547]" : ""} site-hover-lift site-animate-rise flex h-full flex-col rounded-[2rem] border p-6`}
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
                  {isCurrent ? (
                    <span className={`${isFeatured ? "bg-white text-[#111111]" : "site-chip"} rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]`}>
                      {copy.current}
                    </span>
                  ) : isSelected ? (
                    <span className="site-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                      {copy.selected}
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
                      className={`${isFeatured ? "border-white/15 bg-white/10 text-white" : "site-panel-soft"} rounded-[1.2rem] border px-4 py-3 text-sm`}
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
                  {isCurrent ? copy.dashboard : `Subscribe ${plan.title}`}
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

export default function ChoosePlanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#081120]" />}>
      <ChoosePlanPageContent />
    </Suspense>
  );
}

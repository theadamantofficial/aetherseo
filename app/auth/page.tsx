"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  User,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
} from "firebase/auth";
import { useLanguage } from "@/components/language-provider";
import SitePreferences from "@/components/site-preferences";
import { appleProvider, auth, googleProvider } from "@/lib/firebase";
import {
  isSupportedPaidTier,
  setUserPlan,
  upsertUserProfile,
  type PaidPlanTier,
} from "@/lib/firebase-data";
import { footerCopy } from "@/lib/legal-copy";
import { authCopy } from "@/lib/site-language";
import type { BillingPlan } from "@/lib/firebase-data";

const EMAIL_LINK_STORAGE = "rankly-email-for-link";
const PHONE_STORAGE = "rankly-phone-draft";
const PLAN_STORAGE = "rankly-plan-choice";
const PAID_TIER_STORAGE = "rankly-paid-tier-choice";
const DEFAULT_PLAN: BillingPlan = "free";

const planCards: Array<{ id: BillingPlan; accent: string }> = [
  { id: "free", accent: "#82f0d6" },
  { id: "paid", accent: "#9fa6ff" },
];

function getPaidTierPresentation(tier: PaidPlanTier | null) {
  if (tier === "starter") {
    return {
      label: "Starter",
      title: "Starter paid workspace",
      body: "50 blogs per month, 20 audits, faster generation, and no watermark.",
    };
  }

  if (tier === "pro") {
    return {
      label: "Pro",
      title: "Pro paid workspace",
      body: "200 blogs, 100 audits, priority AI, advanced SEO suggestions, history, and export.",
    };
  }

  if (tier === "agency") {
    return {
      label: "Agency",
      title: "Agency paid workspace",
      body: "Fair-usage publishing, team access, API access, and automation features.",
    };
  }

  return {
    label: null,
    title: null,
    body: null,
  };
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M21.81 12.24c0-.72-.06-1.25-.19-1.81H12.2v3.44h5.53c-.11.86-.72 2.15-2.07 3.02l-.02.12 2.78 2.11.19.02c1.75-1.58 3.2-4.37 3.2-7.9Z"
        fill="#4285F4"
      />
      <path
        d="M12.2 21.88c2.71 0 4.99-.87 6.66-2.37l-3.17-2.25c-.85.58-1.98.99-3.49.99-2.65 0-4.9-1.71-5.71-4.08l-.11.01-2.89 2.19-.04.1c1.66 3.22 5.08 5.41 8.75 5.41Z"
        fill="#34A853"
      />
      <path
        d="M6.49 14.17c-.21-.58-.33-1.21-.33-1.87s.12-1.29.32-1.87l-.01-.13-2.93-2.22-.1.04a9.64 9.64 0 0 0 0 8.35l3.05-2.3Z"
        fill="#FBBC05"
      />
      <path
        d="M12.2 6.35c1.9 0 3.19.8 3.92 1.47l2.86-2.74C17.18 3.45 14.91 2.7 12.2 2.7a9.52 9.52 0 0 0-8.76 5.42l3.03 2.31c.81-2.37 3.07-4.08 5.73-4.08Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M15.08 3.5c.07.87-.25 1.75-.78 2.41-.66.81-1.71 1.43-2.76 1.35-.12-.84.24-1.76.79-2.39.62-.7 1.72-1.39 2.75-1.37ZM18.44 17.18c-.59 1.33-.87 1.92-1.62 3.05-1.04 1.57-2.5 3.52-4.3 3.54-1.6.02-2.01-.98-4.18-.97-2.17.01-2.61.99-4.21.97-1.79-.02-3.17-1.78-4.21-3.35C-2.9 16.42-1.9 9.58 2.07 7.15c1.42-.88 3.07-1.39 4.62-1.39 1.71 0 2.79 1 4.21 1 1.38 0 2.23-1 4.2-1 .57 0 2.77.05 4.36 1.54-3.83 2.03-3.21 7.44-1.02 9.88Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" aria-hidden="true">
      <path d="M3.75 6.75h16.5v10.5H3.75z" strokeWidth="1.7" />
      <path d="m4.5 7.5 7.5 6 7.5-6" strokeWidth="1.7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" aria-hidden="true">
      <path
        d="M7.75 3.75h8.5a1 1 0 0 1 1 1v14.5a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z"
        strokeWidth="1.7"
      />
      <path d="M10 17.75h4" strokeWidth="1.7" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="m12 2.5 2.2 5.3 5.3 2.2-5.3 2.2L12 17.5l-2.2-5.3-5.3-2.2 5.3-2.2L12 2.5Z" />
    </svg>
  );
}

function getProviderLabel(currentUser: User | null): string | null {
  if (!currentUser) {
    return null;
  }

  const linkedProvider = currentUser.providerData.find((provider) =>
    ["google.com", "apple.com", "password"].includes(provider.providerId),
  );

  if (!linkedProvider) {
    return null;
  }

  if (linkedProvider.providerId === "google.com") {
    return "google";
  }

  if (linkedProvider.providerId === "apple.com") {
    return "apple";
  }

  return "email";
}

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

function readStoredPhone(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(PHONE_STORAGE) || "";
}

function readStoredPlan(): BillingPlan {
  if (typeof window === "undefined") {
    return DEFAULT_PLAN;
  }

  return window.localStorage.getItem(PLAN_STORAGE) === "paid" ? "paid" : DEFAULT_PLAN;
}

function readStoredPaidTier(): PaidPlanTier | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(PAID_TIER_STORAGE);
  return value && isSupportedPaidTier(value) ? value : null;
}

function persistDraftState(phone: string, plan: BillingPlan, paidTier: PaidPlanTier | null = null) {
  if (typeof window === "undefined") {
    return;
  }

  if (phone.trim()) {
    window.localStorage.setItem(PHONE_STORAGE, phone.trim());
  } else {
    window.localStorage.removeItem(PHONE_STORAGE);
  }

  window.localStorage.setItem(PLAN_STORAGE, plan);

  if (paidTier && plan === "paid") {
    window.localStorage.setItem(PAID_TIER_STORAGE, paidTier);
  } else {
    window.localStorage.removeItem(PAID_TIER_STORAGE);
  }
}

function clearAuthDraftState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(EMAIL_LINK_STORAGE);
  window.localStorage.removeItem(PHONE_STORAGE);
  window.localStorage.removeItem(PLAN_STORAGE);
  window.localStorage.removeItem(PAID_TIER_STORAGE);
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uiLanguage } = useLanguage();
  const handledUidRef = useRef<string | null>(null);
  const phoneRef = useRef("");
  const planRef = useRef<BillingPlan>(DEFAULT_PLAN);
  const paidTierRef = useRef<PaidPlanTier | null>(null);
  const copy = authCopy[uiLanguage];
  const footer = footerCopy[uiLanguage];

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>(DEFAULT_PLAN);
  const [selectedPaidTier, setSelectedPaidTier] = useState<PaidPlanTier | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setBusy] = useState(false);
  const [userUid, setUserUid] = useState("");
  const paidTierPresentation = getPaidTierPresentation(selectedPaidTier);

  useEffect(() => {
    const storedPhone = readStoredPhone();
    const requestedPlan = searchParams.get("plan");
    const requestedTier = searchParams.get("tier");
    const storedPlan = requestedPlan === "paid" || requestedPlan === "free"
      ? requestedPlan
      : readStoredPlan();
    const storedPaidTier =
      requestedTier && isSupportedPaidTier(requestedTier)
        ? requestedTier
        : readStoredPaidTier();
    setPhone(storedPhone);
    setSelectedPlan(storedPlan);
    setSelectedPaidTier(storedPaidTier);
    phoneRef.current = storedPhone;
    planRef.current = storedPlan;
    paidTierRef.current = storedPaidTier;
    persistDraftState(storedPhone, storedPlan, storedPaidTier);
  }, [searchParams]);

  useEffect(() => {
    phoneRef.current = phone;
    persistDraftState(phone, selectedPlan, paidTierRef.current);
  }, [phone, selectedPlan]);

  useEffect(() => {
    planRef.current = selectedPlan;
  }, [selectedPlan]);

  const finalizeSession = useCallback(async (user: User, provider: string | null) => {
    setBusy(true);

    try {
      const resolvedPhone = phoneRef.current || readStoredPhone();
      const chosenPlan = planRef.current || readStoredPlan();
      const chosenPaidTier = paidTierRef.current || readStoredPaidTier();

      const profile = await upsertUserProfile({
        user,
        phone: resolvedPhone,
        provider,
      });

      setUserUid(user.uid);

      if (profile.plan) {
        setSelectedPlan(profile.plan);
        setSelectedPaidTier(profile.paidPlanTier);

        if (profile.plan === "paid" && !profile.paidPlanTier && chosenPaidTier) {
          setStatus(copy.status.workspaceReady);
          router.replace(`/choose-plan?tier=${chosenPaidTier}`);
          return;
        }

        setStatus(copy.status.welcomeBack);
        clearAuthDraftState();
        router.replace(profile.plan === "paid" && !profile.paidPlanTier ? "/choose-plan" : "/dashboard");
        return;
      }

      setStatus(copy.status.creatingWorkspace(chosenPlan));
      if (chosenPlan === "paid" && chosenPaidTier) {
        setSelectedPaidTier(chosenPaidTier);
        setStatus(copy.status.workspaceReady);
        router.replace(`/choose-plan?tier=${chosenPaidTier}`);
        return;
      }

      if (chosenPlan === "paid") {
        setStatus(copy.status.workspaceReady);
        router.replace("/choose-plan");
        return;
      }

      await setUserPlan(user.uid, chosenPlan, resolvedPhone);
      clearAuthDraftState();
      setStatus(copy.status.workspaceReady);
      router.replace("/dashboard");
    } catch (error) {
      handledUidRef.current = null;
      setStatus(formatAuthErrorMessage(error, copy.status.signInFinishFailed));
    } finally {
      setBusy(false);
    }
  }, [copy.status, router]);

  useEffect(() => {
    const handleExistingLink = async () => {
      if (typeof window === "undefined" || !isSignInWithEmailLink(auth, window.location.href)) {
        return;
      }

      const resolvedEmail = window.localStorage.getItem(EMAIL_LINK_STORAGE);

      if (!resolvedEmail) {
        setStatus(copy.status.reconnectBrowser);
        return;
      }

      setBusy(true);
      setStatus(copy.status.signingInEmail);

      try {
        const result = await signInWithEmailLink(auth, resolvedEmail, window.location.href);
        handledUidRef.current = result.user.uid;
        await finalizeSession(result.user, "email");
      } catch (error) {
        handledUidRef.current = null;
        setBusy(false);
        setStatus(formatAuthErrorMessage(error, copy.status.linkExpired));
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUserUid("");
        return;
      }

      setUserUid(currentUser.uid);

      if (handledUidRef.current === currentUser.uid) {
        return;
      }

      handledUidRef.current = currentUser.uid;
      await finalizeSession(currentUser, getProviderLabel(currentUser));
    });

    void handleExistingLink();

    return () => {
      unsubscribe();
    };
  }, [copy.status.linkExpired, copy.status.reconnectBrowser, copy.status.signingInEmail, finalizeSession, router]);

  const sendEmailLink = async () => {
    if (!email.trim()) {
      setStatus(copy.status.needEmail);
      return;
    }

    setBusy(true);
    setStatus(copy.status.sendingLink);

    try {
      const actionCodeSettings = {
        url: typeof window !== "undefined" ? `${window.location.origin}/auth` : "/auth",
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(EMAIL_LINK_STORAGE, email.trim());
      }

      setStatus(copy.status.linkSent);
    } catch (error) {
      setStatus(formatAuthErrorMessage(error, copy.status.linkFailed));
    } finally {
      setBusy(false);
    }
  };

  const continueWithSocial = async (
    provider: typeof googleProvider | typeof appleProvider,
    providerLabel: "google" | "apple",
    message: string,
  ) => {
    setBusy(true);
    setStatus(message);

    try {
      const result = await signInWithPopup(auth, provider);
      handledUidRef.current = result.user.uid;
      await finalizeSession(result.user, providerLabel);
    } catch (error) {
      handledUidRef.current = null;
      setBusy(false);
      setStatus(
        formatAuthErrorMessage(
          error,
          providerLabel === "apple" ? copy.status.appleFailed : copy.status.googleFailed,
        ),
      );
    }
  };

  const handlePlanSelection = async (plan: BillingPlan) => {
    setSelectedPlan(plan);

    if (plan === "free") {
      setSelectedPaidTier(null);
      paidTierRef.current = null;
    }

    persistDraftState(phoneRef.current, plan, paidTierRef.current);

    if (plan === "paid") {
      router.push("/choose-plan");
      return;
    }

    if (!userUid) {
      setStatus(copy.status.workspaceSelected(copy.freeWorkspace));
      return;
    }

    setBusy(true);
    setStatus(copy.status.creatingWorkspace(plan));

    try {
      await setUserPlan(userUid, plan, phoneRef.current || readStoredPhone());
      clearAuthDraftState();
      router.replace("/dashboard");
    } catch (error) {
      setStatus(formatAuthErrorMessage(error, copy.status.workspaceSaveFailed));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="site-page relative min-h-screen overflow-hidden px-4 py-10 text-[#edf1ff]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(98,88,255,0.3),transparent_35%),radial-gradient(circle_at_top_right,rgba(64,170,255,0.16),transparent_28%)]" />
      <div className="pointer-events-none absolute left-10 top-20 h-56 w-56 rounded-full bg-[#5e50f3]/18 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-64 w-64 rounded-full bg-[#2294ff]/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <header className="site-header-shell site-animate-header mb-8 flex items-center justify-between gap-4 rounded-[2rem] px-3 py-3">
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
              {copy.backHome}
            </Link>
          </div>
        </header>

        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <section className="site-panel-hero site-animate-rise site-animate-glow rounded-[2rem] border p-7 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-8">
          <div className="site-chip inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em]">
            <span className="rounded-full bg-[#82f0d6]/12 p-1.5 text-[#82f0d6]">
              <SparkIcon />
            </span>
            {copy.badge}
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">{copy.title}</h1>

          <p className="site-muted mt-5 max-w-xl text-sm leading-7 md:text-base">{copy.body}</p>

          <div className="mt-8 space-y-3">
            {copy.bullets.map((item) => (
              <div
                key={item}
                className="site-panel-soft flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#82f0d6]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="site-panel-soft mt-8 rounded-[1.6rem] border p-5">
            <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.selectedWorkspace}</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {selectedPlan === "paid"
                    ? paidTierPresentation.title ?? copy.paidWorkspace
                    : copy.freeWorkspace}
                </p>
                <p className="site-muted mt-2 max-w-xs text-sm">
                  {selectedPlan === "paid"
                    ? paidTierPresentation.body ?? copy.paidWorkspaceBody
                    : copy.freeWorkspaceBody}
                </p>
              </div>
              <div className="rounded-full border border-[#82f0d6]/25 bg-[#82f0d6]/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#82f0d6]">
                {selectedPlan === "paid" && paidTierPresentation.label
                  ? paidTierPresentation.label
                  : copy.activeChoice}
              </div>
            </div>
          </div>
        </section>

        <section className="site-panel site-animate-rise rounded-[2rem] border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-7" style={{ ["--site-delay" as string]: "100ms" }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="site-accent-text text-xs uppercase tracking-[0.18em]">{copy.welcomeEyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold">{copy.welcomeTitle}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden gap-2 md:flex">
                <span className="site-chip flex h-10 w-10 items-center justify-center rounded-full border">
                  <GoogleIcon />
                </span>
                <span className="site-chip flex h-10 w-10 items-center justify-center rounded-full border">
                  <AppleIcon />
                </span>
                <span className="site-chip flex h-10 w-10 items-center justify-center rounded-full border">
                  <MailIcon />
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() =>
                continueWithSocial(googleProvider, "google", copy.status.connectingGoogle)
              }
            type="button"
            disabled={isBusy}
            className="site-button-secondary flex items-center justify-center gap-3 rounded-2xl border px-4 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <GoogleIcon />
            {copy.googleButton}
          </button>
          <button
            onClick={() => continueWithSocial(appleProvider, "apple", copy.status.connectingApple)}
            type="button"
            disabled={isBusy}
            className="site-button-secondary flex items-center justify-center gap-3 rounded-2xl border px-4 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <AppleIcon />
            {copy.appleButton}
          </button>
        </div>

          <div className="site-muted my-6 flex items-center gap-3 text-xs uppercase tracking-[0.18em]">
            <span className="h-px flex-1 bg-[var(--site-border)]" />
            {copy.emailDivider}
            <span className="h-px flex-1 bg-[var(--site-border)]" />
          </div>

          <div className="grid gap-4">
            <label className="site-panel-soft rounded-[1.4rem] border p-4">
              <span className="site-muted mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
                <MailIcon />
                {copy.emailLabel}
              </span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder={copy.emailPlaceholder}
                className="site-input w-full bg-transparent text-sm outline-none"
              />
            </label>

            <label className="site-panel-soft rounded-[1.4rem] border p-4">
              <span className="site-muted mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
                <PhoneIcon />
                {copy.phoneLabel}
              </span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                type="tel"
                placeholder={copy.phonePlaceholder}
                className="site-input w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>

          <button
            onClick={sendEmailLink}
            type="button"
            disabled={isBusy}
            className="site-button-primary mt-4 flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MailIcon />
            {isBusy ? "..." : copy.sendLinkButton}
          </button>

          <div className="mt-7">
            <div className="flex items-center justify-between">
              <p className="site-muted text-xs uppercase tracking-[0.18em]">{copy.chooseWorkspace}</p>
              <p className="site-muted text-xs">{copy.selectableBeforeSignin}</p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {planCards.map((plan) => {
                const isSelected = selectedPlan === plan.id;

                return (
                  <button
                    key={plan.id}
                    onClick={() => handlePlanSelection(plan.id)}
                    type="button"
                    disabled={isBusy}
                    className="site-option-card rounded-[1.5rem] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70"
                    data-selected={isSelected ? "true" : "false"}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold">
                          {plan.id === "paid"
                            ? paidTierPresentation.title ?? copy.paidWorkspace
                            : copy.freeWorkspace}
                        </p>
                        <p className="site-muted mt-3 text-sm leading-6">
                          {plan.id === "paid"
                            ? paidTierPresentation.body ?? copy.paidWorkspaceBody
                            : copy.freeWorkspaceBody}
                        </p>
                        {plan.id === "paid" && paidTierPresentation.label ? (
                          <p className="site-accent-text mt-3 text-xs uppercase tracking-[0.16em]">
                            Selected tier: {paidTierPresentation.label}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className="mt-1 h-3 w-3 rounded-full border"
                        style={{ backgroundColor: isSelected ? plan.accent : "transparent" }}
                      />
                    </div>
                    <p className="site-muted mt-4 text-xs uppercase tracking-[0.16em]">
                      {isSelected ? copy.selectedLabel : copy.chooseLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {status ? (
            <div className="site-panel-soft mt-5 rounded-2xl border px-4 py-3 text-sm">
              {status}
            </div>
          ) : (
            <div className="site-panel-soft mt-5 rounded-2xl border px-4 py-3 text-sm">
              {copy.status.initial}
            </div>
          )}
        </section>
        </div>

        <footer className="site-panel site-animate-rise mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] border px-5 py-4 text-sm" style={{ ["--site-delay" as string]: "180ms" }}>
          <p className="site-muted">Secure access for multilingual blog workflows, SEO planning, and content operations.</p>
          <div className="text-right">
            <p className="font-medium">{footer.parent}</p>
            <p className="site-muted text-xs">{footer.rights}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#081120]" />}>
      <AuthPageContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  User,
  isSignInWithEmailLink,
  linkWithPhoneNumber,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
} from "firebase/auth";
import AetherBrand from "@/components/aether-brand";
import { useLanguage } from "@/components/language-provider";
import MobileHeaderToggle from "@/components/mobile-header-toggle";
import SiteLoader from "@/components/site-loader";
import SitePreferences from "@/components/site-preferences";
import { auth, googleProvider } from "@/lib/firebase";
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
const PHONE_OTP_ENABLED = false;

const planCards: Array<{ id: BillingPlan; label: string }> = [
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
];

type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
};

type GrecaptchaWindow = Window & {
  grecaptcha?: {
    reset: (widgetId?: number) => void;
  };
};

/* ─── helpers ─── */

function getPaidTierPresentation(tier: PaidPlanTier | null) {
  if (tier === "starter") return { label: "Starter", title: "Starter workspace", body: "50 blogs/mo, 20 audits, faster generation, no watermark." };
  if (tier === "pro")     return { label: "Pro",     title: "Pro workspace",     body: "200 blogs, 100 audits, priority AI, advanced SEO, history, export." };
  if (tier === "agency")  return { label: "Agency",  title: "Agency workspace",  body: "Fair-usage publishing, team access, API access, automation." };
  return { label: null, title: null, body: null };
}

function formatAuthErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const authError = error as AuthErrorLike;
    const code = typeof authError.code === "string" ? authError.code : null;
    const msg  = typeof authError.message === "string" ? authError.message : null;
    if (code && msg) return `${fallback} (${code}: ${msg})`;
    if (msg) return `${fallback} (${msg})`;
  }
  return fallback;
}

const readLS = (key: string) => (typeof window !== "undefined" ? window.localStorage.getItem(key) : null);
const setLS  = (key: string, val: string) => { if (typeof window !== "undefined") window.localStorage.setItem(key, val); };
const delLS  = (key: string) => { if (typeof window !== "undefined") window.localStorage.removeItem(key); };

function readStoredPhone(): string  { return readLS(PHONE_STORAGE) ?? ""; }
function readStoredPlan(): BillingPlan { return readLS(PLAN_STORAGE) === "paid" ? "paid" : DEFAULT_PLAN; }
function readStoredPaidTier(): PaidPlanTier | null {
  const v = readLS(PAID_TIER_STORAGE);
  return v && isSupportedPaidTier(v) ? v : null;
}

function normalizePhone(input: string): string {
  const t = input.trim();
  if (!t) return "";
  const digits = t.replace(/\D/g, "");
  return t.startsWith("+") ? `+${digits}` : digits;
}
function isValidPhone(input: string) { return /^\+[1-9]\d{7,14}$/.test(input); }

function persistDraft(phone: string, plan: BillingPlan, paidTier: PaidPlanTier | null = null) {
  if (phone.trim()) {
    setLS(PHONE_STORAGE, phone.trim());
  } else {
    delLS(PHONE_STORAGE);
  }

  setLS(PLAN_STORAGE, plan);

  if (paidTier && plan === "paid") {
    setLS(PAID_TIER_STORAGE, paidTier);
  } else {
    delLS(PAID_TIER_STORAGE);
  }
}

function clearDraft() {
  [EMAIL_LINK_STORAGE, PHONE_STORAGE, PLAN_STORAGE, PAID_TIER_STORAGE].forEach(delLS);
}

/* ─── icons ─── */

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.81 12.24c0-.72-.06-1.25-.19-1.81H12.2v3.44h5.53c-.11.86-.72 2.15-2.07 3.02l2.97 2.23C20.36 17.68 21.81 15.2 21.81 12.24Z" fill="#4285F4"/>
      <path d="M12.2 21.88c2.71 0 4.99-.87 6.66-2.37l-2.97-2.23c-.85.58-1.98.99-3.69.99-2.83 0-5.22-1.88-6.08-4.42l-3.06 2.31C4.74 19.77 8.17 21.88 12.2 21.88Z" fill="#34A853"/>
      <path d="M6.12 13.85c-.22-.65-.34-1.34-.34-2.05s.12-1.4.34-2.05L3.06 7.44A9.64 9.64 0 0 0 2.56 11.8c0 1.59.37 3.1 1.03 4.36l3.06-2.31Z" fill="#FBBC05"/>
      <path d="M12.2 5.38c1.68 0 3.19.58 4.38 1.71l3.27-3.17C17.79 2.13 15.17 1.12 12.2 1.12 8.17 1.12 4.74 3.23 3.06 6.44l3.06 2.31C6.98 6.2 9.37 5.38 12.2 5.38Z" fill="#EA4335"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 18h6"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}

/* ─── step indicator ─── */

type StepState = "pending" | "active" | "done";

function StepDot({ state, number }: { state: StepState; number: number }) {
  const base = "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] font-medium";
  if (state === "done") {
    return (
      <span
        className={base}
        style={{
          borderColor: "color-mix(in srgb, var(--site-primary) 30%, var(--site-border))",
          backgroundColor: "color-mix(in srgb, var(--site-primary) 14%, transparent)",
          color: "var(--site-primary)",
        }}
      >
        <CheckIcon />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className={`${base} border-transparent text-white`} style={{ backgroundColor: "var(--site-primary)" }}>
        {number}
      </span>
    );
  }
  return (
    <span className={`${base} bg-[var(--site-surface-soft)] text-[var(--site-muted)]`} style={{ borderColor: "var(--site-border)" }}>
      {number}
    </span>
  );
}

/* ─── sub-components ─── */

function Field({ label, icon, children, hint }: { label: string; icon: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="site-muted flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em]">
        {icon}{label}
      </label>
      {children}
      {hint && <p className="site-muted text-[12px] leading-5">{hint}</p>}
    </div>
  );
}

function Btn({ id, onClick, disabled, variant = "solid", children }: {
  id?: string; onClick?: () => void; disabled?: boolean; variant?: "solid" | "outline"; children: React.ReactNode;
}) {
  const base = "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-[10px] text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  const cls  = variant === "solid"
    ? `${base} site-button-primary border border-transparent`
    : `${base} site-button-secondary border`;
  return <button id={id} type="button" className={cls} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-[var(--site-muted)]">
      <span className="h-px flex-1 bg-[var(--site-border)]" />
      {label}
      <span className="h-px flex-1 bg-[var(--site-border)]" />
    </div>
  );
}

function StepBlock({ step, state, title, children }: {
  step: number; state: StepState; title: string; children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border p-4 transition-opacity ${state === "pending" ? "pointer-events-none opacity-35" : "opacity-100"} ${state === "active" ? "site-panel" : "site-panel-soft"}`}>
      <div className="site-muted flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]">
        <StepDot state={state} number={step} />
        {title}
      </div>
      {children}
    </div>
  );
}

function getStatusStyles(type?: "success" | "error" | "info"): CSSProperties {
  if (type === "success") {
    return {
      backgroundColor: "color-mix(in srgb, #10b981 12%, var(--site-surface))",
      borderColor: "color-mix(in srgb, #10b981 26%, var(--site-border))",
      color: "var(--foreground)",
    };
  }

  if (type === "error") {
    return {
      backgroundColor: "color-mix(in srgb, #ef4444 12%, var(--site-surface))",
      borderColor: "color-mix(in srgb, #ef4444 26%, var(--site-border))",
      color: "var(--foreground)",
    };
  }

  return {
    backgroundColor: "var(--site-surface-soft)",
    borderColor: "var(--site-border)",
    color: "var(--foreground)",
  };
}

function StatusBar({ message, type }: { message: string; type?: "success" | "error" | "info" }) {
  return (
    <div className="rounded-xl border px-4 py-3 text-[13px] leading-5" style={getStatusStyles(type)}>
      {message}
    </div>
  );
}

/* ─── main page ─── */

function AuthPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { uiLanguage } = useLanguage();
  const copy   = authCopy[uiLanguage];
  const footer = footerCopy[uiLanguage];

  const handledUidRef         = useRef<string | null>(null);
  const emailLinkInProgressRef = useRef(false);
  const emailLinkHandledUidRef = useRef<string | null>(null);
  const redirectTimeoutRef    = useRef<number | null>(null);
  const recaptchaVerifierRef  = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef  = useRef<number | null>(null);
  const phoneRef              = useRef("");
  const planRef               = useRef<BillingPlan>(DEFAULT_PLAN);
  const paidTierRef           = useRef<PaidPlanTier | null>(null);

  /* step 1: sign-in method done */
  const [step1Done, setStep1Done] = useState(false);
  /* step 2: otp sent */
  const [otpSent, setOtpSent]     = useState(false);

  const [email,            setEmail]            = useState("");
  const [phone,            setPhone]            = useState("");
  const [otpCode,          setOtpCode]          = useState("");
  const [otpConfirmation,  setOtpConfirmation]  = useState<ConfirmationResult | null>(null);
  const [selectedPlan,     setSelectedPlan]     = useState<BillingPlan>(DEFAULT_PLAN);
  const [selectedPaidTier, setSelectedPaidTier] = useState<PaidPlanTier | null>(null);
  const [status,           setStatus]           = useState<{ msg: string; type?: "success" | "error" | "info" }>({ msg: "Enter your email or sign in with Google to get started." });
  const [isBusy,           setBusy]             = useState(false);
  const [userUid,          setUserUid]          = useState("");
  const [isHeaderOpen,     setHeaderOpen]       = useState(false);

  const paidTierInfo     = getPaidTierPresentation(selectedPaidTier);
  const isGooglePending  = Boolean(auth.currentUser && !auth.currentUser.phoneNumber && auth.currentUser.providerData.some(p => p.providerId === "google.com"));

  /* ── init from storage / search params ── */
  useEffect(() => {
    const storedPhone    = readStoredPhone();
    const reqPlan        = searchParams.get("plan");
    const reqTier        = searchParams.get("tier");
    const storedPlan     = (reqPlan === "paid" || reqPlan === "free") ? reqPlan : readStoredPlan();
    const storedPaidTier = (reqTier && isSupportedPaidTier(reqTier)) ? reqTier : readStoredPaidTier();
    setPhone(storedPhone);
    setSelectedPlan(storedPlan);
    setSelectedPaidTier(storedPaidTier);
    phoneRef.current    = storedPhone;
    planRef.current     = storedPlan;
    paidTierRef.current = storedPaidTier;
    persistDraft(storedPhone, storedPlan, storedPaidTier);
  }, [searchParams]);

  useEffect(() => { phoneRef.current = phone; persistDraft(phone, selectedPlan, paidTierRef.current); }, [phone, selectedPlan]);
  useEffect(() => { planRef.current = selectedPlan; }, [selectedPlan]);

  /* ── recaptcha helpers ── */
  const clearRecaptcha = useCallback(() => {
    recaptchaVerifierRef.current?.clear();
    recaptchaVerifierRef.current = null;
    recaptchaWidgetIdRef.current = null;
  }, []);

  const resetRecaptchaWidget = useCallback(() => {
    if (typeof window === "undefined" || recaptchaWidgetIdRef.current === null) return;
    (window as GrecaptchaWindow).grecaptcha?.reset(recaptchaWidgetIdRef.current);
  }, []);

  useEffect(() => () => clearRecaptcha(), [clearRecaptcha]);

  const resetOtpState = useCallback(() => {
    setOtpConfirmation(null);
    setOtpCode("");
    setOtpSent(false);
    clearRecaptcha();
  }, [clearRecaptcha]);

  const navigateAfterAuth = useCallback((href: string) => {
    router.replace(href);

    if (typeof window === "undefined") {
      return;
    }

    if (redirectTimeoutRef.current !== null) {
      window.clearTimeout(redirectTimeoutRef.current);
    }

    redirectTimeoutRef.current = window.setTimeout(() => {
      if (window.location.pathname === "/auth") {
        window.location.replace(href);
      }
    }, 700);
  }, [router]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  /* ── finalize session after auth ── */
  const finalizeSession = useCallback(async (user: User, provider: string | null): Promise<boolean> => {
    setBusy(true);
    try {
      const resolvedPhone  = user.phoneNumber?.trim() || phoneRef.current || readStoredPhone();
      const chosenPlan     = planRef.current || readStoredPlan();
      const chosenPaidTier = paidTierRef.current || readStoredPaidTier();

      const profile = await upsertUserProfile({ user, phone: resolvedPhone, provider });
      setUserUid(user.uid);

      if (profile.plan) {
        setSelectedPlan(profile.plan);
        setSelectedPaidTier(profile.paidPlanTier);
        if (profile.plan === "paid" && !profile.paidPlanTier && chosenPaidTier) {
          setStatus({ msg: copy.status.workspaceReady, type: "success" });
          navigateAfterAuth(`/choose-plan?tier=${chosenPaidTier}`);
          return true;
        }
        setStatus({ msg: copy.status.welcomeBack, type: "success" });
        clearDraft();
        navigateAfterAuth(profile.plan === "paid" && !profile.paidPlanTier ? "/choose-plan" : "/dashboard");
        return true;
      }

      if (chosenPlan === "paid") {
        setStatus({ msg: copy.status.workspaceReady, type: "success" });
        navigateAfterAuth(chosenPaidTier ? `/choose-plan?tier=${chosenPaidTier}` : "/choose-plan");
        return true;
      }

      await setUserPlan(user.uid, chosenPlan, resolvedPhone);
      clearDraft();
      setStatus({ msg: copy.status.workspaceReady, type: "success" });
      navigateAfterAuth("/dashboard");
      return true;
    } catch (error) {
      handledUidRef.current = null;
      setStatus({ msg: formatAuthErrorMessage(error, copy.status.signInFinishFailed), type: "error" });
      return false;
    } finally {
      setBusy(false);
    }
  }, [copy.status, navigateAfterAuth]);

  /* ── email link ── */
  const sendEmailLink = async () => {
    if (!email.trim()) { setStatus({ msg: copy.status.needEmail, type: "error" }); return; }
    setBusy(true);
    setStatus({ msg: copy.status.sendingLink });
    try {
      const actionCodeSettings = {
        url: typeof window !== "undefined" ? `${window.location.origin}/auth` : "/auth",
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      setLS(EMAIL_LINK_STORAGE, email.trim());
      setStatus({ msg: copy.status.linkSent, type: "success" });
      setStep1Done(true);
    } catch (error) {
      setStatus({ msg: formatAuthErrorMessage(error, copy.status.linkFailed), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  /* ── Google sign-in ── */
  const continueWithGoogle = async () => {
    setBusy(true);
    setStatus({ msg: copy.status.connectingGoogle });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setStep1Done(true);
      if (PHONE_OTP_ENABLED && !result.user.phoneNumber) {
        setStatus({ msg: copy.status.verifyPhoneToContinue, type: "info" });
      }
      // onAuthStateChanged handles the rest if phone already linked
    } catch (error) {
      handledUidRef.current = null;
      setStatus({ msg: formatAuthErrorMessage(error, copy.status.googleFailed), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  /* ── send OTP ── */
  const sendOtp = async () => {
    const normalized = normalizePhone(phoneRef.current || readStoredPhone());
    if (!normalized) { setStatus({ msg: copy.status.needPhone, type: "error" }); return; }
    if (!isValidPhone(normalized)) { setStatus({ msg: copy.status.invalidPhone, type: "error" }); return; }
    if (normalized !== phoneRef.current) { phoneRef.current = normalized; setPhone(normalized); }

    const user = auth.currentUser;
    if (!user) { setStatus({ msg: "Please sign in with email or Google first.", type: "error" }); return; }

    setBusy(true);
    setStatus({ msg: copy.status.sendingOtp });
    try {
      auth.languageCode = uiLanguage;
      clearRecaptcha();
      const verifier = new RecaptchaVerifier(auth, "send-otp-btn", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => { resetRecaptchaWidget(); setStatus({ msg: copy.status.verifyPhoneToContinue }); },
      });
      recaptchaVerifierRef.current = verifier;
      recaptchaWidgetIdRef.current = await verifier.render();
      const confirmation = await linkWithPhoneNumber(user, normalized, verifier);
      setOtpConfirmation(confirmation);
      setOtpSent(true);
      setStatus({ msg: copy.status.otpSent, type: "success" });
    } catch (error) {
      resetRecaptchaWidget();
      setStatus({ msg: formatAuthErrorMessage(error, copy.status.otpFailed), type: "error" });
    } finally {
      clearRecaptcha();
      setBusy(false);
    }
  };

  /* ── verify OTP ── */
  const verifyOtp = async () => {
    if (!otpConfirmation) { setStatus({ msg: copy.status.verifyPhoneToContinue, type: "error" }); return; }
    if (!otpCode.trim())  { setStatus({ msg: copy.status.needOtp, type: "error" }); return; }
    setBusy(true);
    setStatus({ msg: copy.status.verifyingOtp });
    try {
      const result      = await otpConfirmation.confirm(otpCode.trim());
      await result.user.reload();
      const resolvedUser = auth.currentUser ?? result.user;
      handledUidRef.current = resolvedUser.uid;
      resetOtpState();
      await finalizeSession(resolvedUser, "google");
    } catch (error) {
      handledUidRef.current = null;
      setStatus({ msg: formatAuthErrorMessage(error, copy.status.otpVerifyFailed), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  /* ── email link handler + auth state ── */
  useEffect(() => {
    const handleExistingLink = async () => {
      if (
        typeof window === "undefined" ||
        emailLinkInProgressRef.current ||
        !isSignInWithEmailLink(auth, window.location.href)
      ) {
        return;
      }

      const resolvedEmail = readLS(EMAIL_LINK_STORAGE);
      if (!resolvedEmail) { setStatus({ msg: copy.status.reconnectBrowser, type: "error" }); return; }

      emailLinkInProgressRef.current = true;
      setBusy(true);
      setStatus({ msg: copy.status.signingInEmail });

      try {
        const result = await signInWithEmailLink(auth, resolvedEmail, window.location.href);
        handledUidRef.current = result.user.uid;
        setStep1Done(true);

        window.history.replaceState(null, "", "/auth");
        emailLinkHandledUidRef.current = await finalizeSession(result.user, "email") ? result.user.uid : null;
      } catch (error) {
        emailLinkHandledUidRef.current = null;
        handledUidRef.current = null;
        setBusy(false);
        setStatus({ msg: formatAuthErrorMessage(error, copy.status.linkExpired), type: "error" });
      } finally {
        emailLinkInProgressRef.current = false;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUserUid("");
        handledUidRef.current = null;
        emailLinkHandledUidRef.current = null;
        resetOtpState();
        setStep1Done(false);
        return;
      }

      if (
        emailLinkInProgressRef.current ||
        emailLinkHandledUidRef.current === currentUser.uid
      ) {
        setUserUid(currentUser.uid);
        return;
      }

      setUserUid(currentUser.uid);
      if (!phoneRef.current && currentUser.phoneNumber) setPhone(currentUser.phoneNumber);

      const isGoogle = currentUser.providerData.some(p => p.providerId === "google.com");
      if (PHONE_OTP_ENABLED && isGoogle && !currentUser.phoneNumber) {
        setStep1Done(true);
        return;
      }
      if (currentUser.phoneNumber) resetOtpState();
      if (handledUidRef.current === currentUser.uid) return;
      handledUidRef.current = currentUser.uid;
      await finalizeSession(currentUser, isGoogle ? "google" : "email");
    });

    void handleExistingLink();
    return () => unsubscribe();
  }, [copy.status, finalizeSession, resetOtpState]);

  /* ── plan selection ── */
  const handlePlanSelection = async (plan: BillingPlan) => {
    setSelectedPlan(plan);
    if (plan === "free") { setSelectedPaidTier(null); paidTierRef.current = null; }
    persistDraft(phoneRef.current, plan, paidTierRef.current);

    if (plan === "paid") { router.push("/choose-plan"); return; }
    if (!userUid) { setStatus({ msg: copy.status.workspaceSelected(copy.freeWorkspace) }); return; }
    if (PHONE_OTP_ENABLED && isGooglePending) { setStatus({ msg: copy.status.completePhoneVerificationFirst, type: "info" }); return; }

    setBusy(true);
    setStatus({ msg: copy.status.creatingWorkspace(plan) });
    try {
      await setUserPlan(userUid, plan, auth.currentUser?.phoneNumber?.trim() || phoneRef.current || readStoredPhone());
      clearDraft();
      navigateAfterAuth("/dashboard");
    } catch (error) {
      setStatus({ msg: formatAuthErrorMessage(error, copy.status.workspaceSaveFailed), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const step1State: StepState = step1Done ? "done" : "active";
  const step2State: StepState = !step1Done ? "pending" : otpSent ? "active" : "active";

  return (
    <div className="site-page relative min-h-screen overflow-hidden px-4 py-10">
      <div className="relative mx-auto max-w-5xl">

        {/* header */}
        <header className="site-panel relative z-40 mb-8 flex flex-col gap-3 rounded-2xl border px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:flex-none">
            <AetherBrand href={`/${uiLanguage}`} onClick={() => setHeaderOpen(false)} priority />
            <button
              type="button"
              onClick={() => setHeaderOpen(v => !v)}
              className="site-button-secondary flex h-10 w-10 items-center justify-center rounded-full border md:hidden"
              aria-expanded={isHeaderOpen}
              aria-label={isHeaderOpen ? "Close menu" : "Open menu"}
            >
              <MobileHeaderToggle isOpen={isHeaderOpen} />
            </button>
          </div>
          <div className="hidden md:flex md:items-center md:gap-3">
            <SitePreferences className="shrink-0" />
            <Link href={`/${uiLanguage}`} className="site-button-secondary rounded-full border px-4 py-2 text-sm font-medium">
              {copy.backHome}
            </Link>
          </div>
          {isHeaderOpen && (
            <div className="site-mobile-menu absolute inset-x-4 top-[calc(100%+0.5rem)] z-30 rounded-2xl px-3 py-3 md:hidden">
              <SitePreferences className="w-full" />
              <Link
                href={`/${uiLanguage}`}
                className="site-button-secondary mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border text-sm font-medium"
                onClick={() => setHeaderOpen(false)}
              >
                {copy.backHome}
              </Link>
            </div>
          )}
        </header>

        {/* main grid */}
        <div className="grid gap-5 lg:grid-cols-[0.9fr,1.1fr]">

          {/* ── left panel ── */}
          <section className="site-panel flex flex-col gap-6 rounded-2xl border p-7 md:p-8">
            <div className="site-chip inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AI-powered workspace
            </div>

            <div>
              <h1 className="text-3xl font-medium leading-snug md:text-4xl">{copy.title}</h1>
              <p className="site-muted mt-3 text-sm leading-7">{copy.body}</p>
            </div>

            <ul className="flex flex-col gap-2.5">
              {copy.bullets.map((b) => (
                <li key={b} className="site-panel-soft flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  {b}
                </li>
              ))}
            </ul>

            {/* plan preview */}
            <div className="site-panel-soft mt-auto rounded-xl border p-4">
              <p className="site-muted mb-2 text-[11px] uppercase tracking-[0.13em]">{copy.selectedWorkspace}</p>
              <p className="text-lg font-medium">
                {selectedPlan === "paid" ? (paidTierInfo.title ?? copy.paidWorkspace) : copy.freeWorkspace}
              </p>
              <p className="site-muted mt-1 text-sm leading-5">
                {selectedPlan === "paid" ? (paidTierInfo.body ?? copy.paidWorkspaceBody) : copy.freeWorkspaceBody}
              </p>
              <span
                className="mt-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] tracking-wide"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--site-primary) 14%, transparent)",
                  color: "var(--site-primary)",
                }}
              >
                {selectedPlan === "paid" && paidTierInfo.label ? paidTierInfo.label : copy.activeChoice}
              </span>
            </div>
          </section>

          {/* ── right panel ── */}
          <section className="site-panel flex flex-col gap-4 rounded-2xl border p-6 md:p-7">
            <div>
              <p className="text-[11px] uppercase tracking-[0.13em] text-[var(--site-muted)]">{copy.welcomeEyebrow}</p>
              <h2 className="mt-1 text-2xl font-medium">{copy.welcomeTitle}</h2>
            </div>

            {/* ── STEP 1: sign in ── */}
            <StepBlock step={1} state={step1State} title="Sign in with email or Google">
              <Field label={copy.emailLabel} icon={<MailIcon />} hint={copy.emailHint}>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  placeholder={copy.emailPlaceholder}
                  className="site-input w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                />
              </Field>

              <Btn onClick={sendEmailLink} disabled={isBusy || step1Done}>
                <MailIcon /> {isBusy ? "…" : copy.sendLinkButton}
              </Btn>

              <Divider label={copy.emailDivider} />

              <Btn onClick={continueWithGoogle} disabled={isBusy || step1Done} variant="outline">
                <GoogleIcon /> {isBusy ? "…" : copy.googleButton}
              </Btn>
            </StepBlock>

            {PHONE_OTP_ENABLED ? (
              <StepBlock step={2} state={step2State} title="Verify your phone number">
                <Field label={copy.phoneLabel} icon={<PhoneIcon />} hint={copy.smsNotice}>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    type="tel"
                    placeholder={copy.phonePlaceholder}
                    className="site-input w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                  />
                </Field>

                <Btn id="send-otp-btn" onClick={sendOtp} disabled={isBusy || otpSent}>
                  <PhoneIcon /> {isBusy ? "…" : copy.sendOtpButton}
                </Btn>

                {/* OTP verify — reveals after send */}
                {otpSent && (
                  <>
                    <Divider label={copy.otpLabel} />
                    <Field label="6-digit code" icon={<LockIcon />}>
                      <input
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder={copy.otpPlaceholder}
                        className="site-input w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                      />
                    </Field>
                    <Btn onClick={verifyOtp} disabled={isBusy || !otpConfirmation}>
                      <LockIcon /> {isBusy ? "…" : copy.verifyOtpButton}
                    </Btn>
                  </>
                )}
              </StepBlock>
            ) : null}

            {/* status */}
            <StatusBar message={status.msg} type={status.type} />

            {/* workspace selector */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.13em] text-[var(--site-muted)]">{copy.chooseWorkspace}</p>
                <p className="text-[11px] text-[var(--site-muted)]">{copy.selectableBeforeSignin}</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {planCards.map(p => {
                  const active = selectedPlan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePlanSelection(p.id)}
                      disabled={isBusy}
                      className={`rounded-xl border p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "site-button-primary border-transparent text-white" : "border-[var(--site-border)] bg-[var(--site-surface-soft)] text-[var(--foreground)] hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface)]"}`}
                    >
                      <p className="text-sm font-medium">
                        {p.id === "paid" ? (paidTierInfo.title ?? copy.paidWorkspace) : copy.freeWorkspace}
                      </p>
                      <p className={`mt-1.5 text-xs leading-5 ${active ? "text-white/70" : "text-[var(--site-muted)]"}`}>
                        {p.id === "paid" ? (paidTierInfo.body ?? copy.paidWorkspaceBody) : copy.freeWorkspaceBody}
                      </p>
                      <p className={`mt-3 text-[11px] uppercase tracking-[0.12em] ${active ? "text-white/60" : "text-[var(--site-muted)]"}`}>
                        {active ? copy.selectedLabel : copy.chooseLabel}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* footer */}
        <footer className="site-panel mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-sm">
          <p className="text-[var(--site-muted)]">Secure access for multilingual blog workflows, SEO planning, and content operations.</p>
          <div className="text-right">
            <p className="font-medium">{footer.parent}</p>
            <p className="text-xs text-[var(--site-muted)]">{footer.rights}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<SiteLoader size="full" />}>
      <AuthPageContent />
    </Suspense>
  );
}

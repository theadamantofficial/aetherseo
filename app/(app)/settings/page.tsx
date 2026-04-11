"use client";

import { useRouter } from "next/navigation";
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import SiteLoader from "@/components/site-loader";
import { auth } from "@/lib/firebase";
import { resolveAppUiLanguage, type AppUiLanguage } from "@/lib/app-ui-language";
import { getPaidTierLabel, getUserProfile, type UserProfile } from "@/lib/firebase-data";

const settingsUiCopy: Record<
  AppUiLanguage,
  {
    loading: string;
    badge: string;
    title: string;
    body: string;
    workspacePreferences: string;
    workspacePreferencesBody: string;
    securityControls: string;
    securityControlsBody: string;
    email: string;
    phone: string;
    plan: string;
    provider: string;
    notAvailable: string;
    notProvided: string;
    unknown: string;
    free: string;
    paid: string;
    resetPassword: string;
    resetHint: string;
    resetSending: string;
    resetSent: string;
    resetUnavailable: string;
  }
> = {
  en: {
    loading: "Loading account settings...",
    badge: "Account controls",
    title: "Settings",
    body: "View your account details and manage security settings.",
    workspacePreferences: "Workspace Preferences",
    workspacePreferencesBody: "Manage locale, timezone, and interface defaults.",
    securityControls: "Security Controls",
    securityControlsBody: "Review provider, identity, and access control information.",
    email: "Email",
    phone: "Phone",
    plan: "Plan",
    provider: "Provider",
    notAvailable: "Not available",
    notProvided: "Not provided",
    unknown: "Unknown",
    free: "Free",
    paid: "Paid",
    resetPassword: "Send password reset link",
    resetHint: "Send a password reset email to the address on this account.",
    resetSending: "Sending password reset email...",
    resetSent: "Password reset email sent.",
    resetUnavailable: "Password reset link could not be sent for this account.",
  },
  hi: {
    loading: "Account settings load ho rahi hain...",
    badge: "Account controls",
    title: "Settings",
    body: "Apne account details dekho aur security settings manage karo.",
    workspacePreferences: "Workspace Preferences",
    workspacePreferencesBody: "Locale, timezone aur interface defaults manage karo.",
    securityControls: "Security Controls",
    securityControlsBody: "Provider, identity aur access control information dekho.",
    email: "Email",
    phone: "Phone",
    plan: "Plan",
    provider: "Provider",
    notAvailable: "Available nahi",
    notProvided: "Provide nahi kiya",
    unknown: "Unknown",
    free: "Free",
    paid: "Paid",
    resetPassword: "Password reset link bhejo",
    resetHint: "Is account ke email par password reset email bhejo.",
    resetSending: "Password reset email bheji ja rahi hai...",
    resetSent: "Password reset email bhej di gayi hai.",
    resetUnavailable: "Is account ke liye password reset link nahi bheja ja saka.",
  },
  fr: {
    loading: "Chargement des parametres du compte...",
    badge: "Controles du compte",
    title: "Parametres",
    body: "Consultez les details de votre compte et gerez les parametres de securite.",
    workspacePreferences: "Preferences du workspace",
    workspacePreferencesBody: "Gerez la langue, le fuseau horaire et les valeurs d'interface.",
    securityControls: "Controles de securite",
    securityControlsBody: "Consultez le fournisseur, l'identite et les informations d'acces.",
    email: "Email",
    phone: "Telephone",
    plan: "Plan",
    provider: "Fournisseur",
    notAvailable: "Non disponible",
    notProvided: "Non renseigne",
    unknown: "Inconnu",
    free: "Free",
    paid: "Paid",
    resetPassword: "Envoyer le lien de reinitialisation",
    resetHint: "Envoyez un email de reinitialisation au compte actuel.",
    resetSending: "Envoi de l'email de reinitialisation...",
    resetSent: "Email de reinitialisation envoye.",
    resetUnavailable: "Le lien de reinitialisation n'a pas pu etre envoye pour ce compte.",
  },
  de: {
    loading: "Kontoeinstellungen werden geladen...",
    badge: "Kontosteuerung",
    title: "Einstellungen",
    body: "Kontodaten einsehen und Sicherheitseinstellungen verwalten.",
    workspacePreferences: "Workspace-Einstellungen",
    workspacePreferencesBody: "Verwalte Sprache, Zeitzone und Interface-Standards.",
    securityControls: "Sicherheitsoptionen",
    securityControlsBody: "Pruefe Provider-, Identitaets- und Zugriffsinformationen.",
    email: "E-Mail",
    phone: "Telefon",
    plan: "Plan",
    provider: "Provider",
    notAvailable: "Nicht verfuegbar",
    notProvided: "Nicht angegeben",
    unknown: "Unbekannt",
    free: "Free",
    paid: "Paid",
    resetPassword: "Passwort-Reset-Link senden",
    resetHint: "Sende eine Passwort-Reset-Mail an die E-Mail dieses Kontos.",
    resetSending: "Passwort-Reset-Mail wird gesendet...",
    resetSent: "Passwort-Reset-Mail wurde gesendet.",
    resetUnavailable: "Der Passwort-Reset-Link konnte fuer dieses Konto nicht gesendet werden.",
  },
  ja: {
    loading: "アカウント設定を読み込み中...",
    badge: "アカウント管理",
    title: "設定",
    body: "アカウント情報の確認とセキュリティ設定の管理を行います。",
    workspacePreferences: "ワークスペース設定",
    workspacePreferencesBody: "言語、タイムゾーン、画面の既定値を管理します。",
    securityControls: "セキュリティ設定",
    securityControlsBody: "プロバイダー、本人情報、アクセス制御を確認します。",
    email: "メール",
    phone: "電話番号",
    plan: "プラン",
    provider: "プロバイダー",
    notAvailable: "未設定",
    notProvided: "未入力",
    unknown: "不明",
    free: "Free",
    paid: "Paid",
    resetPassword: "パスワード再設定リンクを送信",
    resetHint: "このアカウントのメールアドレスへ再設定メールを送信します。",
    resetSending: "パスワード再設定メールを送信中...",
    resetSent: "パスワード再設定メールを送信しました。",
    resetUnavailable: "このアカウントには再設定リンクを送信できませんでした。",
  },
  ko: {
    loading: "계정 설정을 불러오는 중...",
    badge: "계정 제어",
    title: "설정",
    body: "계정 정보를 확인하고 보안 설정을 관리합니다.",
    workspacePreferences: "워크스페이스 설정",
    workspacePreferencesBody: "언어, 시간대, 인터페이스 기본값을 관리합니다.",
    securityControls: "보안 제어",
    securityControlsBody: "제공자, 신원, 접근 제어 정보를 확인합니다.",
    email: "이메일",
    phone: "전화번호",
    plan: "플랜",
    provider: "제공자",
    notAvailable: "없음",
    notProvided: "입력되지 않음",
    unknown: "알 수 없음",
    free: "Free",
    paid: "Paid",
    resetPassword: "비밀번호 재설정 링크 보내기",
    resetHint: "이 계정의 이메일 주소로 비밀번호 재설정 메일을 보냅니다.",
    resetSending: "비밀번호 재설정 메일을 보내는 중...",
    resetSent: "비밀번호 재설정 메일을 보냈습니다.",
    resetUnavailable: "이 계정에는 비밀번호 재설정 링크를 보낼 수 없습니다.",
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const { language, uiLanguage } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetStatus, setResetStatus] = useState<{
    tone: "muted" | "error";
    text: string;
  } | null>(null);
  const activeLanguage = resolveAppUiLanguage(language, uiLanguage);
  const ui = settingsUiCopy[activeLanguage];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      try {
        const nextProfile = await getUserProfile(currentUser.uid).catch(() => null);
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
    return <SiteLoader size="lg" />;
  }

  const tierLabel = getPaidTierLabel(profile?.paidPlanTier);

  async function handlePasswordReset() {
    if (!profile?.email) {
      setResetStatus({ tone: "error", text: ui.resetUnavailable });
      return;
    }

    setResetStatus({ tone: "muted", text: ui.resetSending });

    try {
      auth.languageCode = activeLanguage;
      await sendPasswordResetEmail(auth, profile.email);
      setResetStatus({ tone: "muted", text: ui.resetSent });
    } catch {
      setResetStatus({ tone: "error", text: ui.resetUnavailable });
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--site-muted)]">
          {ui.badge}
        </p>
        <h1 className="mt-4 text-lg font-semibold">{ui.title}</h1>
        <p className="site-muted mt-3 max-w-2xl text-sm">{ui.body}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
          <h2 className="text-lg font-semibold">{ui.workspacePreferences}</h2>
          <p className="site-muted mt-2 text-sm">{ui.workspacePreferencesBody}</p>
          <div className="mt-4 divide-y divide-[var(--site-border)]">
            <div className="flex justify-between py-3">
              <span className="text-sm text-[var(--site-muted)]">{ui.email}</span>
              <span className="text-sm font-medium">{profile?.email || ui.notAvailable}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-sm text-[var(--site-muted)]">{ui.phone}</span>
              <span className="text-sm font-medium">{profile?.phone || ui.notProvided}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-sm text-[var(--site-muted)]">{ui.plan}</span>
              <span className="text-sm font-medium">{profile?.plan === "paid" ? tierLabel || ui.paid : ui.free}</span>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
          <h2 className="text-lg font-semibold">{ui.securityControls}</h2>
          <p className="site-muted mt-2 text-sm">{ui.securityControlsBody}</p>
          <div className="mt-4 divide-y divide-[var(--site-border)]">
            <div className="flex justify-between py-3">
              <span className="text-sm text-[var(--site-muted)]">{ui.provider}</span>
              <span className="text-sm font-medium">{profile?.provider || ui.unknown}</span>
            </div>
          </div>
          <div className="mt-4">
            {profile?.provider === "password" ? (
              <>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={!profile?.email}
                  className="site-button-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ui.resetPassword}
                </button>
                <p
                  className={`mt-3 text-xs ${
                    resetStatus?.tone === "error" ? "text-red-500" : "site-muted"
                  }`}
                >
                  {resetStatus?.text ?? ui.resetHint}
                </p>
              </>
            ) : (
              <p className="text-xs text-[var(--site-muted)]">
                {ui.resetUnavailable}
              </p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

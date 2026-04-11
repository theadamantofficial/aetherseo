"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { auth } from "@/lib/firebase";
import { resolveAppUiLanguage, type AppUiLanguage } from "@/lib/app-ui-language";
import {
  getAssistantAddonDefinitions,
  type AssistantAddonType,
} from "@/lib/assistant-addons";
import {
  getDashboardForUser,
  getUserProfile,
  saveAssistantRunForUser,
  type AssistantActionType,
  type AssistantRun,
  type BillingPlan,
  type UserProfile,
} from "@/lib/firebase-data";
import {
  ensureRazorpayCheckout,
  postAuthenticatedJson,
  type RazorpayOrderResponse,
} from "@/lib/razorpay-client";

type ActionConfig = {
  id: AssistantActionType;
  label: string;
  description: string;
  placeholder: string;
  urlLabel: string;
};

type StatusState = {
  tone: "muted" | "error";
  text: string;
};

const actionIds: AssistantActionType[] = [
  "blog-brief",
  "metadata",
  "keyword-cluster",
  "schema-faq",
  "fix-plan",
];

const assistantUiCopy: Record<
  AppUiLanguage,
  {
    badge: string;
    title: string;
    body: string;
    actionsLabel: string;
    languageLabel: string;
    latestModeLabel: string;
    workflowSelector: string;
    active: string;
    primaryInput: string;
    produceTitle: string;
    produceBody: string;
    bullets: [string, string, string];
    outputLanguage: string;
    outputLanguageBody: string;
    runPrefix: string;
    idleStatus: string;
    loadError: string;
    authRequired: string;
    inputRequired: string;
    generating: string;
    saved: string;
    latestResult: string;
    emptyTitle: string;
    emptyBody: string;
    noUrl: string;
    sectionsTitle: string;
    actions: Record<AssistantActionType, ActionConfig>;
  }
> = {
  en: {
    badge: "SEO execution workspace",
    title: "AI Assistant",
    body: "Run multiple SEO workflows from one place instead of dropping back into a single blog generator.",
    actionsLabel: "Actions",
    languageLabel: "Language",
    latestModeLabel: "Latest mode",
    workflowSelector: "Workflow selector",
    active: "Active",
    primaryInput: "Primary input",
    produceTitle: "What this action will produce",
    produceBody: "This action generates structured output you can reuse across the workspace.",
    bullets: [
      "AI-generated output, not static templates",
      "Saved back to your workspace history",
      "Reusable for blog, audit, and SEO execution",
    ],
    outputLanguage: "Output language",
    outputLanguageBody: "This output follows your current site language preference:",
    runPrefix: "Run",
    idleStatus: "Saved assistant runs appear in dashboard metrics and workspace history.",
    loadError: "Could not load your latest AI assistant result.",
    authRequired: "You must be signed in to use the AI assistant.",
    inputRequired: "Add a topic, issue, keyword, or page goal first.",
    generating: "Generating AI assistant output...",
    saved: "AI assistant output generated and saved to your workspace.",
    latestResult: "Latest result",
    emptyTitle: "No AI assistant result yet",
    emptyBody: "Choose an SEO action, add the topic or issue you want handled, and the assistant will generate a saved execution plan here.",
    noUrl: "No URL linked",
    sectionsTitle: "Generated sections",
    actions: {
      "blog-brief": {
        id: "blog-brief",
        label: "Blog brief",
        description: "Outline audience, search intent, structure, and CTA for a target topic.",
        placeholder: "Programmatic SEO for SaaS startups",
        urlLabel: "Optional target URL",
      },
      metadata: {
        id: "metadata",
        label: "Metadata pack",
        description: "Generate title tags, meta descriptions, H1 ideas, and SERP packaging.",
        placeholder: "Homepage for an AI SEO platform for startups",
        urlLabel: "Page URL",
      },
      "keyword-cluster": {
        id: "keyword-cluster",
        label: "Keyword cluster",
        description: "Map pillar topics, supporting keywords, and internal linking directions.",
        placeholder: "AI content optimization tools",
        urlLabel: "Optional reference URL",
      },
      "schema-faq": {
        id: "schema-faq",
        label: "Schema + FAQ",
        description: "Generate implementation-ready schema and FAQ ideas for a page or topic.",
        placeholder: "Pricing page for a SaaS SEO product",
        urlLabel: "Page URL",
      },
      "fix-plan": {
        id: "fix-plan",
        label: "Fix plan",
        description: "Turn audit findings into concrete rewrites, checks, and implementation tasks.",
        placeholder: "Revise the H1 to include the primary keyword and clarify search intent",
        urlLabel: "Audited URL",
      },
    },
  },
  hi: {
    badge: "SEO execution workspace",
    title: "AI Assistant",
    body: "Ek hi jagah se multiple SEO workflows chalao, sirf ek blog generator par wapas mat jao.",
    actionsLabel: "Actions",
    languageLabel: "Language",
    latestModeLabel: "Latest mode",
    workflowSelector: "Workflow selector",
    active: "Active",
    primaryInput: "Primary input",
    produceTitle: "Ye action kya produce karega",
    produceBody: "Ye action structured output generate karta hai jo workspace me reuse ho sakta hai.",
    bullets: [
      "AI-generated output, static templates nahi",
      "Workspace history me save hota hai",
      "Blog, audit aur SEO execution ke liye reusable",
    ],
    outputLanguage: "Output language",
    outputLanguageBody: "Ye output aapki current site language preference follow karta hai:",
    runPrefix: "Run",
    idleStatus: "Saved assistant runs dashboard metrics aur workspace history me dikhte hain.",
    loadError: "Latest AI assistant result load nahi ho paya.",
    authRequired: "AI assistant use karne ke liye sign in hona zaruri hai.",
    inputRequired: "Pehle topic, issue, keyword ya page goal add karo.",
    generating: "AI assistant output generate ho raha hai...",
    saved: "AI assistant output generate ho gaya aur workspace me save ho gaya.",
    latestResult: "Latest result",
    emptyTitle: "Abhi tak koi AI assistant result nahi hai",
    emptyBody: "SEO action chuno, topic ya issue do, aur assistant yahan saved execution plan bana dega.",
    noUrl: "Koi URL linked nahi hai",
    sectionsTitle: "Generated sections",
    actions: {
      "blog-brief": {
        id: "blog-brief",
        label: "Blog brief",
        description: "Target topic ke liye audience, search intent, structure aur CTA outline karo.",
        placeholder: "SaaS startups ke liye programmatic SEO",
        urlLabel: "Optional target URL",
      },
      metadata: {
        id: "metadata",
        label: "Metadata pack",
        description: "Title tags, meta descriptions, H1 ideas aur SERP packaging generate karo.",
        placeholder: "AI SEO platform startup homepage",
        urlLabel: "Page URL",
      },
      "keyword-cluster": {
        id: "keyword-cluster",
        label: "Keyword cluster",
        description: "Pillar topics, supporting keywords aur internal linking directions map karo.",
        placeholder: "AI content optimization tools",
        urlLabel: "Optional reference URL",
      },
      "schema-faq": {
        id: "schema-faq",
        label: "Schema + FAQ",
        description: "Page ya topic ke liye implementation-ready schema aur FAQ ideas banao.",
        placeholder: "SaaS SEO product pricing page",
        urlLabel: "Page URL",
      },
      "fix-plan": {
        id: "fix-plan",
        label: "Fix plan",
        description: "Audit findings ko concrete rewrites, checks aur implementation tasks me badlo.",
        placeholder: "H1 ko primary keyword ke saath revise karo aur search intent clear karo",
        urlLabel: "Audited URL",
      },
    },
  },
  fr: {
    badge: "Workspace d'execution SEO",
    title: "Assistant IA",
    body: "Executez plusieurs workflows SEO depuis un seul endroit au lieu de revenir a un simple generateur de blog.",
    actionsLabel: "Actions",
    languageLabel: "Langue",
    latestModeLabel: "Dernier mode",
    workflowSelector: "Selection du workflow",
    active: "Actif",
    primaryInput: "Entree principale",
    produceTitle: "Ce que cette action va produire",
    produceBody: "Cette action genere une sortie structuree reutilisable dans le workspace.",
    bullets: [
      "Sortie generee par IA, pas des modeles statiques",
      "Enregistree dans l'historique du workspace",
      "Reutilisable pour blog, audit et execution SEO",
    ],
    outputLanguage: "Langue de sortie",
    outputLanguageBody: "Cette sortie suit votre preference de langue actuelle du site :",
    runPrefix: "Lancer",
    idleStatus: "Les executions enregistrees apparaissent dans les metriques et l'historique.",
    loadError: "Impossible de charger le dernier resultat de l'assistant IA.",
    authRequired: "Vous devez etre connecte pour utiliser l'assistant IA.",
    inputRequired: "Ajoutez d'abord un sujet, probleme, mot-cle ou objectif de page.",
    generating: "Generation de la sortie de l'assistant IA...",
    saved: "La sortie de l'assistant IA a ete generee et enregistree.",
    latestResult: "Dernier resultat",
    emptyTitle: "Aucun resultat d'assistant IA pour le moment",
    emptyBody: "Choisissez une action SEO, ajoutez le sujet ou le probleme a traiter, et l'assistant generera ici un plan enregistre.",
    noUrl: "Aucune URL liee",
    sectionsTitle: "Sections generees",
    actions: {
      "blog-brief": {
        id: "blog-brief",
        label: "Brief blog",
        description: "Definissez audience, intention de recherche, structure et CTA pour un sujet cible.",
        placeholder: "SEO programmatique pour startups SaaS",
        urlLabel: "URL cible optionnelle",
      },
      metadata: {
        id: "metadata",
        label: "Pack metadata",
        description: "Generez titres, meta descriptions, idees H1 et habillage SERP.",
        placeholder: "Homepage d'une plateforme SEO IA pour startups",
        urlLabel: "URL de la page",
      },
      "keyword-cluster": {
        id: "keyword-cluster",
        label: "Cluster de mots-cles",
        description: "Cartographiez sujets piliers, mots-cles de soutien et directions de maillage interne.",
        placeholder: "Outils d'optimisation de contenu IA",
        urlLabel: "URL de reference optionnelle",
      },
      "schema-faq": {
        id: "schema-faq",
        label: "Schema + FAQ",
        description: "Generez schema et idees FAQ pretes a implementer.",
        placeholder: "Page de tarification d'un produit SaaS SEO",
        urlLabel: "URL de la page",
      },
      "fix-plan": {
        id: "fix-plan",
        label: "Plan de correction",
        description: "Transformez les constats d'audit en re-ecritures, verifications et taches concretes.",
        placeholder: "Reviser le H1 pour inclure le mot-cle principal et clarifier l'intention",
        urlLabel: "URL auditee",
      },
    },
  },
  de: {
    badge: "SEO-Workspace",
    title: "AI Assistant",
    body: "Fuehre mehrere SEO-Workflows an einem Ort aus, statt nur auf einen Blog-Generator zurueckzufallen.",
    actionsLabel: "Aktionen",
    languageLabel: "Sprache",
    latestModeLabel: "Letzter Modus",
    workflowSelector: "Workflow-Auswahl",
    active: "Aktiv",
    primaryInput: "Haupteingabe",
    produceTitle: "Was diese Aktion erzeugt",
    produceBody: "Diese Aktion erzeugt strukturierte Ausgaben fuer die weitere Nutzung im Workspace.",
    bullets: [
      "AI-generierte Ausgabe statt statischer Vorlagen",
      "Wird im Workspace-Verlauf gespeichert",
      "Wiederverwendbar fuer Blog, Audit und SEO-Ausfuehrung",
    ],
    outputLanguage: "Ausgabesprache",
    outputLanguageBody: "Diese Ausgabe folgt deiner aktuellen Website-Sprachpraeferenz:",
    runPrefix: "Starten",
    idleStatus: "Gespeicherte Assistant-Runs erscheinen in Dashboard-Metriken und Verlauf.",
    loadError: "Das letzte AI-Assistant-Ergebnis konnte nicht geladen werden.",
    authRequired: "Du musst angemeldet sein, um den AI Assistant zu nutzen.",
    inputRequired: "Fuege zuerst Thema, Problem, Keyword oder Seitenziel hinzu.",
    generating: "AI-Assistant-Ausgabe wird erzeugt...",
    saved: "Die AI-Assistant-Ausgabe wurde erzeugt und im Workspace gespeichert.",
    latestResult: "Letztes Ergebnis",
    emptyTitle: "Noch kein AI-Assistant-Ergebnis",
    emptyBody: "Waehle eine SEO-Aktion, gib Thema oder Problem ein und der Assistant erzeugt hier einen gespeicherten Plan.",
    noUrl: "Keine URL verknuepft",
    sectionsTitle: "Generierte Abschnitte",
    actions: {
      "blog-brief": {
        id: "blog-brief",
        label: "Blog-Briefing",
        description: "Definiere Zielgruppe, Suchintention, Struktur und CTA fuer ein Thema.",
        placeholder: "Programmatic SEO fuer SaaS-Startups",
        urlLabel: "Optionale Ziel-URL",
      },
      metadata: {
        id: "metadata",
        label: "Metadata-Paket",
        description: "Erzeuge Title-Tags, Meta-Descriptions, H1-Ideen und SERP-Verpackung.",
        placeholder: "Homepage einer AI-SEO-Plattform fuer Startups",
        urlLabel: "Seiten-URL",
      },
      "keyword-cluster": {
        id: "keyword-cluster",
        label: "Keyword-Cluster",
        description: "Ordne Hauptthemen, Supporting-Keywords und interne Verlinkung.",
        placeholder: "AI Content Optimization Tools",
        urlLabel: "Optionale Referenz-URL",
      },
      "schema-faq": {
        id: "schema-faq",
        label: "Schema + FAQ",
        description: "Erzeuge umsetzbare Schema- und FAQ-Ideen fuer Seite oder Thema.",
        placeholder: "Pricing-Seite fuer ein SaaS-SEO-Produkt",
        urlLabel: "Seiten-URL",
      },
      "fix-plan": {
        id: "fix-plan",
        label: "Fix-Plan",
        description: "Verwandle Audit-Ergebnisse in konkrete Textaenderungen, Checks und Aufgaben.",
        placeholder: "H1 ueberarbeiten, Hauptkeyword aufnehmen und Suchintention klaeren",
        urlLabel: "Audit-URL",
      },
    },
  },
  ja: {
    badge: "SEO 実行ワークスペース",
    title: "AI アシスタント",
    body: "単なるブログ生成に戻るのではなく、複数の SEO ワークフローを一つの場所で実行します。",
    actionsLabel: "アクション数",
    languageLabel: "言語",
    latestModeLabel: "現在のモード",
    workflowSelector: "ワークフロー選択",
    active: "選択中",
    primaryInput: "主入力",
    produceTitle: "このアクションで生成される内容",
    produceBody: "このアクションはワークスペースで再利用できる構造化出力を生成します。",
    bullets: [
      "静的テンプレートではなく AI による出力",
      "ワークスペース履歴に保存",
      "ブログ、監査、SEO 実行で再利用可能",
    ],
    outputLanguage: "出力言語",
    outputLanguageBody: "この出力は現在のサイト言語設定に従います:",
    runPrefix: "実行",
    idleStatus: "保存された実行結果はダッシュボード指標と履歴に表示されます。",
    loadError: "最新の AI アシスタント結果を読み込めませんでした。",
    authRequired: "AI アシスタントを使うにはサインインが必要です。",
    inputRequired: "まずトピック、課題、キーワード、またはページ目標を入力してください。",
    generating: "AI アシスタント出力を生成中...",
    saved: "AI アシスタント出力が生成され、ワークスペースに保存されました。",
    latestResult: "最新結果",
    emptyTitle: "AI アシスタント結果はまだありません",
    emptyBody: "SEO アクションを選び、扱いたいトピックや課題を入力すると、ここに保存可能な実行プランが生成されます。",
    noUrl: "URL は未設定です",
    sectionsTitle: "生成セクション",
    actions: {
      "blog-brief": {
        id: "blog-brief",
        label: "ブログブリーフ",
        description: "対象トピックの読者、検索意図、構成、CTA を整理します。",
        placeholder: "SaaS スタートアップ向けのプログラマティック SEO",
        urlLabel: "任意の対象 URL",
      },
      metadata: {
        id: "metadata",
        label: "メタデータパック",
        description: "タイトルタグ、メタ説明、H1 案、SERP 用コピーを生成します。",
        placeholder: "スタートアップ向け AI SEO プラットフォームのホームページ",
        urlLabel: "ページ URL",
      },
      "keyword-cluster": {
        id: "keyword-cluster",
        label: "キーワードクラスタ",
        description: "ピラートピック、補助キーワード、内部リンク方針を整理します。",
        placeholder: "AI コンテンツ最適化ツール",
        urlLabel: "任意の参照 URL",
      },
      "schema-faq": {
        id: "schema-faq",
        label: "スキーマ + FAQ",
        description: "ページやトピック向けの実装可能なスキーマと FAQ 案を生成します。",
        placeholder: "SaaS SEO プロダクトの価格ページ",
        urlLabel: "ページ URL",
      },
      "fix-plan": {
        id: "fix-plan",
        label: "修正プラン",
        description: "監査結果を具体的な書き換え、確認項目、実装タスクに変換します。",
        placeholder: "主要キーワードを含むように H1 を修正し、検索意図を明確にする",
        urlLabel: "監査対象 URL",
      },
    },
  },
  ko: {
    badge: "SEO 실행 워크스페이스",
    title: "AI 도우미",
    body: "단순한 블로그 생성기로 돌아가지 않고 하나의 공간에서 여러 SEO 워크플로를 실행하세요.",
    actionsLabel: "작업 수",
    languageLabel: "언어",
    latestModeLabel: "현재 모드",
    workflowSelector: "워크플로 선택",
    active: "선택됨",
    primaryInput: "주요 입력",
    produceTitle: "이 작업이 생성하는 것",
    produceBody: "이 작업은 워크스페이스에서 재사용할 수 있는 구조화된 출력을 생성합니다.",
    bullets: [
      "정적 템플릿이 아닌 AI 생성 결과",
      "워크스페이스 기록에 저장",
      "블로그, 감사, SEO 실행에 재사용 가능",
    ],
    outputLanguage: "출력 언어",
    outputLanguageBody: "이 결과는 현재 사이트 언어 설정을 따릅니다:",
    runPrefix: "실행",
    idleStatus: "저장된 실행 결과는 대시보드 지표와 기록에 표시됩니다.",
    loadError: "최신 AI 도우미 결과를 불러오지 못했습니다.",
    authRequired: "AI 도우미를 사용하려면 로그인해야 합니다.",
    inputRequired: "먼저 주제, 문제, 키워드 또는 페이지 목표를 입력하세요.",
    generating: "AI 도우미 결과를 생성하는 중...",
    saved: "AI 도우미 결과가 생성되어 워크스페이스에 저장되었습니다.",
    latestResult: "최신 결과",
    emptyTitle: "아직 AI 도우미 결과가 없습니다",
    emptyBody: "SEO 작업을 선택하고 주제나 문제를 입력하면 저장 가능한 실행 계획이 여기 생성됩니다.",
    noUrl: "연결된 URL 없음",
    sectionsTitle: "생성된 섹션",
    actions: {
      "blog-brief": {
        id: "blog-brief",
        label: "블로그 브리프",
        description: "대상 주제의 독자, 검색 의도, 구조, CTA를 정리합니다.",
        placeholder: "SaaS 스타트업을 위한 프로그래매틱 SEO",
        urlLabel: "선택 대상 URL",
      },
      metadata: {
        id: "metadata",
        label: "메타데이터 팩",
        description: "타이틀 태그, 메타 설명, H1 아이디어, SERP 패키징을 생성합니다.",
        placeholder: "스타트업용 AI SEO 플랫폼 홈페이지",
        urlLabel: "페이지 URL",
      },
      "keyword-cluster": {
        id: "keyword-cluster",
        label: "키워드 클러스터",
        description: "핵심 주제, 보조 키워드, 내부 링크 방향을 정리합니다.",
        placeholder: "AI 콘텐츠 최적화 도구",
        urlLabel: "선택 참조 URL",
      },
      "schema-faq": {
        id: "schema-faq",
        label: "스키마 + FAQ",
        description: "페이지나 주제에 맞는 구현 가능한 스키마와 FAQ 아이디어를 생성합니다.",
        placeholder: "SaaS SEO 제품 가격 페이지",
        urlLabel: "페이지 URL",
      },
      "fix-plan": {
        id: "fix-plan",
        label: "수정 계획",
        description: "감사 결과를 구체적인 수정안, 점검 항목, 구현 작업으로 바꿉니다.",
        placeholder: "기본 키워드를 포함하도록 H1을 수정하고 검색 의도를 명확히 하기",
        urlLabel: "감사 URL",
      },
    },
  },
};

function clampPreview(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(maxLength - 3, 0)).trimEnd()}...`;
}

type AssistantRunDraft = Omit<AssistantRun, "id" | "createdAt"> &
  Partial<Pick<AssistantRun, "id" | "createdAt">>;

type AssistantApiResponse = {
  assistantRun?: AssistantRunDraft;
  creditsUsed?: {
    image?: number;
    prompt?: number;
  };
  ephemeralImageDataUrl?: string | null;
  error?: string;
  warnings?: string[];
};

const assistantAddonDefinitions = getAssistantAddonDefinitions();

const addonUi = {
  checkoutBody:
    "This is a one-time Razorpay payment for a single assistant add-on credit. The credit is added to your account immediately after verification.",
  checkoutTitle: "Assistant add-on checkout",
  copy: "Copy",
  copyDone: "Copied",
  downloadImage: "Download image",
  imageCreditLabel: "Image credits",
  imageHelper:
    "Generate one SEO-driven blog image per credit. The output includes alt text, a search-friendly filename, and a ready-to-download asset.",
  includeWithRun: "Include with this run",
  oneTimeCharge: "One-time charge",
  promptCreditLabel: "Prompt credits",
  promptHelper:
    "Generate one direct-use developer prompt pack per credit. The pack includes Conductor and Cursor prompts tailored to the assistant output.",
  purchaseCredit: "Buy credit",
  seoImage: "SEO image generation",
  toolsTitle: "Paid add-ons",
  toolsBody:
    "Unlock developer prompts and blog images as separate one-time purchases. Paid assistant access is still required for the run itself.",
  developerPromptPack: "Developer prompt pack",
  bestOutput: "Best output",
  alternative: "Alternative option",
  directUse: "Ready to use now",
  developerPrompts: "Developer-ready prompts",
  imageOutput: "SEO image output",
  implementationPlan: "Execution plan",
  sessionPreviewNote:
    "This image preview is available in the current session. Buy another credit when you want a fresh generated asset.",
  warnings: "Generation notes",
};

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="site-panel-soft flex items-center justify-between rounded-[1.25rem] border px-4 py-3 text-sm">
      <span className="site-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function AiAssistantPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, uiLanguage } = useLanguage();
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [action, setAction] = useState<AssistantActionType>("blog-brief");
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AssistantRun | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ephemeralImageDataUrl, setEphemeralImageDataUrl] = useState<string | null>(null);
  const [includePromptPack, setIncludePromptPack] = useState(false);
  const [includeSeoImageAsset, setIncludeSeoImageAsset] = useState(false);
  const [checkoutAddon, setCheckoutAddon] = useState<AssistantAddonType | null>(null);
  const [copiedItem, setCopiedItem] = useState("");
  const [isBusy, setBusy] = useState(false);
  const [isCheckoutBusy, setCheckoutBusy] = useState(false);
  const activeLanguage = resolveAppUiLanguage(language, uiLanguage);
  const ui = assistantUiCopy[activeLanguage];
  const activeAction = useMemo(() => ui.actions[action], [action, ui.actions]);
  const isAssistantUnlocked = plan === "paid";
  const checkoutDefinition = checkoutAddon ? assistantAddonDefinitions[checkoutAddon] : null;
  const promptCredits = profile?.assistantPromptCredits ?? 0;
  const imageCredits = profile?.assistantImageCredits ?? 0;
  const imagePreviewSrc = ephemeralImageDataUrl || result?.imageAsset?.imageUrl || null;
  const readyToUse = Array.isArray(result?.readyToUse) ? result.readyToUse : [];
  const resultSections = Array.isArray(result?.sections) ? result.sections : [];
  const alternativeSections = Array.isArray(result?.alternative?.sections)
    ? result.alternative.sections
    : [];
  const primaryInputPreview = clampPreview(input || result?.input || activeAction.placeholder, 120);
  const linkedUrl = result?.url || url || ui.noUrl;
  const summaryPreview = clampPreview(result?.summary ?? activeAction.description, 180);
  const emptyStateCards = [
    {
      label: ui.primaryInput,
      value: primaryInputPreview,
    },
    {
      label: addonUi.directUse,
      value: "Get a best-use output, an alternative version, and implementation-ready recommendations in one run.",
    },
    {
      label: addonUi.toolsTitle,
      value: `${addonUi.developerPromptPack}: ${assistantAddonDefinitions["developer-prompt-pack"].priceLabel}. ${addonUi.seoImage}: ${assistantAddonDefinitions["seo-image"].priceLabel}.`,
    },
  ];

  useEffect(() => {
    const queryAction = searchParams.get("action");
    const queryInput = searchParams.get("input");
    const queryUrl = searchParams.get("url");

    if (queryAction && actionIds.includes(queryAction as AssistantActionType)) {
      setAction(queryAction as AssistantActionType);
    }

    if (queryInput) {
      setInput(queryInput);
    }

    if (queryUrl) {
      setUrl(queryUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      setUid(currentUser.uid);

      try {
        const [dashboard, nextProfile] = await Promise.all([
          getDashboardForUser(currentUser.uid),
          getUserProfile(currentUser.uid),
        ]);

        setPlan(dashboard.plan);
        setProfile(nextProfile);

        if (dashboard.plan === "free") {
          router.replace("/billing?upgrade=assistant-locked");
          return;
        }

        setResult(dashboard.assistantRuns[0] ?? null);
        setWarnings([]);
        setEphemeralImageDataUrl(null);
      } catch {
        setStatus({ tone: "error", text: ui.loadError });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, ui.loadError]);

  async function copyText(key: string, text: string) {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(key);
      setStatus({ tone: "muted", text: `${addonUi.copyDone}: ${key}` });
      window.setTimeout(() => {
        setCopiedItem((current) => (current === key ? "" : current));
      }, 1600);
    } catch {
      setStatus({ tone: "error", text: "Could not copy to clipboard." });
    }
  }

  async function handleConfirmAddonCheckout() {
    if (!checkoutAddon) {
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatus({ tone: "error", text: ui.authRequired });
      return;
    }

    const addonType = checkoutAddon;
    const addonDefinition = assistantAddonDefinitions[addonType];

    setCheckoutBusy(true);

    try {
      await ensureRazorpayCheckout();
    } catch (error) {
      setCheckoutBusy(false);
      setStatus({
        tone: "error",
        text: formatAuthErrorMessage(error, "Razorpay checkout could not be loaded."),
      });
      return;
    }

    setStatus({ tone: "muted", text: "Preparing Razorpay checkout..." });

    try {
      const orderToken = await currentUser.getIdToken();
      const order = await postAuthenticatedJson<RazorpayOrderResponse>(
        "/api/assistant-addons/order",
        orderToken,
        {
          addonType,
          phone: profile?.phone ?? "",
        },
      );

      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const razorpay = new RazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Aether SEO",
        description: `${order.title} one-time credit`,
        order_id: order.orderId,
        prefill: {
          contact: profile?.phone || undefined,
          email: currentUser.email ?? undefined,
          name: currentUser.displayName ?? undefined,
        },
        notes: {
          addonType,
          source: "ai-assistant",
          unitPriceUsd: addonDefinition.priceLabel,
        },
        theme: {
          color: "#111111",
        },
        modal: {
          ondismiss: () => {
            setCheckoutBusy(false);
            setStatus({ tone: "muted", text: "Payment was cancelled before completion." });
          },
        },
        handler: async (response) => {
          setStatus({ tone: "muted", text: "Verifying Razorpay payment..." });

          try {
            const verificationToken = await currentUser.getIdToken();
            await postAuthenticatedJson<{ ok: true }>(
              "/api/assistant-addons/verify",
              verificationToken,
              {
                addonType,
                ...response,
              },
            );

            setProfile((current) =>
              current
                ? {
                    ...current,
                    assistantPromptCredits:
                      current.assistantPromptCredits +
                      (addonType === "developer-prompt-pack" ? 1 : 0),
                    assistantImageCredits:
                      current.assistantImageCredits + (addonType === "seo-image" ? 1 : 0),
                  }
                : current,
            );
            setCheckoutAddon(null);
            setCheckoutBusy(false);
            setStatus({
              tone: "muted",
              text: `${addonDefinition.title} credit added to your account.`,
            });

            if (addonType === "developer-prompt-pack") {
              setIncludePromptPack(true);
            } else {
              setIncludeSeoImageAsset(true);
            }
          } catch (error) {
            setCheckoutBusy(false);
            setStatus({
              tone: "error",
              text: formatAuthErrorMessage(error, "Could not verify the add-on payment."),
            });
          }
        },
      });

      razorpay.open();
    } catch (error) {
      setCheckoutBusy(false);
      setStatus({
        tone: "error",
        text: formatAuthErrorMessage(error, "Could not create the add-on order."),
      });
    }
  }

  async function handleGenerate() {
    if (!uid) {
      setStatus({ tone: "error", text: ui.authRequired });
      return;
    }

    if (!isAssistantUnlocked) {
      router.replace("/billing?upgrade=assistant-locked");
      return;
    }

    if (!input.trim()) {
      setStatus({ tone: "error", text: ui.inputRequired });
      return;
    }

    if (includePromptPack && promptCredits < 1) {
      setStatus({
        tone: "error",
        text: "Developer prompt credits are empty. Buy a $2 prompt pack before adding it to this run.",
      });
      return;
    }

    if (includeSeoImageAsset && imageCredits < 1) {
      setStatus({
        tone: "error",
        text: "SEO image credits are empty. Buy a $5 image credit before adding it to this run.",
      });
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatus({ tone: "error", text: ui.authRequired });
      return;
    }

    setBusy(true);
    setWarnings([]);
    setStatus({ tone: "muted", text: ui.generating });

    try {
      const token = await currentUser.getIdToken();
      const payload = await postAuthenticatedJson<AssistantApiResponse>(
        "/api/ai-assistant",
        token,
        {
          action,
          includePromptPack,
          includeSeoImageAsset,
          input,
          language: activeLanguage,
          url,
        },
      );

      if (!payload.assistantRun) {
        throw new Error("AI assistant returned an empty result.");
      }

      setEphemeralImageDataUrl(payload.ephemeralImageDataUrl ?? null);
      setWarnings(payload.warnings ?? []);

      const nextDashboard = await saveAssistantRunForUser(uid, payload.assistantRun);
      const nextResult = nextDashboard.assistantRuns[0] ?? null;

      setPlan(nextDashboard.plan);
      setResult(nextResult);
      setProfile((current) =>
        current
          ? {
              ...current,
              assistantPromptCredits: Math.max(
                0,
                current.assistantPromptCredits - (payload.creditsUsed?.prompt ?? 0),
              ),
              assistantImageCredits: Math.max(
                0,
                current.assistantImageCredits - (payload.creditsUsed?.image ?? 0),
              ),
            }
          : current,
      );

      if ((payload.creditsUsed?.prompt ?? 0) > 0) {
        setIncludePromptPack(false);
      }

      if ((payload.creditsUsed?.image ?? 0) > 0) {
        setIncludeSeoImageAsset(false);
      }

      setStatus({
        tone: "muted",
        text: payload.warnings?.length ? `${ui.saved} ${payload.warnings[0]}` : ui.saved,
      });

      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "AI assistant is available on paid plans only. Upgrade to continue."
      ) {
        router.replace("/billing?upgrade=assistant-locked");
        return;
      }

      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not generate the AI assistant result.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {checkoutDefinition ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#081120]/72 p-4 backdrop-blur-sm">
          <div className="site-panel-hero w-full max-w-xl rounded-[2rem] border p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="site-chip inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em]">
                  {checkoutDefinition.title}
                </p>
                <h2 className="mt-4 text-3xl font-semibold">{addonUi.checkoutTitle}</h2>
                <p className="site-muted mt-3 text-sm leading-6">{addonUi.checkoutBody}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isCheckoutBusy) {
                    setCheckoutAddon(null);
                  }
                }}
                className="site-button-secondary rounded-full px-4 py-2 text-sm font-medium"
                disabled={isCheckoutBusy}
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <SummaryRow label={addonUi.oneTimeCharge} value={checkoutDefinition.priceLabel} />
              <SummaryRow label="Credit added" value="1 use" />
              <SummaryRow label="Add-on" value={checkoutDefinition.title} />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckoutAddon(null)}
                className="site-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
                disabled={isCheckoutBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmAddonCheckout()}
                className="site-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isCheckoutBusy}
              >
                Continue to payment
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="site-panel-hero site-animate-rise overflow-hidden rounded-[2rem] border p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="site-chip inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]">
              {ui.badge}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{ui.title}</h1>
            <p className="site-muted mt-3 max-w-2xl text-sm leading-7">{ui.body}</p>
          </div>

          <div className="grid w-full gap-3 text-sm sm:grid-cols-2 xl:w-[26rem]">
            <div className="site-panel-soft rounded-2xl border px-4 py-4">
              <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{addonUi.promptCreditLabel}</p>
              <p className="mt-3 text-3xl font-semibold">{promptCredits}</p>
              <p className="site-muted mt-2 text-sm">Conductor and Cursor prompt packs.</p>
            </div>
            <div className="site-panel-soft rounded-2xl border px-4 py-4">
              <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{addonUi.imageCreditLabel}</p>
              <p className="mt-3 text-3xl font-semibold">{imageCredits}</p>
              <p className="site-muted mt-2 text-sm">SEO-driven blog image generations.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-24">
          <section className="site-panel site-animate-rise rounded-[1.8rem] border p-6">
            <p className="site-chip inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]">
              {ui.workflowSelector}
            </p>

            <div className="mt-6 grid gap-3">
              {actionIds.map((id) => {
                const item = ui.actions[id];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAction(item.id)}
                    className={`rounded-2xl border p-4 text-left ${
                      action === item.id ? "site-button-primary" : "site-panel-soft"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-semibold">{item.label}</p>
                      {action === item.id ? (
                        <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
                          {ui.active}
                        </span>
                      ) : null}
                    </div>
                    <p className={`mt-2 text-sm leading-6 ${action === item.id ? "text-white/80" : "site-muted"}`}>
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="site-muted mb-2 text-xs uppercase tracking-[0.18em]">{ui.primaryInput}</p>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={activeAction.placeholder}
                  rows={5}
                  className="site-input w-full rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              <div>
                <p className="site-muted mb-2 text-xs uppercase tracking-[0.18em]">{activeAction.urlLabel}</p>
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com/page"
                  className="site-input w-full rounded-xl px-4 py-3 outline-none"
                />
              </div>

              <div className="site-panel-soft rounded-2xl border p-4">
                <p className="text-sm font-semibold">{ui.produceTitle}</p>
                <p className="site-muted mt-2 text-sm leading-7">{ui.produceBody}</p>
                <ul className="site-muted mt-3 space-y-1 text-sm">
                  <li>• {ui.bullets[0]}</li>
                  <li>• {ui.bullets[1]}</li>
                  <li>• {ui.bullets[2]}</li>
                </ul>
              </div>

              <div className="site-panel-soft rounded-2xl border p-4">
                <p className="text-sm font-semibold">{ui.outputLanguage}</p>
                <p className="site-muted mt-2 text-sm leading-7">
                  {ui.outputLanguageBody} <span className="font-medium uppercase">{activeLanguage}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isBusy || !isAssistantUnlocked}
                className="site-button-primary w-full rounded-xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isBusy ? ui.generating : `${ui.runPrefix} ${activeAction.label}`}
              </button>

              <p className={`text-xs leading-6 ${status?.tone === "error" ? "text-red-500" : "site-muted"}`}>
                {status?.text ??
                  (isAssistantUnlocked
                    ? ui.idleStatus
                    : "AI assistant unlocks on paid plans. Upgrade to continue.")}
              </p>
            </div>
          </section>

          <section className="site-panel site-animate-rise rounded-[1.8rem] border p-6" style={{ ["--site-delay" as string]: "90ms" }}>
            <p className="site-chip inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]">
              {addonUi.toolsTitle}
            </p>
            <p className="site-muted mt-4 text-sm leading-7">{addonUi.toolsBody}</p>

            <div className="mt-5 grid gap-4">
              {([
                {
                  checked: includePromptPack,
                  credits: promptCredits,
                  definition: assistantAddonDefinitions["developer-prompt-pack"],
                  helper: addonUi.promptHelper,
                  key: "developer-prompt-pack" as const,
                  label: addonUi.promptCreditLabel,
                  setChecked: setIncludePromptPack,
                  title: addonUi.developerPromptPack,
                },
                {
                  checked: includeSeoImageAsset,
                  credits: imageCredits,
                  definition: assistantAddonDefinitions["seo-image"],
                  helper: addonUi.imageHelper,
                  key: "seo-image" as const,
                  label: addonUi.imageCreditLabel,
                  setChecked: setIncludeSeoImageAsset,
                  title: addonUi.seoImage,
                },
              ]).map((addon) => (
                <article key={addon.key} className="site-panel-soft rounded-2xl border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold">{addon.title}</p>
                      <p className="site-muted mt-2 text-sm leading-7">{addon.helper}</p>
                    </div>
                    <span className="site-button-secondary rounded-full px-3 py-1 text-xs font-semibold">
                      {addon.definition.priceLabel}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{addon.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{addon.credits}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutAddon(addon.key)}
                      className="site-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                    >
                      {addonUi.purchaseCredit}
                    </button>
                  </div>

                  <label className={`mt-4 flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm ${addon.credits > 0 ? "bg-white/5" : "opacity-60"}`}>
                    <input
                      type="checkbox"
                      checked={addon.checked}
                      onChange={(event) => addon.setChecked(event.target.checked)}
                      disabled={addon.credits < 1}
                      className="h-4 w-4 accent-[var(--site-primary)]"
                    />
                    <span>{addonUi.includeWithRun}</span>
                  </label>
                </article>
              ))}
            </div>
          </section>
        </aside>

        <div className="space-y-6" ref={resultRef}>
          <section
            className="site-panel-hero site-animate-rise overflow-hidden rounded-[2rem] border p-8"
            style={{ ["--site-delay" as string]: "80ms" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <p className="site-chip inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]">
                  {result ? ui.latestResult : ui.latestModeLabel}
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
                  {result?.title ?? activeAction.label}
                </h2>
                <p className="site-muted mt-3 text-sm leading-7">
                  {result?.summary ?? `${activeAction.description} ${ui.emptyBody}`}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[22rem]">
                <div className="site-panel-soft rounded-2xl border px-4 py-4">
                  <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{ui.outputLanguage}</p>
                  <p className="mt-3 text-2xl font-semibold uppercase">{activeLanguage}</p>
                  <p className="site-muted mt-2 text-sm">{linkedUrl}</p>
                </div>
                <div className="site-panel-soft rounded-2xl border px-4 py-4">
                  <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{ui.sectionsTitle}</p>
                  <p className="mt-3 text-2xl font-semibold">{resultSections.length || 3}</p>
                  <p className="site-muted mt-2 text-sm">{summaryPreview}</p>
                </div>
              </div>
            </div>

            {warnings.length ? (
              <div className="site-panel-soft mt-6 rounded-2xl border p-4">
                <p className="text-sm font-semibold">{addonUi.warnings}</p>
                <ul className="site-muted mt-3 space-y-2 text-sm leading-6">
                  {warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result ? (
              <div className="mt-8 grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
                <div className="space-y-6">
                  <article className="site-panel-soft rounded-[1.7rem] border p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                          {addonUi.directUse}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold">{addonUi.bestOutput}</h3>
                      </div>
                      <span className="site-button-secondary rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
                        {ui.actions[result.action]?.label ?? result.action}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {(readyToUse.length ? readyToUse : [
                        {
                          label: addonUi.bestOutput,
                          content: summaryPreview,
                          bullets: [],
                        },
                      ]).map((item, index) => (
                        <article key={`${item.label}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                            {index === 0 ? addonUi.bestOutput : addonUi.alternative}
                          </p>
                          <h4 className="mt-2 text-lg font-semibold">{item.label}</h4>
                          <p className="site-muted mt-3 text-sm leading-7">{item.content}</p>
                          {item.bullets.length ? (
                            <ul className="mt-4 grid gap-2 text-sm">
                              {item.bullets.map((bullet) => (
                                <li key={bullet} className="rounded-xl border border-white/10 px-3 py-2 leading-6">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className="site-panel-soft rounded-[1.7rem] border p-5">
                    <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                      {addonUi.implementationPlan}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">{ui.sectionsTitle}</h3>
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {(resultSections.length ? resultSections : []).map((section) => (
                        <article key={section.heading} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <h4 className="text-lg font-semibold">{section.heading}</h4>
                          <p className="site-muted mt-3 text-sm leading-7">{section.body}</p>
                          {section.bullets.length ? (
                            <ul className="mt-4 grid gap-2 text-sm">
                              {section.bullets.map((bullet) => (
                                <li key={bullet} className="rounded-xl border border-white/10 px-3 py-2 leading-6">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="space-y-6">
                  {result?.alternative ? (
                    <article className="site-panel-soft rounded-[1.7rem] border p-5">
                      <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                        {addonUi.alternative}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold">{result.alternative.title}</h3>
                      <p className="site-muted mt-3 text-sm leading-7">{result.alternative.summary}</p>
                      <div className="mt-4 grid gap-3">
                        {alternativeSections.map((section) => (
                          <div key={section.heading} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="font-semibold">{section.heading}</p>
                            <p className="site-muted mt-2 text-sm leading-7">{section.body}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ) : null}

                  {result?.promptPack ? (
                    <article className="site-panel-soft rounded-[1.7rem] border p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                            {addonUi.developerPrompts}
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold">{addonUi.developerPromptPack}</h3>
                        </div>
                        <span className="site-button-secondary rounded-full px-3 py-1 text-xs font-semibold">
                          $2 add-on
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4">
                        {([
                          { key: "Brief", value: result.promptPack.brief },
                          { key: "Conductor", value: result.promptPack.conductor },
                          { key: "Cursor", value: result.promptPack.cursor },
                        ]).map((entry) => (
                          <article key={entry.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-lg font-semibold">{entry.key}</p>
                              <button
                                type="button"
                                onClick={() => void copyText(entry.key, entry.value)}
                                className="site-button-secondary rounded-full px-3 py-1 text-xs font-semibold"
                              >
                                {copiedItem === entry.key ? addonUi.copyDone : addonUi.copy}
                              </button>
                            </div>
                            <p className="site-muted mt-3 text-sm leading-7 whitespace-pre-line">
                              {entry.value}
                            </p>
                          </article>
                        ))}
                      </div>
                    </article>
                  ) : null}

                  {result?.imageAsset ? (
                    <article className="site-panel-soft rounded-[1.7rem] border p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="site-muted text-[11px] uppercase tracking-[0.18em]">
                            {addonUi.imageOutput}
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold">{result.imageAsset.title}</h3>
                        </div>
                        <span className="site-button-secondary rounded-full px-3 py-1 text-xs font-semibold">
                          $5 add-on
                        </span>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0d152b]">
                        {imagePreviewSrc ? (
                          <div className="relative aspect-[16/10] w-full">
                            <Image
                              src={imagePreviewSrc}
                              alt={result.imageAsset.alt}
                              fill
                              sizes="(max-width: 768px) 100vw, 60vw"
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex min-h-[16rem] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 text-center text-sm text-white/70">
                            The image metadata is saved, but no preview is available yet.
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="site-muted text-[11px] uppercase tracking-[0.18em]">Alt text</p>
                          <p className="mt-2 text-sm leading-7">{result.imageAsset.alt}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="site-muted text-[11px] uppercase tracking-[0.18em]">File name</p>
                          <p className="mt-2 text-sm leading-7">{result.imageAsset.fileName}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold">Generation prompt</p>
                            <button
                              type="button"
                              onClick={() => void copyText("Image prompt", result.imageAsset?.prompt ?? "")}
                              className="site-button-secondary rounded-full px-3 py-1 text-xs font-semibold"
                            >
                              {copiedItem === "Image prompt" ? addonUi.copyDone : addonUi.copy}
                            </button>
                          </div>
                          <p className="site-muted mt-3 text-sm leading-7">{result.imageAsset.prompt}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {imagePreviewSrc ? (
                          <a
                            href={imagePreviewSrc}
                            download={result.imageAsset.fileName}
                            className="site-button-primary rounded-full px-4 py-2 text-sm font-semibold"
                          >
                            {addonUi.downloadImage}
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void copyText("Image alt text", result.imageAsset?.alt ?? "")}
                          className="site-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                        >
                          {copiedItem === "Image alt text" ? addonUi.copyDone : "Copy alt text"}
                        </button>
                      </div>

                      {!result.imageAsset.imageUrl && imagePreviewSrc ? (
                        <p className="site-muted mt-4 text-xs leading-6">{addonUi.sessionPreviewNote}</p>
                      ) : null}
                    </article>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-8 grid gap-5 lg:grid-cols-[1.08fr,0.92fr]">
                <article className="site-panel-soft relative overflow-hidden rounded-[1.8rem] border p-6">
                  <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:34px_34px]" />
                  <div className="relative min-h-[20rem]">
                    <div className="site-animate-glow absolute left-1/2 top-1/2 h-[7.5rem] w-[7.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-[radial-gradient(circle,_rgba(255,255,255,0.18),rgba(99,102,241,0.18)_42%,transparent_74%)]" />
                    <div className="absolute left-1/2 top-1/2 flex h-[7.5rem] w-[7.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center text-sm font-semibold">
                      {activeAction.label}
                    </div>

                    {emptyStateCards.map((card, index) => (
                      <div
                        key={card.label}
                        className={`site-panel-soft site-animate-float absolute max-w-[13rem] rounded-2xl border px-4 py-3 text-sm ${
                          index === 0
                            ? "left-4 top-4 sm:left-8 sm:top-8"
                            : index === 1
                              ? "right-4 top-10 sm:right-8 sm:top-12"
                              : "bottom-6 left-1/2 -translate-x-1/2"
                        }`}
                      >
                        <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{card.label}</p>
                        <p className="mt-2 leading-6">{card.value}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <div className="grid gap-4">
                  <article className="site-panel-soft rounded-[1.7rem] border p-5">
                    <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{ui.primaryInput}</p>
                    <p className="mt-2 text-lg font-semibold">{primaryInputPreview}</p>
                    <p className="site-muted mt-3 text-sm leading-7">
                      Start with a concrete topic, problem, audit issue, or target keyword so the output is directly usable.
                    </p>
                  </article>
                  <article className="site-panel-soft rounded-[1.7rem] border p-5">
                    <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{addonUi.developerPromptPack}</p>
                    <p className="mt-2 text-lg font-semibold">
                      {assistantAddonDefinitions["developer-prompt-pack"].priceLabel} one time
                    </p>
                    <p className="site-muted mt-3 text-sm leading-7">{addonUi.promptHelper}</p>
                  </article>
                  <article className="site-panel-soft rounded-[1.7rem] border p-5">
                    <p className="site-muted text-[11px] uppercase tracking-[0.18em]">{addonUi.seoImage}</p>
                    <p className="mt-2 text-lg font-semibold">
                      {assistantAddonDefinitions["seo-image"].priceLabel} one time
                    </p>
                    <p className="site-muted mt-3 text-sm leading-7">{addonUi.imageHelper}</p>
                  </article>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AiAssistantPage() {
  return (
    <Suspense fallback={<div className="min-h-[320px]" />}>
      <AiAssistantPageContent />
    </Suspense>
  );
}

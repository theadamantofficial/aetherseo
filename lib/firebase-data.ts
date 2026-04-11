"use client";

import {
  DocumentData,
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { firestore } from "./firebase";
import { PAID_PLAN_DEFINITIONS } from "./paid-plans";

export type BillingPlan = "free" | "paid";
export type PaidPlanTier = "starter" | "pro" | "agency";

type PaidPlanTierMeta = {
  label: string;
  priceInr: string;
  priceUsd: string;
  dashboardTitle: string;
  dashboardBody: string;
  usageMax: number;
  usageText: string;
  cards: DashboardCard[];
  health: DashboardCard[];
  recommendations: string[];
  activities: DashboardActivity[];
};

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone: string;
  plan: BillingPlan | null;
  paidPlanTier: PaidPlanTier | null;
  assistantPromptCredits: number;
  assistantImageCredits: number;
  provider: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
};

export type DashboardActivity = {
  title: string;
  type: "audit" | "blog" | "report" | "system" | string;
  date: string;
  status: "Running" | "Completed" | "Draft" | "Active" | string;
};

export type GeneratedBlog = {
  id: string;
  keyword: string;
  title: string;
  tone: string;
  length: string;
  language: string;
  metaDescription: string;
  previewMeta: string;
  paragraphs: string[];
  sectionTitle: string;
  sectionBody: string;
  bullets: string[];
  createdAt: string;
};

export type AuditIssue = {
  title: string;
  severity: "Critical" | "Warning" | "Good" | string;
  detail: string;
};

export type AuditRun = {
  id: string;
  url: string;
  score: number;
  summary: string;
  recommendations: string[];
  issues: AuditIssue[];
  createdAt: string;
};

export type AssistantActionType =
  | "blog-brief"
  | "metadata"
  | "keyword-cluster"
  | "schema-faq"
  | "fix-plan";

export type AssistantSection = {
  heading: string;
  body: string;
  bullets: string[];
};

export type AssistantReadyOutput = {
  label: string;
  content: string;
  bullets: string[];
};

export type AssistantAlternative = {
  title: string;
  summary: string;
  sections: AssistantSection[];
};

export type AssistantPromptPack = {
  brief: string;
  conductor: string;
  cursor: string;
};

export type AssistantImageAsset = {
  alt: string;
  fileName: string;
  imageUrl: string | null;
  prompt: string;
  title: string;
};

export type AssistantRun = {
  id: string;
  action: AssistantActionType;
  input: string;
  url: string;
  language: string;
  title: string;
  summary: string;
  sections: AssistantSection[];
  readyToUse: AssistantReadyOutput[];
  alternative: AssistantAlternative | null;
  promptPack: AssistantPromptPack | null;
  imageAsset: AssistantImageAsset | null;
  createdAt: string;
};

export type DashboardCard = {
  label: string;
  value: string;
  description: string;
  tone?: "default" | "good" | "warning" | string;
};

export type DashboardData = {
  uid: string;
  plan: BillingPlan;
  title: string;
  body: string;
  usage: {
    label: string;
    current: number;
    max: number;
    text: string;
  };
  cards: DashboardCard[];
  health: DashboardCard[];
  recommendations: string[];
  activities: DashboardActivity[];
  generatedBlogs: GeneratedBlog[];
  auditRuns: AuditRun[];
  assistantRuns: AssistantRun[];
  updatedAt?: Timestamp | null;
};

const USERS_COLLECTION = "users";
const DASHBOARD_COLLECTION = "dashboard_data";

const BILLING_PLAN_OPTIONS: BillingPlan[] = ["free", "paid"];
const PAID_PLAN_TIER_OPTIONS: PaidPlanTier[] = ["starter", "pro", "agency"];

const PAID_PLAN_TIER_META: Record<PaidPlanTier, PaidPlanTierMeta> = {
  starter: {
    label: "Starter",
    priceInr: PAID_PLAN_DEFINITIONS.starter.priceInr,
    priceUsd: PAID_PLAN_DEFINITIONS.starter.priceUsd,
    dashboardTitle: "Starter workspace dashboard",
    dashboardBody: "Entry paid access for individuals and freelancers with faster generation and clean exports.",
    usageMax: 50,
    usageText: "Starter keeps paid workflow speed with healthy headroom for focused monthly publishing.",
    cards: [
      { label: "Monthly blogs", value: "18 / 50", description: "Content generation usage this cycle" },
      { label: "Audits", value: "9 / 20", description: "Technical checks used this month" },
      { label: "Exports", value: "14", description: "Watermark-free deliverables shipped" },
    ],
    health: [
      { label: "Page speed", value: "91", description: "Stable performance", tone: "good" },
      { label: "Metadata gaps", value: "6", description: "Clean up remaining pages", tone: "warning" },
      { label: "Keyword coverage", value: "132", description: "Growing steadily", tone: "good" },
    ],
    recommendations: [
      "Use starter volume on your highest intent keyword clusters first",
      "Pair each blog batch with one site audit to keep metadata clean",
      "Export final drafts directly for client or freelancer handoff",
    ],
    activities: [
      { title: "Starter batch: comparison pages", type: "blog", date: "Nov 02, 2024", status: "Completed" },
      { title: "Site audit: homepage structure", type: "audit", date: "Nov 01, 2024", status: "Completed" },
      { title: "Export pack: onboarding sequence", type: "report", date: "Oct 31, 2024", status: "Active" },
    ],
  },
  pro: {
    label: "Pro",
    priceInr: PAID_PLAN_DEFINITIONS.pro.priceInr,
    priceUsd: PAID_PLAN_DEFINITIONS.pro.priceUsd,
    dashboardTitle: "Pro workspace dashboard",
    dashboardBody: "High-volume publishing with stronger SEO suggestions, history, export control, and priority AI access.",
    usageMax: 200,
    usageText: "Pro is built for serious operators managing sustained publishing and deeper optimization work.",
    cards: [
      { label: "Monthly blogs", value: "86 / 200", description: "High-volume publishing still under control" },
      { label: "Audits", value: "42 / 100", description: "Advanced audit allowance used" },
      { label: "History packs", value: "24", description: "Tracked exports and revision trails" },
    ],
    health: [
      { label: "Page speed", value: "96", description: "Excellent", tone: "good" },
      { label: "Backlinks", value: "1,482", description: "Authority is trending upward", tone: "good" },
      { label: "CTR gaps", value: "3", description: "Priority improvements remaining", tone: "warning" },
    ],
    recommendations: [
      "Use priority AI on conversion keywords first",
      "Export historical performance before large content refreshes",
      "Turn audit findings into new cluster briefs every week",
    ],
    activities: [
      { title: "Pro cluster: multilingual growth pages", type: "blog", date: "Nov 03, 2024", status: "Completed" },
      { title: "Audit: content decay analysis", type: "audit", date: "Nov 02, 2024", status: "Completed" },
      { title: "History export: quarterly SEO report", type: "report", date: "Nov 01, 2024", status: "Active" },
    ],
  },
  agency: {
    label: "Agency",
    priceInr: PAID_PLAN_DEFINITIONS.agency.priceInr,
    priceUsd: PAID_PLAN_DEFINITIONS.agency.priceUsd,
    dashboardTitle: "Agency workspace dashboard",
    dashboardBody: "Fair-usage scale for agencies and businesses with team workflows, API access, and automation-heavy operations.",
    usageMax: 999,
    usageText: "Agency operates on fair usage, team workflows, and large delivery volume across multiple clients.",
    cards: [
      { label: "Monthly blogs", value: "318 / fair", description: "Fair-usage publishing volume this cycle" },
      { label: "Audits", value: "148 / fair", description: "Domain checks running across client properties" },
      { label: "Team seats", value: "12", description: "Active operators in the workspace" },
    ],
    health: [
      { label: "Page speed", value: "98", description: "Excellent", tone: "good" },
      { label: "Client domains", value: "21", description: "Under active monitoring", tone: "good" },
      { label: "Automation queues", value: "4", description: "Need review", tone: "warning" },
    ],
    recommendations: [
      "Use API access for recurring client publishing flows",
      "Assign team review lanes by domain cluster",
      "Automate weekly audit exports for active retainers",
    ],
    activities: [
      { title: "Agency automation: weekly client runs", type: "system", date: "Nov 03, 2024", status: "Active" },
      { title: "Audit: multi-domain portfolio", type: "audit", date: "Nov 02, 2024", status: "Completed" },
      { title: "API export: publishing pipeline", type: "report", date: "Nov 01, 2024", status: "Completed" },
    ],
  },
};

function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "free" || value === "paid";
}

function isPaidPlanTier(value: unknown): value is PaidPlanTier {
  return value === "starter" || value === "pro" || value === "agency";
}

const BASE_DASHBOARDS: Record<BillingPlan, Omit<DashboardData, "uid" | "updatedAt">> = {
  free: {
    plan: "free",
    title: "Free workspace dashboard",
    body: "Your current SEO plan has capped access to keep you focused on high-quality setup tasks.",
    usage: {
      label: "Blogs generated",
      current: 2,
      max: 3,
      text: "Need more credits this cycle.",
    },
    cards: [
      { label: "Monthly usage", value: "2 / 3", description: "Blog draft allowance used" },
      { label: "Organic traffic", value: "7.4k", description: "+14.2% this month" },
      { label: "Top keywords", value: "96", description: "Visibility score +1.9%" },
    ],
    health: [
      { label: "Page speed", value: "89", description: "Mostly stable", tone: "good" },
      { label: "Technical debt", value: "8", description: "4 items need fixing", tone: "warning" },
      { label: "Dead links", value: "0", description: "No critical blocks", tone: "good" },
    ],
    recommendations: [
      "Enable robots coverage checks for your largest pages",
      "Add one blog topic with supporting internal links",
    ],
    activities: [
      { title: "Blog generated: Product Landing Keywords", type: "blog", date: "Oct 24, 2024", status: "Completed" },
      { title: "Website Audit: rankly.ai", type: "audit", date: "Oct 18, 2024", status: "Active" },
      { title: "Meta fixes: Campaign page", type: "system", date: "Oct 13, 2024", status: "Draft" },
    ],
    generatedBlogs: [],
    auditRuns: [],
    assistantRuns: [],
  },
  paid: {
    plan: "paid",
    title: "Paid workspace dashboard",
    body: "All free-level insights plus deeper recommendations and unlimited monthly runs.",
    usage: {
      label: "Monthly run count",
      current: 36,
      max: 250,
      text: "You have broad access with usage headroom.",
    },
    cards: [
      { label: "Traffic growth", value: "42.1%", description: "This month vs last month" },
      { label: "Generated artifacts", value: "58", description: "Blogs, audits and reports" },
      { label: "Conversion score", value: "A+", description: "Landing funnel quality score" },
    ],
    health: [
      { label: "Page speed", value: "97", description: "Excellent", tone: "good" },
      { label: "Backlinks", value: "1,340", description: "Healthy index growth", tone: "good" },
      { label: "Issues", value: "1", description: "Priority action remaining", tone: "warning" },
    ],
    recommendations: [
      "Enable scheduled weekly audits for core pages",
      "Generate a 90-day editorial calendar from ranking gaps",
      "Prioritize cluster pages with low CTR tags",
    ],
    activities: [
      { title: "Audit: Agency landing performance", type: "audit", date: "Oct 30, 2024", status: "Completed" },
      { title: "Blog generated: AI in Search", type: "blog", date: "Oct 29, 2024", status: "Completed" },
      { title: "Report pack: North America", type: "report", date: "Oct 27, 2024", status: "Active" },
    ],
    generatedBlogs: [],
    auditRuns: [],
    assistantRuns: [],
  },
};

export function getPaidTierMeta(tier: PaidPlanTier | null | undefined): PaidPlanTierMeta | null {
  return tier ? PAID_PLAN_TIER_META[tier] : null;
}

export function getPaidTierLabel(tier: PaidPlanTier | null | undefined): string | null {
  const meta = getPaidTierMeta(tier);
  return meta ? meta.label : null;
}

function sanitizeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function normalizeBillingPlan(value: unknown): BillingPlan {
  return isBillingPlan(value) ? value : "free";
}

function getDashboardTemplate(
  plan: BillingPlan,
  paidPlanTier: PaidPlanTier | null = null,
): Omit<DashboardData, "uid" | "updatedAt"> {
  const derivedState = buildDynamicDashboardState(plan, paidPlanTier, [], [], []);

  return {
    plan,
    title: derivedState.title,
    body: derivedState.body,
    usage: derivedState.usage,
    cards: derivedState.cards,
    health: derivedState.health,
    recommendations: derivedState.recommendations,
    activities: derivedState.activities,
    generatedBlogs: [],
    auditRuns: [],
    assistantRuns: [],
  };
}

export function isSupportedPlan(value: string): value is BillingPlan {
  return BILLING_PLAN_OPTIONS.includes(value as BillingPlan);
}

export function isSupportedPaidTier(value: string): value is PaidPlanTier {
  return PAID_PLAN_TIER_OPTIONS.includes(value as PaidPlanTier);
}

function cleanPhone(input: string): string {
  return input.trim();
}

function normalizeCreditCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function isAssistantActionType(value: unknown): value is AssistantActionType {
  return (
    value === "blog-brief" ||
    value === "metadata" ||
    value === "keyword-cluster" ||
    value === "schema-faq" ||
    value === "fix-plan"
  );
}

function normalizeAssistantSection(value: unknown): AssistantSection | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const section = value as { heading?: unknown; body?: unknown; bullets?: unknown };
  if (typeof section.heading !== "string" || typeof section.body !== "string") {
    return null;
  }

  return {
    heading: section.heading,
    body: section.body,
    bullets: sanitizeArray<string>(section.bullets, []).filter((bullet) => typeof bullet === "string"),
  };
}

function normalizeAssistantRun(value: unknown): AssistantRun | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const run = value as {
    action?: unknown;
    alternative?: unknown;
    createdAt?: unknown;
    id?: unknown;
    imageAsset?: unknown;
    input?: unknown;
    language?: unknown;
    promptPack?: unknown;
    readyToUse?: unknown;
    sections?: unknown;
    summary?: unknown;
    title?: unknown;
    url?: unknown;
  };

  if (
    typeof run.id !== "string" ||
    !isAssistantActionType(run.action) ||
    typeof run.input !== "string" ||
    typeof run.url !== "string" ||
    typeof run.language !== "string" ||
    typeof run.title !== "string" ||
    typeof run.summary !== "string" ||
    typeof run.createdAt !== "string"
  ) {
    return null;
  }

  const sections = sanitizeArray<unknown>(run.sections, [])
    .map((section) => normalizeAssistantSection(section))
    .filter((section): section is AssistantSection => Boolean(section));
  const alternative =
    typeof run.alternative === "object" &&
    run.alternative !== null &&
    typeof (run.alternative as { title?: unknown }).title === "string" &&
    typeof (run.alternative as { summary?: unknown }).summary === "string"
      ? {
          title: (run.alternative as { title: string }).title,
          summary: (run.alternative as { summary: string }).summary,
          sections: sanitizeArray<unknown>((run.alternative as { sections?: unknown }).sections, [])
            .map((section) => normalizeAssistantSection(section))
            .filter((section): section is AssistantSection => Boolean(section)),
        }
      : null;
  const readyToUse = sanitizeArray<unknown>(run.readyToUse, [])
    .filter(
      (item): item is {
        bullets?: unknown;
        content: string;
        label: string;
      } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { label?: unknown }).label === "string" &&
        typeof (item as { content?: unknown }).content === "string",
    )
    .map((item) => ({
      label: item.label,
      content: item.content,
      bullets: sanitizeArray<string>(item.bullets, []).filter((bullet) => typeof bullet === "string"),
    }));
  const promptPack =
    typeof run.promptPack === "object" &&
    run.promptPack !== null &&
    typeof (run.promptPack as { brief?: unknown }).brief === "string" &&
    typeof (run.promptPack as { conductor?: unknown }).conductor === "string" &&
    typeof (run.promptPack as { cursor?: unknown }).cursor === "string"
      ? {
          brief: (run.promptPack as { brief: string }).brief,
          conductor: (run.promptPack as { conductor: string }).conductor,
          cursor: (run.promptPack as { cursor: string }).cursor,
        }
      : null;
  const imageAsset =
    typeof run.imageAsset === "object" &&
    run.imageAsset !== null &&
    typeof (run.imageAsset as { alt?: unknown }).alt === "string" &&
    typeof (run.imageAsset as { fileName?: unknown }).fileName === "string" &&
    typeof (run.imageAsset as { prompt?: unknown }).prompt === "string" &&
    typeof (run.imageAsset as { title?: unknown }).title === "string"
      ? {
          alt: (run.imageAsset as { alt: string }).alt,
          fileName: (run.imageAsset as { fileName: string }).fileName,
          imageUrl:
            typeof (run.imageAsset as { imageUrl?: unknown }).imageUrl === "string"
              ? (run.imageAsset as { imageUrl: string }).imageUrl
              : null,
          prompt: (run.imageAsset as { prompt: string }).prompt,
          title: (run.imageAsset as { title: string }).title,
        }
      : null;

  return {
    id: run.id,
    action: run.action,
    input: run.input,
    url: run.url,
    language: run.language,
    title: run.title,
    summary: run.summary,
    sections,
    readyToUse,
    alternative,
    promptPack,
    imageAsset,
    createdAt: run.createdAt,
  };
}

function normalizeDashboard(
  value: unknown,
  plan: BillingPlan,
  uid: string,
  paidPlanTier: PaidPlanTier | null = null,
): DashboardData {
  const fallback = getDashboardTemplate(plan, paidPlanTier);
  const raw = (value ?? {}) as DocumentData;
  const generatedBlogs = sanitizeArray<GeneratedBlog>(raw.generatedBlogs, fallback.generatedBlogs);
  const auditRuns = sanitizeArray<AuditRun>(raw.auditRuns, fallback.auditRuns);
  const assistantRuns = sanitizeArray<unknown>(raw.assistantRuns, fallback.assistantRuns)
    .map((run) => normalizeAssistantRun(run))
    .filter((run): run is AssistantRun => Boolean(run));
  const derivedState = buildDynamicDashboardState(
    plan,
    paidPlanTier,
    generatedBlogs,
    auditRuns,
    assistantRuns,
  );

  return {
    uid,
    plan,
    title: derivedState.title,
    body: derivedState.body,
    usage: derivedState.usage,
    cards: derivedState.cards,
    health: derivedState.health,
    recommendations: derivedState.recommendations,
    activities: derivedState.activities,
    generatedBlogs,
    auditRuns,
    assistantRuns,
    updatedAt: raw.updatedAt ?? null,
  };
}

function createItemId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function parseDashboardDate(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function summarizeUrl(value: string): string {
  if (!value) {
    return "No audit URL saved";
  }

  try {
    return new URL(value).host.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function getPlanLimits(plan: BillingPlan, paidPlanTier: PaidPlanTier | null) {
  if (plan === "free") {
    return { blogs: 3, audits: 1, actions: 4 };
  }

  if (paidPlanTier === "starter") {
    return { blogs: 50, audits: 20, actions: 70 };
  }

  if (paidPlanTier === "pro") {
    return { blogs: 200, audits: 100, actions: 300 };
  }

  return { blogs: 999, audits: 999, actions: 999 };
}

function getWorkspaceLabel(plan: BillingPlan, paidPlanTier: PaidPlanTier | null) {
  if (plan === "free") {
    return "Free";
  }

  return getPaidTierLabel(paidPlanTier) || "Paid";
}

function buildDynamicDashboardState(
  plan: BillingPlan,
  paidPlanTier: PaidPlanTier | null,
  generatedBlogs: GeneratedBlog[],
  auditRuns: AuditRun[],
  assistantRuns: AssistantRun[],
) {
  const limits = getPlanLimits(plan, paidPlanTier);
  const workspaceLabel = getWorkspaceLabel(plan, paidPlanTier);
  const blogCount = generatedBlogs.length;
  const auditCount = auditRuns.length;
  const assistantCount = assistantRuns.length;
  const actionCount = blogCount + auditCount + assistantCount;
  const latestBlog = generatedBlogs[0] ?? null;
  const latestAudit = auditRuns[0] ?? null;
  const latestAssistant = assistantRuns[0] ?? null;
  const issues = latestAudit?.issues ?? [];
  const criticalIssues = issues.filter((issue) => issue.severity === "Critical").length;
  const warningIssues = issues.filter((issue) => issue.severity === "Warning").length;
  const goodChecks = issues.filter((issue) => issue.severity === "Good").length;
  const activities: DashboardActivity[] = [
    ...generatedBlogs.map((blog) => ({
      title: blog.title,
      type: "blog" as const,
      date: blog.createdAt,
      status: "Completed",
    })),
    ...auditRuns.map((audit) => ({
      title: audit.url,
      type: "audit" as const,
      date: audit.createdAt,
      status: "Completed",
    })),
    ...assistantRuns.map((assistant) => ({
      title: assistant.title,
      type: "system" as const,
      date: assistant.createdAt,
      status: "Completed",
    })),
  ]
    .sort((left, right) => parseDashboardDate(right.date) - parseDashboardDate(left.date))
    .slice(0, 20);

  return {
    title: `${workspaceLabel} Workspace Dashboard`,
    body:
      actionCount > 0
        ? `${blogCount} blog drafts, ${auditCount} website audits, and ${assistantCount} AI assistant runs are saved in this workspace right now.`
        : "No live workspace data yet. Generate a blog or run an audit to start building this dashboard.",
    usage: {
      label: "Workspace actions used",
      current: actionCount,
      max: limits.actions,
      text:
        plan === "free"
          ? `${actionCount} of ${limits.actions} included actions are currently used.`
          : `${actionCount} real workspace actions have been completed for this ${workspaceLabel.toLowerCase()} plan.`,
    },
    cards: [
      {
        label: "Blogs generated",
        value: String(blogCount),
        description: latestBlog ? `Latest: ${latestBlog.title}` : "No generated blogs saved yet",
      },
      {
        label: "Audits run",
        value: String(auditCount),
        description: latestAudit ? `Latest: ${summarizeUrl(latestAudit.url)}` : "No website audits saved yet",
      },
      {
        label: "AI tasks",
        value: String(assistantCount),
        description:
          latestAssistant
            ? `Latest: ${latestAssistant.title}`
            : plan === "free"
              ? "AI assistant unlocks on paid plans"
              : "No AI assistant tasks saved yet",
      },
    ],
    health: latestAudit
      ? [
          {
            label: "SEO score",
            value: String(latestAudit.score),
            description: latestAudit.summary,
            tone: latestAudit.score >= 85 ? "good" : latestAudit.score >= 60 ? "warning" : "default",
          },
          {
            label: "Critical issues",
            value: String(criticalIssues),
            description:
              criticalIssues > 0 ? "Resolve the latest critical blockers first" : "No critical blockers found",
            tone: criticalIssues > 0 ? "warning" : "good",
          },
          {
            label: "Warnings",
            value: String(warningIssues),
            description:
              warningIssues > 0 ? "Review warning-level SEO issues next" : `${goodChecks} good checks passed in the latest audit`,
            tone: warningIssues > 0 ? "warning" : "good",
          },
        ]
      : [
          {
            label: "SEO score",
            value: "--",
            description: "Run your first audit to populate technical health data",
          },
          {
            label: "Critical issues",
            value: "0",
            description: "No audit has been saved yet",
          },
          {
            label: "Warnings",
            value: "0",
            description: "Warnings will appear after the first audit",
          },
        ],
    recommendations:
      latestAudit?.recommendations?.length
        ? latestAudit.recommendations
        : actionCount === 0
          ? [
              "Generate your first blog draft to start building workspace history",
              "Run a website audit to populate domain health insights",
              plan === "free"
                ? "Upgrade to unlock the AI assistant and higher workspace limits"
                : "Use the AI assistant for briefs, metadata, schema, or fix plans on your first target page",
            ]
          : blogCount === 0
            ? [
                "Generate your first blog draft to complement the saved audit data",
                "Use the audit recommendations to choose a target keyword",
                "Build a publishing rhythm so history starts showing real momentum",
              ]
            : auditCount === 0
              ? [
                  "Run your first website audit to add technical health visibility",
                  "Use your latest saved blog topic as the first audit target",
                  plan === "free"
                    ? "Upgrade to unlock the AI assistant and higher workspace limits"
                    : "Compare blog output with audit findings to prioritize next actions",
                ]
              : assistantCount === 0
                ? plan === "free"
                  ? [
                      "Upgrade to unlock the AI assistant for fix plans and structured SEO tasks",
                      "Re-run audits after major page edits to keep health data fresh",
                      "Keep publishing blog drafts from your strongest opportunities",
                    ]
                  : [
                      "Use the AI assistant to turn your latest audit into a fix plan",
                      "Generate metadata or schema before publishing the next draft",
                      "Save assistant outputs so your workspace history reflects execution, not just ideas",
                    ]
                : [
                  "Keep generating new blog drafts from your strongest audited opportunities",
                  "Re-run audits after major page edits to keep health data fresh",
                  "Use history to review how blog and audit activity is compounding over time",
                ],
    activities,
  };
}

export async function upsertUserProfile({
  user,
  phone,
  provider,
  plan,
}: {
  user: User;
  phone: string;
  provider: string | null;
  plan?: BillingPlan | null;
}): Promise<UserProfile> {
  const ref = doc(firestore, USERS_COLLECTION, user.uid);
  const existing = await getDoc(ref);
  const normalizedPlan = isBillingPlan(plan) ? plan : null;

  if (existing.exists()) {
    const stored = existing.data();
    const storedPlan = isBillingPlan(stored.plan) ? (stored.plan as BillingPlan) : null;
    const storedPaidPlanTier = isPaidPlanTier(stored.paidPlanTier) ? (stored.paidPlanTier as PaidPlanTier) : null;
    const resolvedPlan = normalizedPlan ?? storedPlan;
    const resolvedPaidPlanTier = resolvedPlan === "paid" ? storedPaidPlanTier : null;
    const nextProfile: UserProfile = {
      uid: user.uid,
      email: user.email ?? (typeof stored.email === "string" ? stored.email : null),
      displayName: user.displayName ?? (typeof stored.displayName === "string" ? stored.displayName : null),
      photoURL: user.photoURL ?? (typeof stored.photoURL === "string" ? stored.photoURL : null),
      phone: cleanPhone(phone) || (typeof stored.phone === "string" ? stored.phone : ""),
      plan: resolvedPlan,
      paidPlanTier: resolvedPaidPlanTier,
      assistantPromptCredits: normalizeCreditCount(stored.assistantPromptCredits),
      assistantImageCredits: normalizeCreditCount(stored.assistantImageCredits),
      provider: provider || (typeof stored.provider === "string" ? stored.provider : null),
      createdAt: stored.createdAt ?? null,
      updatedAt: serverTimestamp() as Timestamp | null,
      lastLoginAt: serverTimestamp() as Timestamp | null,
    };
    await updateDoc(ref, {
      email: nextProfile.email,
      displayName: nextProfile.displayName,
      photoURL: nextProfile.photoURL,
      phone: nextProfile.phone,
      plan: nextProfile.plan,
      paidPlanTier: nextProfile.plan === "paid" ? nextProfile.paidPlanTier : null,
      assistantPromptCredits: nextProfile.assistantPromptCredits,
      assistantImageCredits: nextProfile.assistantImageCredits,
      provider: nextProfile.provider,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    if (nextProfile.plan) {
      await upsertDashboardData(user.uid, nextProfile.plan, nextProfile.paidPlanTier);
    }

    return nextProfile;
  }

  const defaultProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phone: cleanPhone(phone),
    plan: normalizedPlan ?? null,
    paidPlanTier: null,
    assistantPromptCredits: 0,
    assistantImageCredits: 0,
    provider,
    createdAt: serverTimestamp() as Timestamp | null,
    updatedAt: serverTimestamp() as Timestamp | null,
    lastLoginAt: serverTimestamp() as Timestamp | null,
  };

  await setDoc(ref, {
    ...defaultProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });

  if (defaultProfile.plan) {
    await upsertDashboardData(user.uid, defaultProfile.plan, defaultProfile.paidPlanTier);
  }

  return defaultProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const ref = doc(firestore, USERS_COLLECTION, uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error("Missing user profile");
  }

  const raw = snapshot.data();

  return {
    uid,
    email: typeof raw.email === "string" ? raw.email : null,
    displayName: typeof raw.displayName === "string" ? raw.displayName : null,
    photoURL: typeof raw.photoURL === "string" ? raw.photoURL : null,
    phone: typeof raw.phone === "string" ? raw.phone : "",
    plan: isBillingPlan(raw.plan) ? (raw.plan as BillingPlan) : null,
    paidPlanTier: isPaidPlanTier(raw.paidPlanTier) ? (raw.paidPlanTier as PaidPlanTier) : null,
    assistantPromptCredits: normalizeCreditCount(raw.assistantPromptCredits),
    assistantImageCredits: normalizeCreditCount(raw.assistantImageCredits),
    provider: typeof raw.provider === "string" ? raw.provider : null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
    lastLoginAt: raw.lastLoginAt ?? null,
  };
}

export async function setUserPlan(uid: string, plan: BillingPlan, phone = ""): Promise<void> {
  const ref = doc(firestore, USERS_COLLECTION, uid);
  const existing = await getDoc(ref).catch(() => null);
  const storedPaidPlanTier =
    existing?.exists() && isPaidPlanTier(existing.data().paidPlanTier)
      ? (existing.data().paidPlanTier as PaidPlanTier)
      : null;
  const updated = {
    plan,
    paidPlanTier: plan === "paid" ? storedPaidPlanTier : null,
    phone: cleanPhone(phone),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };

  await updateDoc(ref, updated).catch(async () => {
    await setDoc(ref, {
      uid,
      email: null,
      displayName: null,
      photoURL: null,
      phone: updated.phone,
      plan,
      paidPlanTier: updated.paidPlanTier,
      assistantPromptCredits: 0,
      assistantImageCredits: 0,
      provider: null,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  });

  await upsertDashboardData(uid, plan, updated.paidPlanTier);
}

export async function setUserPaidTier(
  uid: string,
  paidPlanTier: PaidPlanTier,
  phone = "",
): Promise<void> {
  const ref = doc(firestore, USERS_COLLECTION, uid);
  const updated = {
    plan: "paid" as const,
    paidPlanTier,
    phone: cleanPhone(phone),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };

  await updateDoc(ref, updated).catch(async () => {
    await setDoc(ref, {
      uid,
      email: null,
      displayName: null,
      photoURL: null,
      phone: updated.phone,
      plan: "paid",
      paidPlanTier,
      assistantPromptCredits: 0,
      assistantImageCredits: 0,
      provider: null,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  });

  await upsertDashboardData(uid, "paid", paidPlanTier);
}

export async function upsertDashboardData(
  uid: string,
  plan: BillingPlan,
  paidPlanTier: PaidPlanTier | null = null,
): Promise<DashboardData> {
  const ref = doc(firestore, DASHBOARD_COLLECTION, uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const payload = {
      uid,
      plan,
      generatedBlogs: [],
      auditRuns: [],
      assistantRuns: [],
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    return normalizeDashboard(payload, plan, uid, paidPlanTier);
  }

  const storedPlan = normalizeBillingPlan(snapshot.data().plan);
  if (storedPlan !== plan) {
    const payload = {
      uid,
      ...snapshot.data(),
      plan,
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    return normalizeDashboard(payload, plan, uid, paidPlanTier);
  }

  return normalizeDashboard(snapshot.data(), plan, uid, paidPlanTier);
}

export async function getDashboardForUser(uid: string): Promise<DashboardData> {
  const profile = await getUserProfile(uid);
  if (!profile.plan) {
    throw new Error("Missing plan selection");
  }

  const ref = doc(firestore, DASHBOARD_COLLECTION, uid);
  const snapshot = await getDoc(ref);
  const normalizedPlan = profile.plan;

  if (!snapshot.exists()) {
    return upsertDashboardData(uid, normalizedPlan, profile.paidPlanTier);
  }

  return normalizeDashboard(snapshot.data(), normalizedPlan, uid, profile.paidPlanTier);
}

export async function saveGeneratedBlogForUser(
  uid: string,
  blog: Omit<GeneratedBlog, "id" | "createdAt"> & Partial<Pick<GeneratedBlog, "id" | "createdAt">>,
): Promise<DashboardData> {
  const profile = await getUserProfile(uid);
  if (!profile.plan) {
    throw new Error("Missing plan selection");
  }

  const ref = doc(firestore, DASHBOARD_COLLECTION, uid);
  const current = await getDashboardForUser(uid);

  if (profile.plan === "free" && current.generatedBlogs.length >= 3) {
    throw new Error("Free plan includes 3 blog drafts. Upgrade to continue.");
  }

  const nextBlog: GeneratedBlog = {
    id: blog.id ?? createItemId("blog"),
    createdAt: blog.createdAt ?? new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    ...blog,
  };
  const nextGeneratedBlogs = [nextBlog, ...current.generatedBlogs].slice(0, 12);
  const payload = {
    uid,
    plan: profile.plan,
    generatedBlogs: nextGeneratedBlogs,
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });

  return normalizeDashboard(
    {
      ...current,
      uid,
      plan: profile.plan,
      generatedBlogs: nextGeneratedBlogs,
    },
    profile.plan,
    uid,
    profile.paidPlanTier,
  );
}

export async function saveAuditRunForUser(
  uid: string,
  auditRun: Omit<AuditRun, "id" | "createdAt"> & Partial<Pick<AuditRun, "id" | "createdAt">>,
): Promise<DashboardData> {
  const profile = await getUserProfile(uid);
  if (!profile.plan) {
    throw new Error("Missing plan selection");
  }

  const ref = doc(firestore, DASHBOARD_COLLECTION, uid);
  const current = await getDashboardForUser(uid);

  if (profile.plan === "free" && current.auditRuns.length >= 1) {
    throw new Error("Free plan includes 1 website audit. Upgrade to run another.");
  }

  const nextAuditRun: AuditRun = {
    id: auditRun.id ?? createItemId("audit"),
    createdAt: auditRun.createdAt ?? new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    ...auditRun,
  };
  const nextAuditRuns = [nextAuditRun, ...current.auditRuns].slice(0, 12);
  const payload = {
    uid,
    plan: profile.plan,
    auditRuns: nextAuditRuns,
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });

  return normalizeDashboard(
    {
      ...current,
      uid,
      plan: profile.plan,
      auditRuns: nextAuditRuns,
    },
    profile.plan,
    uid,
    profile.paidPlanTier,
  );
}

export async function saveAssistantRunForUser(
  uid: string,
  assistantRun: Omit<AssistantRun, "id" | "createdAt"> & Partial<Pick<AssistantRun, "id" | "createdAt">>,
): Promise<DashboardData> {
  const profile = await getUserProfile(uid);
  if (!profile.plan) {
    throw new Error("Missing plan selection");
  }

  const ref = doc(firestore, DASHBOARD_COLLECTION, uid);
  const current = await getDashboardForUser(uid);

  if (profile.plan === "free") {
    throw new Error("AI assistant is available on paid plans only. Upgrade to continue.");
  }

  const nextAssistantRun: AssistantRun = {
    id: assistantRun.id ?? createItemId("assistant"),
    createdAt: assistantRun.createdAt ?? new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    ...assistantRun,
  };
  const nextAssistantRuns = [nextAssistantRun, ...current.assistantRuns].slice(0, 20);
  const payload = {
    uid,
    plan: profile.plan,
    assistantRuns: nextAssistantRuns,
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });

  return normalizeDashboard(
    {
      ...current,
      uid,
      plan: profile.plan,
      assistantRuns: nextAssistantRuns,
    },
    profile.plan,
    uid,
    profile.paidPlanTier,
  );
}

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

export type BillingPlan = "free" | "paid";

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone: string;
  plan: BillingPlan | null;
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
  updatedAt?: Timestamp | null;
};

const USERS_COLLECTION = "users";
const DASHBOARD_COLLECTION = "dashboard_data";

const BILLING_PLAN_OPTIONS: BillingPlan[] = ["free", "paid"];

function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "free" || value === "paid";
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
  },
};

function sanitizeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function normalizeBillingPlan(value: unknown): BillingPlan {
  return isBillingPlan(value) ? value : "free";
}

function getDashboardTemplate(plan: BillingPlan): Omit<DashboardData, "uid" | "updatedAt"> {
  return BASE_DASHBOARDS[plan];
}

export function isSupportedPlan(value: string): value is BillingPlan {
  return BILLING_PLAN_OPTIONS.includes(value as BillingPlan);
}

function cleanPhone(input: string): string {
  return input.trim();
}

function normalizeDashboard(value: unknown, plan: BillingPlan, uid: string): DashboardData {
  const fallback = getDashboardTemplate(plan);
  const raw = (value ?? {}) as DocumentData;

  return {
    uid,
    plan,
    title: typeof raw.title === "string" ? raw.title : fallback.title,
    body: typeof raw.body === "string" ? raw.body : fallback.body,
    usage: {
      label: raw?.usage?.label && typeof raw.usage.label === "string" ? raw.usage.label : fallback.usage.label,
      current:
        typeof raw?.usage?.current === "number" && !Number.isNaN(raw.usage.current)
          ? raw.usage.current
          : fallback.usage.current,
      max:
        typeof raw?.usage?.max === "number" && !Number.isNaN(raw.usage.max)
          ? raw.usage.max
          : fallback.usage.max,
      text: raw?.usage?.text && typeof raw.usage.text === "string" ? raw.usage.text : fallback.usage.text,
    },
    cards: sanitizeArray<DashboardCard>(raw.cards, fallback.cards),
    health: sanitizeArray<DashboardCard>(raw.health, fallback.health),
    recommendations: sanitizeArray<string>(raw.recommendations, fallback.recommendations),
    activities: sanitizeArray<DashboardActivity>(raw.activities, fallback.activities),
    updatedAt: raw.updatedAt ?? null,
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
    const nextProfile: UserProfile = {
      uid: user.uid,
      email: user.email ?? (typeof stored.email === "string" ? stored.email : null),
      displayName: user.displayName ?? (typeof stored.displayName === "string" ? stored.displayName : null),
      photoURL: user.photoURL ?? (typeof stored.photoURL === "string" ? stored.photoURL : null),
      phone: cleanPhone(phone) || (typeof stored.phone === "string" ? stored.phone : ""),
      plan: normalizedPlan ?? storedPlan,
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
      provider: nextProfile.provider,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    if (nextProfile.plan) {
      await upsertDashboardData(user.uid, nextProfile.plan);
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
    await upsertDashboardData(user.uid, defaultProfile.plan);
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
    provider: typeof raw.provider === "string" ? raw.provider : null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
    lastLoginAt: raw.lastLoginAt ?? null,
  };
}

export async function setUserPlan(uid: string, plan: BillingPlan, phone = ""): Promise<void> {
  const ref = doc(firestore, USERS_COLLECTION, uid);
  const updated = {
    plan,
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
      provider: null,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  });

  await upsertDashboardData(uid, plan);
}

export async function upsertDashboardData(uid: string, plan: BillingPlan): Promise<DashboardData> {
  const ref = doc(firestore, DASHBOARD_COLLECTION, uid);
  const snapshot = await getDoc(ref);
  const template = getDashboardTemplate(plan);

  if (!snapshot.exists()) {
    const payload = {
      uid,
      ...template,
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    return payload as DashboardData;
  }

  const storedPlan = normalizeBillingPlan(snapshot.data().plan);
  if (storedPlan !== plan) {
    const payload = {
      uid,
      ...snapshot.data(),
      ...template,
      plan,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(ref, payload);
    return {
      ...normalizeDashboard(payload, plan, uid),
      updatedAt: payload.updatedAt,
    };
  }

  return normalizeDashboard(snapshot.data(), plan, uid);
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
    return upsertDashboardData(uid, normalizedPlan);
  }

  return normalizeDashboard(snapshot.data(), normalizedPlan, uid);
}


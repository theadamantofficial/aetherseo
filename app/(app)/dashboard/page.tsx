"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type {
  DashboardActivity,
  DashboardCard,
  DashboardData,
  UserProfile,
} from "@/lib/firebase-data";
import {
  getDashboardForUser,
  getUserProfile,
} from "@/lib/firebase-data";

type DashboardViewState =
  | {
      loading: true;
      error: "";
      data: null;
      profile: null;
    }
  | {
      loading: false;
      error: string;
      data: DashboardData | null;
      profile: UserProfile | null;
    };

const initialState: DashboardViewState = {
  loading: true,
  error: "",
  data: null,
  profile: null,
};

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<DashboardViewState>(initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      try {
        const userProfile = await getUserProfile(currentUser.uid);
        if (!userProfile.plan) {
          router.replace("/auth");
          return;
        }
        const data = await getDashboardForUser(currentUser.uid);
        setState({
          loading: false,
          error: "",
          profile: userProfile,
          data,
        });
      } catch {
        setState({
          loading: false,
          error: "We could not load your workspace data from Firestore.",
          data: null,
          profile: null,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  if (state.loading) {
    return <div className="text-sm text-white/70">Loading your workspace data...</div>;
  }

  if (state.error) {
    return <div className="rounded-xl bg-[#0f1738] p-6 text-sm text-white/70">{state.error}</div>;
  }

  const dashboard = state.data;
  const isPaid = dashboard?.plan === "paid";
  if (!dashboard || !state.profile) {
    return <div className="text-sm text-white/70">No workspace data is available yet.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
        <h1 className="text-3xl font-semibold capitalize">{dashboard.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/65">{dashboard.body}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">
          Signed in as {state.profile.displayName || state.profile.email}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboard.cards.map((card: DashboardCard) => (
          <article key={card.label} className="rounded-2xl border border-white/10 bg-[#0f1738] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold">{card.value}</p>
            <p className="mt-1 text-sm text-white/60">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[#7665ff]/45 bg-gradient-to-r from-[#4f43e7] to-[#6b62ff] p-7">
          <h2 className="text-4xl font-semibold">Generate AI Blog Content</h2>
          <p className="mt-3 max-w-md text-sm text-white/85">
            Create SEO-optimized articles in seconds with your target keyword and tone.
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl border border-[#ffffff]/70 bg-white px-4 py-2 text-sm font-semibold text-[#050b21]"
          >
            {isPaid ? "Create Premium Draft" : "Create Standard Draft"}
          </button>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#353d54] p-7">
          <h2 className="text-4xl font-semibold">Comprehensive Website Audit</h2>
          <p className="mt-3 max-w-md text-sm text-white/75">
            Deep scan your domain for technical SEO issues and performance bottlenecks.
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-[#6253f1] px-4 py-2 text-sm font-semibold text-white"
          >
            {isPaid ? "Run Advanced Audit" : "Run Basic Audit"}
          </button>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Recent Activity</h3>
            <button type="button" className="text-sm text-[#9b92ff]">
              <Link href="/history">View History</Link>
            </button>
          </div>
          <div className="space-y-4 text-sm">
            {dashboard.activities.map((activity: DashboardActivity) => (
              <div
                key={activity.title + activity.date}
                className="flex items-center justify-between rounded-xl bg-white/5 p-3"
              >
                <p>
                  {activity.type}: {activity.title}
                </p>
                <span className="text-[#67e9cf]">{activity.status}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
          <h3 className="text-2xl font-semibold">Domain Health</h3>
          <div className="mt-4 space-y-3 text-sm">
            {dashboard.health.map((metric) => (
              <div key={metric.label} className="flex justify-between rounded-xl bg-white/5 p-3">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
            <p className="text-xs text-white/45">{dashboard.usage.text}</p>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f1738] p-6">
        <h3 className="text-2xl font-semibold">Recommended Next Actions</h3>
        <ul className="mt-4 grid gap-3 text-sm text-white/75 md:grid-cols-3">
          {dashboard.recommendations.map((recommendation) => (
            <li key={recommendation} className="rounded-xl bg-white/5 p-3">
              {recommendation}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

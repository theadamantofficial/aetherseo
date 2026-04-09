import { NextResponse } from "next/server";
import { listPublishedBlogPosts } from "@/lib/public-blog-posts";
import type { SiteLanguage } from "@/lib/site-language";

function normalizeLanguage(value: string | null): SiteLanguage | undefined {
  if (value === "en" || value === "hi" || value === "fr" || value === "de" || value === "ja" || value === "ko") {
    return value;
  }

  return undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const language = normalizeLanguage(searchParams.get("language"));
  const limit = Math.max(1, Math.min(12, Number(searchParams.get("limit") || "3")));
  const posts = await listPublishedBlogPosts(language);
  return NextResponse.json({ posts: posts.slice(0, limit) });
}

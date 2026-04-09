import { NextResponse } from "next/server";
import type { BlogLanguage } from "@/lib/blog-post-utils";
import { listPublishedBlogPosts } from "@/lib/public-blog-posts";

function normalizeLanguage(value: string | null): BlogLanguage | undefined {
  if (
    value === "en" ||
    value === "es" ||
    value === "hi" ||
    value === "fr" ||
    value === "de" ||
    value === "ja" ||
    value === "ko"
  ) {
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

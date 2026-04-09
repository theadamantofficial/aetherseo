import { NextResponse } from "next/server";
import {
  estimateReadTime,
  normalizeArticleBody,
  normalizeTags,
  slugify,
  type BlogLanguage,
  type PublishedBlogPost,
} from "@/lib/blog-post-utils";
import { isBlogAdminAuthenticated } from "@/lib/blog-admin-auth";
import {
  deletePublishedBlogPost,
  listAllPublishedBlogPosts,
  upsertPublishedBlogPost,
} from "@/lib/public-blog-posts";
import { sendBlogPublishedNotification } from "@/lib/discord-webhooks";
function normalizeLanguage(value: unknown): BlogLanguage {
  return value === "es" || value === "hi" || value === "fr" || value === "de" || value === "ja" || value === "ko"
    ? value
    : "en";
}

export async function GET(request: Request) {
  if (!(await isBlogAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    return NextResponse.json({ posts: await listAllPublishedBlogPosts() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load published blog posts." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isBlogAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<PublishedBlogPost>;
    const title = body.title?.trim();
    const slug = slugify((typeof body.slug === "string" ? body.slug : "") || title || "");
    const contentSource =
      typeof body.body === "string"
        ? body.body
        : typeof (body as { content?: unknown }).content === "string"
          ? String((body as { content?: unknown }).content)
          : "";
    const tags = normalizeTags((body as { tags?: unknown }).tags);

    if (!title || !slug || !contentSource.trim()) {
      return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const language = normalizeLanguage(body.language);
    const currentPosts = await listAllPublishedBlogPosts();
    const existingPost = currentPosts.find((entry) => entry.id === `${language}--${slug}`);
    const post: PublishedBlogPost = {
      id: `${language}--${slug}`,
      slug,
      language,
      title,
      excerpt: body.excerpt?.trim() || "",
      category: body.category?.trim() || tags[0] || "Editorial",
      tags,
      body: normalizeArticleBody(contentSource),
      seoTitle: body.seoTitle?.trim() || title,
      seoDescription: body.seoDescription?.trim() || body.excerpt?.trim() || "",
      authorName: body.authorName?.trim() || "Aether SEO",
      publishedAt: existingPost?.publishedAt || now,
      updatedAt: now,
      readTime: estimateReadTime(contentSource),
    };

    await upsertPublishedBlogPost(post);
    await sendBlogPublishedNotification({
      title: post.title,
      slug: post.slug,
      language: post.language,
      category: post.category,
      authorName: post.authorName,
    });

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not publish the blog post." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isBlogAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "Post id is required." }, { status: 400 });
    }

    await deletePublishedBlogPost(postId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete the blog post." },
      { status: 500 },
    );
  }
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BlogLanguage, PublishedBlogPost } from "@/lib/blog-post-utils";

const storePath = path.join(process.cwd(), "data", "public-blog-posts.json");

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, "[]\n", "utf8");
  }
}

async function readStore() {
  await ensureStore();

  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as PublishedBlogPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as PublishedBlogPost[];
  }
}

async function writeStore(posts: PublishedBlogPost[]) {
  await ensureStore();
  await writeFile(storePath, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
}

function sortPosts(posts: PublishedBlogPost[]) {
  return [...posts].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export async function listAllPublishedBlogPosts() {
  return sortPosts(await readStore());
}

export async function listPublishedBlogPosts(language?: BlogLanguage) {
  const posts = await readStore();
  return sortPosts(language ? posts.filter((entry) => entry.language === language) : posts);
}

export async function getPublishedBlogPost(language: BlogLanguage, slug: string) {
  const posts = await readStore();
  return posts.find((entry) => entry.language === language && entry.slug === slug) ?? null;
}

export async function upsertPublishedBlogPost(post: PublishedBlogPost) {
  const posts = await readStore();
  const nextPosts = sortPosts([post, ...posts.filter((entry) => entry.id !== post.id)]);
  await writeStore(nextPosts);
  return post;
}

export async function deletePublishedBlogPost(postId: string) {
  const posts = await readStore();
  const nextPosts = posts.filter((entry) => entry.id !== postId);
  await writeStore(nextPosts);
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";
import type { BlogLanguage, PublishedBlogPost } from "@/lib/blog-post-utils";

const LEGACY_STORE_PATH = path.join(process.cwd(), "data", "public-blog-posts.json");
const BLOB_POSTS_PREFIX = "public-blog-posts/";

let seedRemoteStorePromise: Promise<void> | null = null;

function isBlobStoreConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function getPostId(language: BlogLanguage, slug: string) {
  return `${language}--${slug}`;
}

function getBlobPath(postId: string) {
  return `${BLOB_POSTS_PREFIX}${postId}.json`;
}

async function ensureLegacyStore() {
  await mkdir(path.dirname(LEGACY_STORE_PATH), { recursive: true });

  try {
    await readFile(LEGACY_STORE_PATH, "utf8");
  } catch {
    await writeFile(LEGACY_STORE_PATH, "[]\n", "utf8");
  }
}

async function readLegacyStore() {
  await ensureLegacyStore();

  try {
    const raw = await readFile(LEGACY_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as PublishedBlogPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as PublishedBlogPost[];
  }
}

async function writeLegacyStore(posts: PublishedBlogPost[]) {
  await ensureLegacyStore();
  await writeFile(LEGACY_STORE_PATH, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
}

function sortPosts(posts: PublishedBlogPost[]) {
  return [...posts].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

async function listBlobPathnames() {
  const pathnames: string[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({
      cursor,
      limit: 1000,
      prefix: BLOB_POSTS_PREFIX,
    });

    pathnames.push(...page.blobs.map((entry) => entry.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return pathnames;
}

async function readBlobText(pathname: string) {
  const result = await get(pathname, {
    access: "private",
    useCache: false,
  });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  return new Response(result.stream).text();
}

async function readBlobPost(pathname: string) {
  const raw = await readBlobText(pathname);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PublishedBlogPost;
  } catch {
    return null;
  }
}

async function writeBlobPost(post: PublishedBlogPost) {
  await put(getBlobPath(post.id), `${JSON.stringify(post, null, 2)}\n`, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  });
}

async function seedRemoteStoreIfNeeded() {
  if (!isBlobStoreConfigured()) {
    return;
  }

  if (!seedRemoteStorePromise) {
    seedRemoteStorePromise = (async () => {
      const existingBlobPathnames = await listBlobPathnames();
      if (existingBlobPathnames.length > 0) {
        return;
      }

      const legacyPosts = await readLegacyStore();
      if (!legacyPosts.length) {
        return;
      }

      await Promise.all(legacyPosts.map((post) => writeBlobPost(post)));
    })().finally(() => {
      seedRemoteStorePromise = null;
    });
  }

  await seedRemoteStorePromise;
}

async function readRemoteStore() {
  if (!isBlobStoreConfigured()) {
    return null;
  }

  await seedRemoteStoreIfNeeded();
  const blobPathnames = await listBlobPathnames();
  const posts = await Promise.all(blobPathnames.map((pathname) => readBlobPost(pathname)));

  return posts.filter((post): post is PublishedBlogPost => Boolean(post));
}

function assertWritableStoreConfigured() {
  if (process.env.NODE_ENV === "production" && !isBlobStoreConfigured()) {
    throw new Error("Public blog storage is not configured. Set BLOB_READ_WRITE_TOKEN for publishing.");
  }
}

export async function listAllPublishedBlogPosts() {
  const remotePosts = await readRemoteStore();
  return sortPosts(remotePosts ?? (await readLegacyStore()));
}

export async function listPublishedBlogPosts(language?: BlogLanguage) {
  const posts = (await readRemoteStore()) ?? (await readLegacyStore());
  return sortPosts(language ? posts.filter((entry) => entry.language === language) : posts);
}

export async function getPublishedBlogPost(language: BlogLanguage, slug: string) {
  if (isBlobStoreConfigured()) {
    await seedRemoteStoreIfNeeded();
    const post = await readBlobPost(getBlobPath(getPostId(language, slug)));
    if (post) {
      return post;
    }
  }

  const posts = await readLegacyStore();
  return posts.find((entry) => entry.language === language && entry.slug === slug) ?? null;
}

export async function upsertPublishedBlogPost(post: PublishedBlogPost) {
  if (isBlobStoreConfigured()) {
    await seedRemoteStoreIfNeeded();
    await writeBlobPost(post);
    return post;
  }

  assertWritableStoreConfigured();
  const posts = await readLegacyStore();
  const nextPosts = sortPosts([post, ...posts.filter((entry) => entry.id !== post.id)]);
  await writeLegacyStore(nextPosts);
  return post;
}

export async function deletePublishedBlogPost(postId: string) {
  if (isBlobStoreConfigured()) {
    await del(getBlobPath(postId));
    return;
  }

  assertWritableStoreConfigured();
  const posts = await readLegacyStore();
  const nextPosts = posts.filter((entry) => entry.id !== postId);
  await writeLegacyStore(nextPosts);
}

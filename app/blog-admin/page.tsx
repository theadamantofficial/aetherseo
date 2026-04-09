"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  blogLanguageOptions,
  estimateReadTime,
  slugify,
  type BlogLanguage,
  type PublishedBlogPost,
} from "@/lib/blog-post-utils";

type ComposerState = {
  language: BlogLanguage;
  slug: string;
  title: string;
  category: string;
  tags: string;
  excerpt: string;
  seoDescription: string;
  authorName: string;
  body: string;
};

const initialComposerState: ComposerState = {
  language: "en",
  slug: "",
  title: "",
  category: "Editorial",
  tags: "",
  excerpt: "",
  seoDescription: "",
  authorName: "Aether SEO",
  body: "",
};

export default function BlogAdminPage() {
  const router = useRouter();
  const [composer, setComposer] = useState<ComposerState>(initialComposerState);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [posts, setPosts] = useState<PublishedBlogPost[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const liveSlug = useMemo(() => slugify(composer.title), [composer.title]);
  const resolvedSlug = composer.slug || liveSlug;
  const isEditing = Boolean(composer.slug);
  const adminSurfaceClass =
    "relative z-10 rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[0_18px_44px_rgba(15,23,42,0.08)]";
  const adminCardClass =
    "relative z-10 rounded-[1.75rem] border border-[var(--site-border)] bg-[var(--site-surface-soft)] p-7 shadow-[0_12px_30px_rgba(15,23,42,0.06)]";
  const adminInputClass =
    "w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--site-primary)]";
  const adminPrimaryButtonClass =
    "inline-flex items-center justify-center rounded-2xl bg-[var(--site-ink)] px-5 py-3 text-sm font-semibold text-[var(--site-ink-contrast)] shadow-[0_14px_32px_rgba(15,23,42,0.16)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
  const adminSecondaryButtonClass =
    "inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-soft)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:opacity-90";

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/blog-admin/login", { cache: "no-store" });
        const payload = (await response.json()) as { authenticated?: boolean; configured?: boolean };
        setIsUnlocked(Boolean(payload.authenticated));
        setIsConfigured(payload.configured !== false);
      } catch {
        setIsConfigured(false);
      } finally {
        setIsLoadingSession(false);
      }
    }

    void loadSession();
  }, []);

  useEffect(() => {
    if (!isUnlocked) {
      setPosts([]);
      return;
    }

    async function loadPosts() {
      setIsLoadingPosts(true);

      try {
        const response = await fetch("/api/blog-admin/posts", { cache: "no-store" });
        const payload = (await response.json()) as { posts?: PublishedBlogPost[]; error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "We could not load the published blog list.");
        }

        setPosts(payload.posts || []);
      } catch (error) {
        const message =
          typeof error === "object" && error && "message" in error
            ? String(error.message)
            : "We could not load the published blog list.";
        setStatus(message);
      } finally {
        setIsLoadingPosts(false);
      }
    }

    void loadPosts();
  }, [isUnlocked]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/blog-admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to unlock publishing.");
      }

      setIsUnlocked(true);
      setStatus("Publishing console unlocked.");
      setAdminPassword("");
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to unlock publishing.";
      setStatus(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setStatus(null);

    try {
      await fetch("/api/blog-admin/login", { method: "DELETE" });
    } finally {
      setIsUnlocked(false);
      setPosts([]);
      setComposer(initialComposerState);
      setAdminPassword("");
      setAdminEmail("");
    }
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!isUnlocked) {
      setStatus("Unlock the publishing console before posting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/blog-admin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...composer,
          slug: resolvedSlug || composer.title,
          tags: composer.tags,
          content: composer.body,
          seoTitle: composer.title,
        }),
      });
      const payload = (await response.json()) as { post?: PublishedBlogPost; error?: string };

      if (!response.ok || !payload.post) {
        throw new Error(payload.error || "We could not publish the blog post.");
      }

      setPosts((current) =>
        [payload.post!, ...current.filter((entry) => entry.id !== payload.post!.id)].sort((left, right) =>
          right.publishedAt.localeCompare(left.publishedAt),
        ),
      );
      setComposer(initialComposerState);
      setStatus(isEditing ? "Blog post updated successfully." : "Blog post published successfully.");
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "We could not publish the blog post.";
      setStatus(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(post: PublishedBlogPost) {
    setStatus(null);

    try {
      const response = await fetch(`/api/blog-admin/posts?id=${encodeURIComponent(post.id)}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "We could not remove the blog post.");
      }

      setPosts((current) => current.filter((entry) => entry.id !== post.id));
      setStatus("Blog post removed.");
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "We could not remove the blog post.";
      setStatus(message);
    }
  }

  function loadPostIntoEditor(post: PublishedBlogPost) {
    setComposer({
      language: post.language,
      slug: post.slug,
      title: post.title,
      category: post.category,
      tags: post.tags?.join(", ") || "",
      excerpt: post.excerpt,
      seoDescription: post.seoDescription,
      authorName: post.authorName,
      body: post.body,
    });
    setStatus("Loaded post into the editor.");
  }

  return (
    <div className="site-page min-h-screen px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="site-panel-hero rounded-[2rem] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="site-chip inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                Publishing console
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Publish live articles to the Aether SEO blog.
              </h1>
              <p className="site-muted mt-3 text-sm leading-7 sm:text-base">
                This is an internal developer console with a cookie-based admin session. It supports both manual posting and web automation against the same protected endpoints.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/en/blog")}
                className="site-button-secondary rounded-full px-5 py-3 text-sm font-medium"
              >
                Back to blog
              </button>
              <button
                type="button"
                onClick={() => router.push("/en/blog")}
                className="site-button-secondary rounded-full px-5 py-3 text-sm font-medium"
              >
                Open public blog
              </button>
              {isUnlocked ? (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="site-button-ink rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Log out
                </button>
              ) : null}
            </div>
          </div>
        </header>

        {!isUnlocked ? (
          <section className={`${adminSurfaceClass} p-6 sm:p-8`}>
            <div className="grid gap-6 lg:grid-cols-[1fr,0.95fr]">
              <div className={adminCardClass}>
                <p className="site-chip inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                  Member login
                </p>
                <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.05em]">
                  Sign in to publish and edit internal blog posts on Aether SEO.
                </h2>
                <p className="site-muted mt-5 max-w-xl text-sm leading-7 sm:text-base">
                  This internal publisher keeps a cookie-based admin session and writes directly to the local site store so posts appear inside the on-site blog immediately.
                </p>

                <div className={`${adminSurfaceClass} mt-8 p-5`}>
                  <p className="text-sm font-semibold">Automation-ready admin</p>
                  <p className="site-muted mt-3 text-sm leading-7">
                    Use this same login endpoint for manual access and scripted posting. The protected posts endpoint accepts structured JSON payloads and HTML content.
                  </p>
                </div>
              </div>

              <div className={adminCardClass}>
                <form className="space-y-5" onSubmit={handleLogin}>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Email</span>
                    <input
                      value={adminEmail}
                      onChange={(event) => setAdminEmail(event.target.value)}
                      className={adminInputClass}
                      placeholder="aether@gmail.com"
                      autoComplete="username"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Password</span>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                      className={adminInputClass}
                      placeholder="Enter the admin password"
                      autoComplete="current-password"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting || isLoadingSession || !isConfigured}
                    className={`${adminPrimaryButtonClass} w-full`}
                  >
                    {isSubmitting ? "Unlocking..." : "Unlock blog admin"}
                  </button>
                </form>

                <p className="site-muted mt-6 text-sm leading-7">
                  Browser login uses `BLOG_ADMIN_EMAIL` and `BLOG_ADMIN_PASSWORD`. Automation can use a bearer token through `BLOG_ADMIN_API_TOKEN`.
                </p>

                {!isConfigured ? (
                  <div className={`${adminSurfaceClass} mt-5 p-4 text-sm`}>
                    Blog admin credentials are missing from local env.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
            <div className={`${adminSurfaceClass} p-6 sm:p-8`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="site-chip inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    Publish article
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                    {isEditing ? "Edit internal article." : "Add a new blog post to your internal site."}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setComposer(initialComposerState)}
                    className={adminSecondaryButtonClass}
                  >
                    Clear form
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className={adminSecondaryButtonClass}
                  >
                    Log out
                  </button>
                </div>
              </div>

              <form className="mt-8 grid gap-4" onSubmit={handlePublish}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Title</span>
                    <input
                      value={composer.title}
                      onChange={(event) =>
                        setComposer((current) => ({ ...current, title: event.target.value }))
                      }
                      className={adminInputClass}
                      placeholder="How to improve conversion with a faster service site"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Language</span>
                    <div className="site-select-wrap">
                      <select
                        value={composer.language}
                        onChange={(event) =>
                          setComposer((current) => ({
                            ...current,
                            language: event.target.value as BlogLanguage,
                          }))
                        }
                        className={`${adminInputClass} site-select pr-10`}
                      >
                        {blogLanguageOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="site-select-caret" aria-hidden="true">
                        ▾
                      </span>
                    </div>
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Slug</span>
                  <input
                    value={resolvedSlug}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, slug: slugify(event.target.value) }))
                    }
                    className={adminInputClass}
                    placeholder="article-slug"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Excerpt</span>
                  <textarea
                    value={composer.excerpt}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, excerpt: event.target.value }))
                    }
                    rows={3}
                    className={adminInputClass}
                    placeholder="A short summary that appears on the blog cards and metadata."
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Author name</span>
                    <input
                    value={composer.authorName}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, authorName: event.target.value }))
                    }
                    className={adminInputClass}
                    placeholder="Aether SEO Team"
                  />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Tags</span>
                    <input
                    value={composer.tags}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, tags: event.target.value }))
                    }
                    className={adminInputClass}
                    placeholder="seo, ux, website strategy"
                  />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Category</span>
                    <input
                    value={composer.category}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, category: event.target.value }))
                    }
                    className={adminInputClass}
                    placeholder="SEO, Product, Editorial"
                  />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">SEO description</span>
                    <input
                    value={composer.seoDescription}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, seoDescription: event.target.value }))
                    }
                    className={adminInputClass}
                    placeholder="Meta description for the article page"
                  />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Article content</span>
                  <textarea
                    value={composer.body}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, body: event.target.value }))
                    }
                    rows={14}
                    className={adminInputClass}
                    placeholder="Write the post here or paste HTML from your automation flow."
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="site-muted text-sm">
                    <p>Slug preview: /{composer.language}/blog/{resolvedSlug || "article-slug"}</p>
                    <p className="mt-1">{estimateReadTime(composer.body || "Placeholder copy")}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`${adminPrimaryButtonClass} rounded-full px-6`}
                  >
                    {isSubmitting ? "Saving..." : isEditing ? "Update post" : "Publish on blog"}
                  </button>
                </div>
              </form>
            </div>

            <div className={`${adminSurfaceClass} p-6 sm:p-8`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="site-chip inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    Published internally
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                    Live posts and automation output.
                  </h2>
                  <p className="site-muted mt-3 text-sm leading-7">
                    All approved company logins can publish, edit, and remove posts through the same protected admin session.
                  </p>
                </div>
                <span className="site-chip rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                  {posts.length} live
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {isLoadingPosts ? (
                  <div className={`${adminCardClass} text-sm`}>
                    Loading published articles...
                  </div>
                ) : posts.length === 0 ? (
                  <div className={`${adminCardClass} text-sm`}>
                    No public blog posts exist yet.
                  </div>
                ) : (
                  posts.map((post) => (
                    <article key={post.id} className={`${adminCardClass} px-5 py-5`}>
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        <span>{post.category}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                        <span>•</span>
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{post.title}</h3>
                      <p className="site-muted mt-3 text-sm leading-7">{post.excerpt}</p>

                      {post.tags?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span key={`${post.id}-${tag}`} className="site-chip rounded-full px-3 py-1 text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => loadPostIntoEditor(post)}
                          className={adminSecondaryButtonClass}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(post)}
                          className="rounded-full border border-[var(--site-border)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
                        >
                          Delete
                        </button>
                        <Link
                          href={`/${post.language}/blog/${post.slug}`}
                          className={adminSecondaryButtonClass}
                        >
                          View
                        </Link>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {status ? (
          <div className="site-panel-soft rounded-[1.6rem] border px-5 py-4 text-sm">{status}</div>
        ) : null}
      </div>
    </div>
  );
}

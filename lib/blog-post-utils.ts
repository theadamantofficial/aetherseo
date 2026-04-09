export type BlogLanguage = "en" | "es" | "fr" | "hi" | "de" | "ja" | "ko";

export type PublishedBlogPost = {
  id: string;
  slug: string;
  language: BlogLanguage;
  title: string;
  excerpt: string;
  category: string;
  tags?: string[];
  body: string;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
};

export const blogLanguageOptions: Array<{ value: BlogLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "hi", label: "Hindi" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

export const blogUiCopy: Record<
  BlogLanguage,
  {
    eyebrow: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    backToBlog: string;
    backToHome: string;
    readingTimeLabel: string;
    publishedLabel: string;
  }
> = {
  en: {
    eyebrow: "Aether SEO journal",
    title: "Search-led articles, announcements, and launch notes.",
    description:
      "Every published article on Aether SEO lives here. No seeded placeholders, only live posts from the publishing console.",
    emptyTitle: "No blog posts are live yet.",
    emptyDescription:
      "Use the publishing console to create the first article. The public blog will update as soon as a post is published.",
    backToBlog: "Back to blog",
    backToHome: "Back to home",
    readingTimeLabel: "Read time",
    publishedLabel: "Published",
  },
  es: {
    eyebrow: "Aether SEO journal",
    title: "Search-led articles, announcements, and launch notes.",
    description:
      "Every published article on Aether SEO lives here. No seeded placeholders, only live posts from the publishing console.",
    emptyTitle: "No blog posts are live yet.",
    emptyDescription:
      "Use the publishing console to create the first article. The public blog will update as soon as a post is published.",
    backToBlog: "Back to blog",
    backToHome: "Back to home",
    readingTimeLabel: "Read time",
    publishedLabel: "Published",
  },
  hi: {
    eyebrow: "Aether SEO journal",
    title: "Search-led articles, announcements, and launch notes.",
    description:
      "Every published article on Aether SEO lives here. No seeded placeholders, only live posts from the publishing console.",
    emptyTitle: "No blog posts are live yet.",
    emptyDescription:
      "Use the publishing console to create the first article. The public blog will update as soon as a post is published.",
    backToBlog: "Back to blog",
    backToHome: "Back to home",
    readingTimeLabel: "Read time",
    publishedLabel: "Published",
  },
  fr: {
    eyebrow: "Aether SEO journal",
    title: "Search-led articles, announcements, and launch notes.",
    description:
      "Every published article on Aether SEO lives here. No seeded placeholders, only live posts from the publishing console.",
    emptyTitle: "No blog posts are live yet.",
    emptyDescription:
      "Use the publishing console to create the first article. The public blog will update as soon as a post is published.",
    backToBlog: "Back to blog",
    backToHome: "Back to home",
    readingTimeLabel: "Read time",
    publishedLabel: "Published",
  },
  de: {
    eyebrow: "Aether SEO journal",
    title: "Search-led articles, announcements, and launch notes.",
    description:
      "Every published article on Aether SEO lives here. No seeded placeholders, only live posts from the publishing console.",
    emptyTitle: "No blog posts are live yet.",
    emptyDescription:
      "Use the publishing console to create the first article. The public blog will update as soon as a post is published.",
    backToBlog: "Back to blog",
    backToHome: "Back to home",
    readingTimeLabel: "Read time",
    publishedLabel: "Published",
  },
  ja: {
    eyebrow: "Aether SEO journal",
    title: "Search-led articles, announcements, and launch notes.",
    description:
      "Every published article on Aether SEO lives here. No seeded placeholders, only live posts from the publishing console.",
    emptyTitle: "No blog posts are live yet.",
    emptyDescription:
      "Use the publishing console to create the first article. The public blog will update as soon as a post is published.",
    backToBlog: "Back to blog",
    backToHome: "Back to home",
    readingTimeLabel: "Read time",
    publishedLabel: "Published",
  },
  ko: {
    eyebrow: "Aether SEO journal",
    title: "Search-led articles, announcements, and launch notes.",
    description:
      "Every published article on Aether SEO lives here. No seeded placeholders, only live posts from the publishing console.",
    emptyTitle: "No blog posts are live yet.",
    emptyDescription:
      "Use the publishing console to create the first article. The public blog will update as soon as a post is published.",
    backToBlog: "Back to blog",
    backToHome: "Back to home",
    readingTimeLabel: "Read time",
    publishedLabel: "Published",
  },
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function estimateReadTime(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

export function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [] as string[];
}

export function normalizeArticleBody(value: string) {
  const source = value.trim();

  if (!source) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(source)) {
    return source;
  }

  return source
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.trim().replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

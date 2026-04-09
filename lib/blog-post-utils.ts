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

  const plainTextSource = extractPlainTextArticleSource(source);

  if (plainTextSource === null) {
    return source;
  }

  return buildStructuredArticleHtml(plainTextSource);
}

function extractPlainTextArticleSource(source: string) {
  if (!/<[a-z][\s\S]*>/i.test(source)) {
    return source;
  }

  if (/<(h[1-6]|ul|ol|li|blockquote|pre|table|figure|img|video|iframe|code|strong|em|a)\b/i.test(source)) {
    return null;
  }

  const plainText = source
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "")
    .trim();

  if (/<[a-z][\s\S]*>/i.test(plainText)) {
    return null;
  }

  return decodeHtmlEntities(plainText);
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInlineRichText(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function buildStructuredArticleHtml(source: string) {
  const lines = source.split(/\r?\n/);
  const blocks: string[] = [];
  const paragraphLines: string[] = [];
  let activeListType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  function flushParagraph() {
    if (!paragraphLines.length) {
      return;
    }

    const paragraph = paragraphLines.join(" ").replace(/\s+/g, " ").trim();
    paragraphLines.length = 0;

    if (paragraph) {
      blocks.push(`<p>${formatInlineRichText(paragraph)}</p>`);
    }
  }

  function flushList() {
    if (!activeListType || !listItems.length) {
      activeListType = null;
      listItems = [];
      return;
    }

    const listMarkup = listItems.map((item) => `<li>${formatInlineRichText(item)}</li>`).join("");
    blocks.push(`<${activeListType}>${listMarkup}</${activeListType}>`);
    activeListType = null;
    listItems = [];
  }

  function pushListItem(type: "ul" | "ol", item: string) {
    if (activeListType && activeListType !== type) {
      flushList();
    }

    activeListType = type;
    listItems.push(item.trim());
  }

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] || "";
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = parseStructuredHeading(line);
    if (heading) {
      flushParagraph();
      flushList();

      if (heading.level === 1 && blocks.length === 0) {
        continue;
      }

      const level = heading.level === 1 ? 2 : heading.level;
      blocks.push(`<h${level}>${formatInlineRichText(heading.text)}</h${level}>`);
      continue;
    }

    if (isLikelyStandaloneHeading(lines, index)) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${formatInlineRichText(line)}</h2>`);
      continue;
    }

    const unorderedItem = line.match(/^[-*•]\s+(.+)$/);
    if (unorderedItem) {
      flushParagraph();
      pushListItem("ul", unorderedItem[1]);
      continue;
    }

    const orderedItem = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedItem) {
      flushParagraph();
      pushListItem("ol", orderedItem[1]);
      continue;
    }

    if (activeListType && /^\s+/.test(rawLine) && listItems.length > 0) {
      listItems[listItems.length - 1] = `${listItems[listItems.length - 1]} ${line}`;
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.join("\n");
}

function parseStructuredHeading(line: string) {
  const prefixedHeading = line.match(/^H([1-6])\s*:\s*(.+)$/i);
  if (prefixedHeading) {
    return {
      level: Number(prefixedHeading[1]),
      text: prefixedHeading[2].trim(),
    };
  }

  const markdownHeading = line.match(/^(#{1,6})\s+(.+)$/);
  if (markdownHeading) {
    return {
      level: markdownHeading[1].length,
      text: markdownHeading[2].trim(),
    };
  }

  return null;
}

function isLikelyStandaloneHeading(lines: string[], index: number) {
  const line = lines[index]?.trim() || "";

  if (!line || parseStructuredHeading(line)) {
    return false;
  }

  if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
    return false;
  }

  if (line.length > 90 || /[.!?]$/.test(line)) {
    return false;
  }

  if (line.split(/\s+/).length > 10) {
    return false;
  }

  const hasText = /[A-Za-z0-9]/.test(line);
  const previousIsBlank = index === 0 || lines[index - 1]?.trim() === "";
  const nextIsBlank = index === lines.length - 1 || lines[index + 1]?.trim() === "";

  return hasText && previousIsBlank && nextIsBlank;
}

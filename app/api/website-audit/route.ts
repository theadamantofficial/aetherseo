import { NextResponse } from "next/server";
import { withOpenAIChatTemperature } from "@/lib/openai-chat-options";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
const MAX_HTML_CHARS = 900_000;

export const runtime = "nodejs";

type AuditSeverity = "Critical" | "Warning" | "Good";

type AuditIssue = {
  title: string;
  severity: AuditSeverity;
  detail: string;
};

type AuditSignals = {
  canonical: string;
  externalLinks: number;
  fetchStatus: string;
  finalUrl: string;
  firstH1: string;
  h1Count: number;
  h2Count: number;
  hasNoindex: boolean;
  hasOpenGraph: boolean;
  hasViewport: boolean;
  htmlLength: number;
  imageCount: number;
  imagesMissingAlt: number;
  internalLinks: number;
  language: string;
  metaDescription: string;
  metaDescriptionLength: number;
  responseStatus: number | null;
  schemaTypes: string[];
  textSample: string;
  title: string;
  titleLength: number;
  wordCount: number;
};

type AuditNarrative = {
  recommendations: string[];
  summary: string;
};

function resolveOpenAIKey() {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
    ""
  );
}

function resolveOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-5.5";
}

function resolveGeminiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ""
  );
}

function resolveGeminiModelPath() {
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  return model.startsWith("models/") ? model : `models/${model}`;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_match, entity: string) => {
    const lowerEntity = entity.toLowerCase();

    if (lowerEntity.startsWith("#x")) {
      const parsed = Number.parseInt(lowerEntity.slice(2), 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : " ";
    }

    if (lowerEntity.startsWith("#")) {
      const parsed = Number.parseInt(lowerEntity.slice(1), 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : " ";
    }

    return namedEntities[lowerEntity] ?? " ";
  });
}

function stripHtml(html: string) {
  return normalizeWhitespace(
    decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<template[\s\S]*?<\/template>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<\/(p|div|section|article|li|ul|ol|h1|h2|h3|h4|h5|h6|br)>/gi, ". ")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function clipText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 3, 0)).trimEnd()}...`;
}

function countWords(value: string) {
  return value ? value.split(/\s+/).filter(Boolean).length : 0;
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const body = tag
    .replace(/^<\s*[^\s/>]+/i, "")
    .replace(/\/?>\s*$/i, "");
  const attributePattern = /([^\s=/"'>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>`=]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(body)) !== null) {
    attributes[match[1].toLowerCase()] = decodeHtmlEntities(
      match[2] ?? match[3] ?? match[4] ?? "",
    );
  }

  return attributes;
}

function readTags(html: string, tagName: string) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
}

function readElementText(html: string, tagName: string) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function readMetaContent(html: string, key: string, attribute: "name" | "property") {
  const normalizedKey = key.toLowerCase();

  for (const tag of readTags(html, "meta")) {
    const attributes = parseAttributes(tag);
    if (attributes[attribute]?.toLowerCase() === normalizedKey) {
      return normalizeWhitespace(attributes.content ?? "");
    }
  }

  return "";
}

function readLinkHref(html: string, relation: string) {
  const normalizedRelation = relation.toLowerCase();

  for (const tag of readTags(html, "link")) {
    const attributes = parseAttributes(tag);
    const rels = (attributes.rel ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    if (rels.includes(normalizedRelation)) {
      return normalizeWhitespace(attributes.href ?? "");
    }
  }

  return "";
}

function toAbsoluteUrl(value: string, baseUrl: string) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function summarizeHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function readHeadings(html: string) {
  const headings: { level: number; text: string }[] = [];
  const headingPattern = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(html)) !== null) {
    headings.push({
      level: Number.parseInt(match[1], 10),
      text: stripHtml(match[2]),
    });
  }

  return headings;
}

function readImages(html: string) {
  return readTags(html, "img").map((tag) => parseAttributes(tag));
}

function readLinkCounts(html: string, finalUrl: string) {
  const finalHost = summarizeHost(finalUrl);
  let externalLinks = 0;
  let internalLinks = 0;

  for (const tag of readTags(html, "a")) {
    const attributes = parseAttributes(tag);
    const href = attributes.href?.trim();

    if (
      !href ||
      href.startsWith("#") ||
      /^(mailto|tel|javascript):/i.test(href)
    ) {
      continue;
    }

    const absoluteUrl = toAbsoluteUrl(href, finalUrl);
    if (!absoluteUrl) {
      continue;
    }

    if (summarizeHost(absoluteUrl) === finalHost) {
      internalLinks += 1;
    } else {
      externalLinks += 1;
    }
  }

  return { externalLinks, internalLinks };
}

function collectSchemaTypes(node: unknown, types: Set<string>, depth = 0) {
  if (depth > 6 || node === null || node === undefined) {
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      collectSchemaTypes(child, types, depth + 1);
    }
    return;
  }

  if (typeof node !== "object") {
    return;
  }

  const record = node as Record<string, unknown>;
  const schemaType = record["@type"];

  if (typeof schemaType === "string") {
    types.add(schemaType);
  } else if (Array.isArray(schemaType)) {
    for (const type of schemaType) {
      if (typeof type === "string") {
        types.add(type);
      }
    }
  }

  for (const key of ["@graph", "mainEntity", "itemListElement", "author", "publisher"]) {
    collectSchemaTypes(record[key], types, depth + 1);
  }
}

function readSchemaTypes(html: string) {
  const types = new Set<string>();
  const schemaPattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = schemaPattern.exec(html)) !== null) {
    try {
      collectSchemaTypes(JSON.parse(match[1]), types);
    } catch {
      types.add("Invalid JSON-LD");
    }
  }

  return [...types].slice(0, 10);
}

function looksPrivateHostname(hostname: string) {
  const value = hostname.toLowerCase();

  if (
    value === "localhost" ||
    value === "0.0.0.0" ||
    value === "::1" ||
    value.endsWith(".local") ||
    value.startsWith("127.") ||
    value.startsWith("10.") ||
    value.startsWith("192.168.")
  ) {
    return true;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) {
    return true;
  }

  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:")) {
    return true;
  }

  return false;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildAuditSignals({
  fetchStatus,
  finalUrl,
  html,
  responseStatus,
}: {
  fetchStatus: string;
  finalUrl: string;
  html: string;
  responseStatus: number | null;
}): AuditSignals {
  const title = readElementText(html, "title");
  const metaDescription = readMetaContent(html, "description", "name");
  const canonical = toAbsoluteUrl(readLinkHref(html, "canonical"), finalUrl);
  const viewport = readMetaContent(html, "viewport", "name");
  const robots = readMetaContent(html, "robots", "name");
  const ogTitle = readMetaContent(html, "og:title", "property");
  const ogDescription = readMetaContent(html, "og:description", "property");
  const language = parseAttributes(html.match(/<html\b[^>]*>/i)?.[0] ?? "").lang ?? "";
  const headings = readHeadings(html);
  const h1Headings = headings.filter((heading) => heading.level === 1);
  const h2Headings = headings.filter((heading) => heading.level === 2);
  const images = readImages(html);
  const linkCounts = readLinkCounts(html, finalUrl);
  const text = stripHtml(html);

  return {
    canonical,
    externalLinks: linkCounts.externalLinks,
    fetchStatus,
    finalUrl,
    firstH1: h1Headings[0]?.text ?? "",
    h1Count: h1Headings.length,
    h2Count: h2Headings.length,
    hasNoindex: /\bnoindex\b/i.test(robots),
    hasOpenGraph: Boolean(ogTitle || ogDescription),
    hasViewport: Boolean(viewport),
    htmlLength: html.length,
    imageCount: images.length,
    imagesMissingAlt: images.filter((image) => !normalizeWhitespace(image.alt ?? "")).length,
    internalLinks: linkCounts.internalLinks,
    language: normalizeWhitespace(language),
    metaDescription,
    metaDescriptionLength: metaDescription.length,
    responseStatus,
    schemaTypes: readSchemaTypes(html),
    textSample: clipText(text, 4000),
    title,
    titleLength: title.length,
    wordCount: countWords(text),
  };
}

function buildAuditIssues(signals: AuditSignals) {
  const issues: AuditIssue[] = [];

  issues.push({
    title: "Crawl access",
    severity:
      signals.responseStatus !== null && signals.responseStatus < 400 ? "Good" : "Critical",
    detail:
      signals.responseStatus !== null
        ? `${signals.fetchStatus} HTTP status ${signals.responseStatus}.`
        : signals.fetchStatus,
  });

  issues.push({
    title: "Indexability",
    severity: signals.hasNoindex ? "Critical" : "Good",
    detail: signals.hasNoindex
      ? "The page has a robots noindex directive, so search engines are being told not to index it."
      : "No robots noindex directive was found in the fetched HTML.",
  });

  issues.push({
    title: "Title tag",
    severity:
      signals.titleLength === 0
        ? "Critical"
        : signals.titleLength < 30 || signals.titleLength > 65
          ? "Warning"
          : "Good",
    detail: signals.titleLength
      ? `Title is ${signals.titleLength} characters: "${signals.title}".`
      : "No title tag was found in the fetched HTML.",
  });

  issues.push({
    title: "Meta description",
    severity:
      signals.metaDescriptionLength === 0
        ? "Critical"
        : signals.metaDescriptionLength < 70 || signals.metaDescriptionLength > 160
          ? "Warning"
          : "Good",
    detail: signals.metaDescriptionLength
      ? `Meta description is ${signals.metaDescriptionLength} characters.`
      : "No meta description was found.",
  });

  issues.push({
    title: "Heading structure",
    severity: signals.h1Count === 0 ? "Critical" : signals.h1Count > 1 ? "Warning" : "Good",
    detail:
      signals.h1Count === 1
        ? `One H1 was found: "${signals.firstH1}".`
        : `${signals.h1Count} H1 tags were found. A focused page should normally expose one primary H1.`,
  });

  issues.push({
    title: "Canonical URL",
    severity: signals.canonical ? "Good" : "Warning",
    detail: signals.canonical
      ? `Canonical URL resolves to ${signals.canonical}.`
      : "No canonical link tag was found.",
  });

  issues.push({
    title: "Mobile viewport",
    severity: signals.hasViewport ? "Good" : "Warning",
    detail: signals.hasViewport
      ? "A viewport meta tag was found for mobile rendering."
      : "No viewport meta tag was found, which can hurt mobile usability and SEO diagnostics.",
  });

  issues.push({
    title: "Internal linking",
    severity: signals.internalLinks >= 2 ? "Good" : "Warning",
    detail: `${signals.internalLinks} internal links and ${signals.externalLinks} external links were detected.`,
  });

  issues.push({
    title: "Image alt text",
    severity:
      signals.imageCount === 0 || signals.imagesMissingAlt === 0 ? "Good" : "Warning",
    detail:
      signals.imageCount === 0
        ? "No images were detected in the fetched HTML."
        : `${signals.imagesMissingAlt} of ${signals.imageCount} images are missing alt text.`,
  });

  issues.push({
    title: "Structured data",
    severity: signals.schemaTypes.length > 0 ? "Good" : "Warning",
    detail: signals.schemaTypes.length
      ? `Detected schema types: ${signals.schemaTypes.join(", ")}.`
      : "No JSON-LD structured data was detected.",
  });

  issues.push({
    title: "Content depth",
    severity: signals.wordCount >= 300 ? "Good" : "Warning",
    detail: `${signals.wordCount} visible words were extracted from the page HTML.`,
  });

  issues.push({
    title: "AI overview readiness",
    severity:
      signals.schemaTypes.length > 0 &&
      signals.h2Count >= 2 &&
      signals.metaDescriptionLength > 0 &&
      signals.wordCount >= 400
        ? "Good"
        : "Warning",
    detail:
      "AI visibility improves when the page has clear sections, concise metadata, enough explanatory copy, and structured data.",
  });

  issues.push({
    title: "Social preview metadata",
    severity: signals.hasOpenGraph ? "Good" : "Warning",
    detail: signals.hasOpenGraph
      ? "Open Graph title or description metadata was detected."
      : "Open Graph title and description metadata were not detected.",
  });

  const severityOrder: Record<AuditSeverity, number> = {
    Critical: 0,
    Warning: 1,
    Good: 2,
  };

  return issues.sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity]);
}

function scoreAudit(issues: AuditIssue[], signals: AuditSignals) {
  const criticalCount = issues.filter((issue) => issue.severity === "Critical").length;
  const warningCount = issues.filter((issue) => issue.severity === "Warning").length;
  let score = 100 - criticalCount * 14 - warningCount * 6;

  if (signals.responseStatus === null || signals.responseStatus >= 400) {
    score = Math.min(score, 45);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function recommendationForIssue(issue: AuditIssue) {
  switch (issue.title) {
    case "Crawl access":
      return "Fix crawl access and HTTP status before optimizing content";
    case "Indexability":
      return "Remove accidental noindex directives from pages meant to rank";
    case "Title tag":
      return "Rewrite the title tag around the primary keyword and page promise";
    case "Meta description":
      return "Add a concise meta description that previews the page value";
    case "Heading structure":
      return "Use one clear H1 and support it with descriptive H2 sections";
    case "Canonical URL":
      return "Add a canonical URL to consolidate duplicate ranking signals";
    case "Mobile viewport":
      return "Add mobile viewport metadata for cleaner responsive diagnostics";
    case "Internal linking":
      return "Add relevant internal links to connect this page to the SEO cluster";
    case "Image alt text":
      return "Add descriptive alt text to images that support the page topic";
    case "Structured data":
      return "Add JSON-LD schema that matches the visible page content";
    case "Content depth":
      return "Expand thin copy with useful sections that answer search intent";
    case "AI overview readiness":
      return "Improve AI overview readiness with FAQ-style answers and schema";
    case "Social preview metadata":
      return "Add Open Graph metadata for cleaner sharing and SERP context";
    default:
      return `Resolve ${issue.title.toLowerCase()} issues`;
  }
}

function buildFallbackNarrative(signals: AuditSignals, issues: AuditIssue[], score: number): AuditNarrative {
  const criticalCount = issues.filter((issue) => issue.severity === "Critical").length;
  const warningCount = issues.filter((issue) => issue.severity === "Warning").length;
  const problemIssues = issues.filter((issue) => issue.severity !== "Good");
  const recommendations = problemIssues.map(recommendationForIssue).slice(0, 3);

  return {
    recommendations:
      recommendations.length > 0
        ? recommendations
        : [
            "Keep metadata, headings, and schema aligned after every page update",
            "Monitor internal links as new content clusters are published",
            "Re-run the audit after major edits to confirm the page stays healthy",
          ],
    summary:
      `Real crawl audit completed for ${summarizeHost(signals.finalUrl)} with a score of ${score}. ` +
      `Found ${criticalCount} critical checks and ${warningCount} warning checks across metadata, crawlability, links, content, schema, and AI visibility signals.`,
  };
}

function parseJsonObject(source: string): Record<string, unknown> | null {
  try {
    return JSON.parse(source) as Record<string, unknown>;
  } catch {
    const firstBrace = source.indexOf("{");
    const lastBrace = source.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(source.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function normalizeNarrative(value: unknown, fallback: AuditNarrative): AuditNarrative {
  if (typeof value !== "object" || value === null) {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const recommendations = Array.isArray(record.recommendations)
    ? record.recommendations
        .filter((item): item is string => typeof item === "string")
        .map((item) => normalizeWhitespace(item))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return {
    recommendations: recommendations.length ? recommendations : fallback.recommendations,
    summary:
      typeof record.summary === "string" && record.summary.trim()
        ? normalizeWhitespace(record.summary)
        : fallback.summary,
  };
}

function buildNarrativePrompt(signals: AuditSignals, issues: AuditIssue[], score: number) {
  return `Create a concise website SEO audit narrative using only this real crawl data.

Score: ${score}
Signals:
${JSON.stringify(
  {
    ...signals,
    textSample: clipText(signals.textSample, 1400),
  },
  null,
  2,
)}

Checks:
${JSON.stringify(issues, null, 2)}

Return JSON:
{
  "summary": string,
  "recommendations": string[]
}

Requirements:
- recommendations must contain exactly 3 short action titles
- prioritize critical and warning checks
- mention if crawl access failed or returned a non-2xx/3xx status
- include GEO / AI overview readiness only when the crawl data supports it
- do not invent analytics, backlinks, rankings, traffic, Lighthouse data, Core Web Vitals, or facts outside the supplied signals`;
}

async function requestOpenAINarrative({
  apiKey,
  issues,
  score,
  signals,
}: {
  apiKey: string;
  issues: AuditIssue[];
  score: number;
  signals: AuditSignals;
}) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(withOpenAIChatTemperature({
      model: resolveOpenAIModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a technical SEO auditor. Use only the supplied crawl signals. Return valid JSON only.",
        },
        {
          role: "user",
          content: buildNarrativePrompt(signals, issues, score),
        },
      ],
    }, 0.2)),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI website audit narrative failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty audit narrative.");
  }

  return parseJsonObject(content);
}

async function requestGeminiNarrative({
  apiKey,
  issues,
  score,
  signals,
}: {
  apiKey: string;
  issues: AuditIssue[];
  score: number;
  signals: AuditSignals;
}) {
  const response = await fetch(`${GEMINI_ENDPOINT}/${resolveGeminiModelPath()}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildNarrativePrompt(signals, issues, score),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Gemini website audit narrative failed.");
  }

  const content = Array.isArray(payload?.candidates?.[0]?.content?.parts)
    ? payload.candidates[0].content.parts
        .map((part: { text?: unknown }) => (typeof part.text === "string" ? part.text : ""))
        .join("")
    : "";

  if (!content.trim()) {
    throw new Error("Gemini returned an empty audit narrative.");
  }

  return parseJsonObject(content);
}

async function requestBestAvailableNarrative(
  signals: AuditSignals,
  issues: AuditIssue[],
  score: number,
  fallback: AuditNarrative,
) {
  const geminiKey = resolveGeminiKey();
  const openAIKey = resolveOpenAIKey();
  const warnings: string[] = [];

  if (geminiKey) {
    try {
      const parsed = await requestGeminiNarrative({
        apiKey: geminiKey,
        issues,
        score,
        signals,
      });

      return {
        narrative: normalizeNarrative(parsed, fallback),
        warnings,
      };
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `Gemini audit narrative failed, so OpenAI paid fallback was tried. ${error.message}`
          : "Gemini audit narrative failed, so OpenAI paid fallback was tried.",
      );
    }
  }

  if (openAIKey) {
    try {
      const parsed = await requestOpenAINarrative({
        apiKey: openAIKey,
        issues,
        score,
        signals,
      });

      return {
        narrative: normalizeNarrative(parsed, fallback),
        warnings,
      };
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `OpenAI paid audit fallback failed, so deterministic crawl summary was used. ${error.message}`
          : "OpenAI paid audit fallback failed, so deterministic crawl summary was used.",
      );
    }
  }

  return {
    narrative: fallback,
    warnings,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
  if (!rawUrl) {
    return NextResponse.json({ error: "URL is required." }, { status: 400 });
  }

  let normalizedUrl = rawUrl;
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let url: URL;
  try {
    url = new URL(normalizedUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return NextResponse.json({ error: "Only public HTTP(S) URLs are supported." }, { status: 400 });
  }

  if (url.username || url.password || looksPrivateHostname(url.hostname)) {
    return NextResponse.json({ error: "Only public website URLs are allowed." }, { status: 400 });
  }

  let finalUrl = url.toString();
  let html = "";
  let responseStatus: number | null = null;
  let fetchStatus = "Homepage HTML fetched successfully.";

  try {
    const fetchResponse = await fetchWithTimeout(
      finalUrl,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "AetherAuditBot/2.0",
        },
        cache: "no-store",
        redirect: "follow",
      },
      12000,
    );

    responseStatus = fetchResponse.status;
    finalUrl = fetchResponse.url || finalUrl;
    html = (await fetchResponse.text()).slice(0, MAX_HTML_CHARS);

    if (!fetchResponse.ok) {
      fetchStatus = `Homepage request returned status ${fetchResponse.status}.`;
    }
  } catch (error) {
    fetchStatus =
      error instanceof Error && error.name === "AbortError"
        ? "Homepage fetch timed out. Audit is based on limited crawl signals."
        : "Homepage fetch failed. Audit is based on limited crawl signals.";
  }

  const signals = buildAuditSignals({
    fetchStatus,
    finalUrl,
    html,
    responseStatus,
  });
  const issues = buildAuditIssues(signals);
  const score = scoreAudit(issues, signals);
  const fallbackNarrative = buildFallbackNarrative(signals, issues, score);

  let narrative = fallbackNarrative;
  const warnings: string[] = [];

  try {
    const narrativeResult = await requestBestAvailableNarrative(
      signals,
      issues,
      score,
      fallbackNarrative,
    );
    narrative = narrativeResult.narrative;
    warnings.push(...narrativeResult.warnings);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "AI audit narrative fallback applied.");
  }

  const summary = warnings.length
    ? `${narrative.summary} ${warnings[0]}`
    : narrative.summary;

  return NextResponse.json({
    audit: {
      url: finalUrl,
      score,
      summary,
      issues,
      recommendations: narrative.recommendations,
    },
  });
}

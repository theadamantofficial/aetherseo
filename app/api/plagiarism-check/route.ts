import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import type {
  PlagiarismLockedSuggestion,
  PlagiarismMatch,
  PlagiarismPagePreview,
  PlagiarismPdfExport,
  PlagiarismRiskLevel,
  PlagiarismRunDraft,
} from "@/lib/plagiarism-scan";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export const runtime = "nodejs";

function resolveOpenAIKey() {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
    ""
  );
}

function resolveModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

function readBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function readTag(source: string, pattern: RegExp) {
  const match = source.match(pattern);
  return normalizeWhitespace(match?.[1] ?? "");
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

function readMetaContent(html: string, key: string, attribute: "name" | "property") {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return readTag(
    html,
    new RegExp(
      `<meta[^>]+${attribute}=["']${escapedKey}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
  );
}

function readLinkHref(html: string, relation: string) {
  const escapedRelation = relation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return readTag(
    html,
    new RegExp(`<link[^>]+rel=["'][^"']*${escapedRelation}[^"']*["'][^>]+href=["']([^"']*)["']`, "i"),
  );
}

function toAbsoluteUrl(value: string, baseUrl: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function countWords(value: string) {
  return value ? value.split(/\s+/).filter(Boolean).length : 0;
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean);
}

function extractCandidateLines(value: string, limit: number) {
  const seen = new Set<string>();

  return splitSentences(value)
    .filter((sentence) => sentence.length >= 45 && sentence.length <= 240)
    .filter((sentence) => {
      const normalized = sentence.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .slice(0, limit);
}

function clipText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 3, 0)).trimEnd()}...`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

function extractPreview(url: string, html: string, text: string): PlagiarismPagePreview {
  const canonicalUrl = toAbsoluteUrl(
    readTag(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    url,
  );
  const title = readTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || "Untitled page";
  const metaDescription = readMetaContent(html, "description", "name");
  const firstHeading = stripHtml(readTag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
  const imageUrl =
    toAbsoluteUrl(readMetaContent(html, "og:image", "property"), url) ||
    toAbsoluteUrl(readMetaContent(html, "twitter:image", "name"), url);
  const faviconUrl =
    toAbsoluteUrl(readLinkHref(html, "icon"), url) || toAbsoluteUrl("/favicon.ico", url);
  const sentences = splitSentences(text);
  const parsedUrl = new URL(url);

  return {
    canonicalUrl: canonicalUrl || url,
    excerpt: clipText(text, 320),
    faviconUrl,
    firstHeading,
    host: parsedUrl.host.replace(/^www\./, ""),
    imageUrl,
    metaDescription,
    sentenceCount: sentences.length,
    title,
    wordCount: countWords(text),
  };
}

function buildLockedSuggestions(preview: PlagiarismPagePreview): PlagiarismLockedSuggestion[] {
  return [
    {
      title: "Expanded keyword alternatives",
      body: `Unlock a larger keyword cluster tuned to ${preview.host} so rewrite suggestions can be grouped by search intent, not just phrasing.`,
      creditCost: 1,
      creditType: "prompt",
    },
    {
      title: "Alt text and metadata pack",
      body: "Unlock title-tag, meta-description, and alt-text variants for the flagged sections that need cleaner SEO packaging.",
      creditCost: 1,
      creditType: "prompt",
    },
    {
      title: "Replacement image directions",
      body: "Unlock image prompts and replacement visual angles when the page needs fresher creative support for the rewritten copy.",
      creditCost: 1,
      creditType: "image",
    },
  ];
}

function buildFallbackKeywords(preview: PlagiarismPagePreview, candidateLines: string[]) {
  const tokens = `${preview.title} ${preview.firstHeading} ${candidateLines.join(" ")}`.match(/[a-z0-9]{4,}/gi) ?? [];
  const blocked = new Set([
    "that",
    "this",
    "with",
    "your",
    "from",
    "have",
    "into",
    "page",
    "their",
    "about",
  ]);
  const counts = new Map<string, number>();

  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (blocked.has(normalized)) {
      continue;
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([keyword]) => keyword);
}

function buildFallbackMatches(candidateLines: string[]): PlagiarismMatch[] {
  const genericPatterns = [
    /\b(best|leading|cutting-edge|revolutionary|seamless|powerful|ultimate)\b/i,
    /\b(optimize|boost|scale|transform|unlock)\b/i,
    /\b(solution|platform|experience|growth)\b/i,
  ];

  return candidateLines.slice(0, 4).map((line, index) => {
    const risk = genericPatterns.some((pattern) => pattern.test(line))
      ? "High"
      : index === 0
        ? "Medium"
        : "Low";

    return {
      line,
      risk,
      reason:
        risk === "High"
          ? "The line relies on generic marketing phrasing and is easy to confuse with commodity SEO copy."
          : "The line can be made more specific so the page sounds more original and defensible.",
      alternative:
        risk === "High"
          ? `Replace the generic claim with a concrete outcome, audience, or workflow detail: ${line}`
          : `Tighten this idea with a clearer audience, proof point, or product angle: ${line}`,
      keywordAlternatives: [],
    };
  });
}

function inferRiskLabel(score: number) {
  if (score >= 80) {
    return "Low risk";
  }

  if (score >= 60) {
    return "Medium risk";
  }

  return "High risk";
}

function buildFallbackAlternativeDraft(
  preview: PlagiarismPagePreview,
  matches: PlagiarismMatch[],
) {
  const firstAlternative = matches[0]?.alternative || preview.metaDescription || preview.excerpt;
  const secondAlternative = matches[1]?.alternative || preview.firstHeading || preview.title;

  return [
    `Rewrite the opening around ${preview.host} with a more specific promise, then lead with a concrete business outcome instead of a generic category claim.`,
    firstAlternative,
    secondAlternative,
  ];
}

function buildPdfExport(
  preview: PlagiarismPagePreview,
  riskLabel: string,
  fileSlug: string,
  matches: PlagiarismMatch[],
): PlagiarismPdfExport {
  return {
    fileName: `${fileSlug || "page"}-plagiarism-check.pdf`,
    highlights: matches.slice(0, 3).map((match) => match.alternative),
    subtitle: `${riskLabel} similarity risk review for ${preview.host}`,
    title: "AI Plagiarism Check Export",
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

function normalizeMatchCollection(value: unknown, fallback: PlagiarismMatch[]) {
  const matches = Array.isArray(value)
    ? value
        .filter(
          (
            item,
          ): item is {
            alternative: string;
            keywordAlternatives?: unknown;
            line: string;
            reason: string;
            risk: string;
          } =>
            typeof item === "object" &&
            item !== null &&
            typeof item.line === "string" &&
            typeof item.reason === "string" &&
            typeof item.alternative === "string" &&
            typeof item.risk === "string",
        )
        .slice(0, 4)
        .map((item): PlagiarismMatch => {
          const risk: PlagiarismRiskLevel =
            item.risk === "High" || item.risk === "Medium" || item.risk === "Low"
              ? item.risk
              : "Medium";

          return {
            line: normalizeWhitespace(item.line),
            risk,
            reason: normalizeWhitespace(item.reason),
            alternative: normalizeWhitespace(item.alternative),
            keywordAlternatives: Array.isArray(item.keywordAlternatives)
              ? item.keywordAlternatives
                  .filter((keyword): keyword is string => typeof keyword === "string")
                  .map((keyword) => normalizeWhitespace(keyword))
                  .filter(Boolean)
                  .slice(0, 4)
              : [],
          };
        })
        .filter((item) => item.line && item.reason && item.alternative)
    : [];

  return matches.length ? matches : fallback;
}

async function requestPlagiarismAnalysis({
  apiKey,
  candidateLines,
  language,
  preview,
  textSample,
}: {
  apiKey: string;
  candidateLines: string[];
  language: string;
  preview: PlagiarismPagePreview;
  textSample: string;
}) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveModel(),
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an originality-focused SEO copy editor. You are not a legal plagiarism detector and cannot claim verified source matches. Use only the supplied page text. Return valid JSON only.",
        },
        {
          role: "user",
          content: `Review this page copy and return an AI-assisted plagiarism risk analysis in ${language}.

Page preview:
${JSON.stringify(preview, null, 2)}

Candidate lines:
${JSON.stringify(candidateLines, null, 2)}

Text sample:
${textSample}

Return JSON:
{
  "title": string,
  "summary": string,
  "score": number,
  "riskLabel": "Low risk" | "Medium risk" | "High risk",
  "matches": [
    {
      "line": string,
      "risk": "High" | "Medium" | "Low",
      "reason": string,
      "alternative": string,
      "keywordAlternatives": string[]
    }
  ],
  "alternativeDraft": string[],
  "keywords": string[],
  "altTextSuggestions": string[]
}

Requirements:
- score is 0 to 100, where higher means more original
- summary must clearly say this is a risk-based AI review, not verified external plagiarism proof
- return exactly 4 matches when enough content exists, otherwise fewer
- each alternative should be cleaner, more specific, and ready to paste
- keywordAlternatives should stay short
- alternativeDraft should contain 3 short paragraphs
- keywords should contain 6 SEO-friendly phrases
- altTextSuggestions should contain 3 concise suggestions`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI plagiarism analysis failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty plagiarism analysis.");
  }

  return parseJsonObject(content);
}

export async function POST(request: Request) {
  const apiKey = resolveOpenAIKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key. Set OPENAI_API_KEY in your environment." },
      { status: 500 },
    );
  }

  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 401 });
  }

  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token).catch(() => null);
  if (!decodedToken) {
    return NextResponse.json({ error: "Could not verify the Firebase ID token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
  const language = typeof body?.language === "string" ? body.language.trim() : "en";
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

  const db = getFirebaseAdminDb();
  const userSnapshot = await db.collection("users").doc(decodedToken.uid).get();
  const userData = userSnapshot.data() ?? {};

  if (userData.plan !== "paid") {
    return NextResponse.json(
      { error: "AI plagiarism check is available on paid plans only. Upgrade to continue." },
      { status: 403 },
    );
  }

  let html = "";
  let fetchStatus = "Page content fetched successfully.";
  let finalUrl = url.toString();

  try {
    const response = await fetchWithTimeout(
      url.toString(),
      {
        headers: {
          "User-Agent": "AetherPlagiarismBot/1.0",
        },
        cache: "no-store",
      },
      12000,
    );
    html = await response.text();
    finalUrl = response.url || finalUrl;
    if (!response.ok) {
      fetchStatus = `Page request returned status ${response.status}.`;
    }
  } catch (error) {
    fetchStatus =
      error instanceof Error && error.name === "AbortError"
        ? "Page fetch timed out. The review is based on limited page signals."
        : "Page fetch failed. The review is based on limited page signals.";
  }

  const text = stripHtml(html);
  const preview = extractPreview(finalUrl, html, text);
  const candidateLines = extractCandidateLines(text, 10);
  const textSample = clipText(text, 6000);
  const warnings = [fetchStatus].filter((warning) => warning !== "Page content fetched successfully.");

  const fallbackMatches = buildFallbackMatches(
    candidateLines.length ? candidateLines : [preview.excerpt || preview.metaDescription || preview.title],
  );
  const fallbackKeywords = buildFallbackKeywords(preview, candidateLines);

  let parsed: Record<string, unknown> | null = null;

  try {
    parsed = await requestPlagiarismAnalysis({
      apiKey,
      candidateLines,
      language,
      preview,
      textSample,
    });
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "AI analysis fallback applied.");
  }

  const matches = normalizeMatchCollection(parsed?.matches, fallbackMatches);
  const score =
    typeof parsed?.score === "number" && Number.isFinite(parsed.score)
      ? Math.max(0, Math.min(100, Math.round(parsed.score)))
      : Math.max(42, 88 - matches.length * 8);
  const riskLabel =
    typeof parsed?.riskLabel === "string" && parsed.riskLabel.trim()
      ? parsed.riskLabel.trim()
      : inferRiskLabel(score);
  const alternativeDraft = Array.isArray(parsed?.alternativeDraft)
    ? parsed.alternativeDraft
        .filter((paragraph): paragraph is string => typeof paragraph === "string")
        .map((paragraph) => normalizeWhitespace(paragraph))
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const keywords = Array.isArray(parsed?.keywords)
    ? parsed.keywords
        .filter((keyword): keyword is string => typeof keyword === "string")
        .map((keyword) => normalizeWhitespace(keyword))
        .filter(Boolean)
        .slice(0, 6)
    : [];
  const altTextSuggestions = Array.isArray(parsed?.altTextSuggestions)
    ? parsed.altTextSuggestions
        .filter((suggestion): suggestion is string => typeof suggestion === "string")
        .map((suggestion) => normalizeWhitespace(suggestion))
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const fileSlug = slugify(preview.host || preview.title || "page");

  const scan: PlagiarismRunDraft = {
    altTextSuggestions:
      altTextSuggestions.length > 0
        ? altTextSuggestions
        : [
            `Homepage hero for ${preview.host} with differentiated SEO messaging.`,
            `${preview.firstHeading || preview.title} with a clearer product-focused visual.`,
            `Editorial-style preview for ${preview.host} with a stronger originality angle.`,
          ],
    alternativeDraft:
      alternativeDraft.length > 0 ? alternativeDraft : buildFallbackAlternativeDraft(preview, matches),
    keywords: keywords.length > 0 ? keywords : fallbackKeywords,
    language,
    lockedSuggestions: buildLockedSuggestions(preview),
    matches,
    pdfExport: buildPdfExport(preview, riskLabel, fileSlug, matches),
    preview,
    riskLabel,
    score,
    summary:
      typeof parsed?.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : `AI review completed for ${preview.host}. This is a risk-based plagiarism check, not verified external source proof.`,
    title:
      typeof parsed?.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : `Plagiarism check for ${preview.host}`,
    url: finalUrl,
    warnings,
  };

  return NextResponse.json({ scan });
}

import path from "node:path";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MAX_INPUT_CHARS = 24000;
const CHUNK_SIZE = 6000;

export const runtime = "nodejs";

function resolveOpenAIKey() {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
    ""
  );
}

function resolveRewriteModel() {
  return (
    process.env.OPENAI_HIGH_MODEL ||
    process.env.OPENAI_REWRITE_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4.1"
  );
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

function normalizePdfText(value: string) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .split(/\n{2,}/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean)
    .join("\n\n");
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

function estimateAiContentPercent(value: string) {
  const text = normalizeWhitespace(value).toLowerCase();
  if (!text) {
    return 0;
  }

  const phrases = [
    "in today's",
    "in today s",
    "ever-evolving",
    "ever evolving",
    "delve into",
    "unlock the",
    "unlock your",
    "game-changer",
    "game changer",
    "leverage",
    "furthermore",
    "moreover",
    "in conclusion",
    "streamline",
    "seamless",
    "robust",
    "landscape",
    "valuable insights",
    "cutting-edge",
    "cutting edge",
  ];
  const sentences = splitSentences(value);
  const longSentenceCount = sentences.filter((sentence) => countWords(sentence) >= 24).length;
  const transitionCount = (text.match(/\b(furthermore|moreover|additionally|however|therefore)\b/g) ?? []).length;
  const listyCount = (text.match(/\b(firstly|secondly|thirdly|overall)\b/g) ?? []).length;
  const phraseCount = phrases.reduce((count, phrase) => count + (text.includes(phrase) ? 1 : 0), 0);
  const sentenceStarts = new Map<string, number>();

  for (const sentence of sentences) {
    const start = sentence.toLowerCase().split(/\s+/).slice(0, 2).join(" ");
    if (start) {
      sentenceStarts.set(start, (sentenceStarts.get(start) ?? 0) + 1);
    }
  }

  const repeatedStarts = [...sentenceStarts.values()].filter((count) => count > 1).length;
  const averageWords = sentences.length
    ? Math.round(sentences.reduce((total, sentence) => total + countWords(sentence), 0) / sentences.length)
    : 0;

  const score =
    18 +
    phraseCount * 7 +
    transitionCount * 4 +
    listyCount * 4 +
    longSentenceCount * 3 +
    repeatedStarts * 5 +
    Math.max(0, averageWords - 18);

  return Math.max(8, Math.min(96, Math.round(score)));
}

function chunkText(value: string, chunkSize: number) {
  const paragraphs = value.split(/\n{2,}/).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const candidate = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;

    if (candidate.length <= chunkSize) {
      currentChunk = candidate;
      continue;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    if (paragraph.length <= chunkSize) {
      currentChunk = paragraph;
      continue;
    }

    let remaining = paragraph;
    while (remaining.length > chunkSize) {
      const slice = remaining.slice(0, chunkSize);
      const breakpoint = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf(" "));
      const splitAt = breakpoint > chunkSize * 0.6 ? breakpoint + 1 : chunkSize;
      chunks.push(remaining.slice(0, splitAt).trim());
      remaining = remaining.slice(splitAt).trim();
    }

    currentChunk = remaining;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter(Boolean);
}

function normalizeHighlights(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => normalizeWhitespace(item))
        .slice(0, 3)
    : [];
}

async function requestChunkRewrite({
  apiKey,
  chunk,
  chunkIndex,
  language,
  totalChunks,
}: {
  apiKey: string;
  chunk: string;
  chunkIndex: number;
  language: string;
  totalChunks: number;
}) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveRewriteModel(),
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You rewrite uploaded document text so it sounds natural, specific, and original. Reduce generic AI phrasing and similarity risk without inventing facts. Always return valid JSON only.",
        },
        {
          role: "user",
          content: `Rewrite chunk ${chunkIndex} of ${totalChunks} in ${language}.

Return JSON:
{
  "rewrittenText": string,
  "highlights": string[]
}

Requirements:
- preserve the meaning, order, and major headings
- make the writing sound more human and less templated
- remove repetitive filler and generic marketing phrases
- avoid copying sentence structure too closely
- vary sentence length and rhythm so the prose does not read mechanically
- prefer direct language over abstract framing and generic setup lines
- avoid these phrases unless they already appear inside a quotation: furthermore, moreover, additionally, in conclusion, in today's, ever-evolving, delve into, unlock, leverage, seamless, robust, landscape
- keep the final length within roughly 20% of the source chunk
- do not add claims, numbers, or citations that are not present
- highlights should contain up to 3 short notes about what changed

Chunk:
${chunk}`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI PDF rewrite failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty PDF rewrite response.");
  }

  return parseJsonObject(content);
}

async function requestChunkHumanize({
  apiKey,
  chunkIndex,
  currentText,
  language,
  scoreHint,
  sourceChunk,
  totalChunks,
}: {
  apiKey: string;
  chunkIndex: number;
  currentText: string;
  language: string;
  scoreHint: number;
  sourceChunk: string;
  totalChunks: number;
}) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveRewriteModel(),
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior editor humanizing text that still reads AI-generated. Preserve facts, but rewrite with natural rhythm, cleaner phrasing, and less predictable sentence structure. Always return valid JSON only.",
        },
        {
          role: "user",
          content: `Humanize chunk ${chunkIndex} of ${totalChunks} in ${language}.

Current detector-style hint: ${scoreHint}/100 AI-like.

Return JSON:
{
  "rewrittenText": string,
  "highlights": string[]
}

Requirements:
- keep the same meaning and factual claims as the source
- remove stock transitions, listicle signposting, and generic marketing phrasing
- vary sentence openings and sentence length aggressively
- make the prose feel written by a careful human editor, not a template
- use contractions only where they sound natural
- prefer concrete nouns and verbs over abstract filler
- avoid phrases like: furthermore, moreover, additionally, in conclusion, overall, in today's, ever-evolving, delve into, unlock, leverage, seamless, robust, landscape, valuable insights
- do not add anecdotes, examples, data, or opinions that are not supported by the source
- keep the result publication-ready

Source chunk:
${sourceChunk}

Current rewritten chunk:
${currentText}`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI PDF humanization pass failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty PDF humanization response.");
  }

  return parseJsonObject(content);
}

async function requestRewriteSummary({
  apiKey,
  fileName,
  language,
  originalText,
  rewrittenText,
}: {
  apiKey: string;
  fileName: string;
  language: string;
  originalText: string;
  rewrittenText: string;
}) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveRewriteModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize rewritten document output for an SEO workspace. Always return valid JSON only.",
        },
        {
          role: "user",
          content: `Create a short title and summary for this cleaned PDF rewrite in ${language}.

Original file name: ${fileName}

Return JSON:
{
  "aiContentAfter": number,
  "aiContentBefore": number,
  "title": string,
  "summary": string
}

Requirements:
- title should be concise and publication-ready
- summary should be 1 to 2 sentences
- mention that the document was rewritten to reduce AI-style phrasing and duplication risk
- aiContentBefore and aiContentAfter must be integers from 0 to 100
- higher AI content means the text sounds more templated or machine-written
- aiContentAfter should usually be lower than aiContentBefore if the rewrite improved the text

Original text sample:
${originalText.slice(0, 4000)}

Rewritten text sample:
${rewrittenText.slice(0, 4000)}`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI PDF summary failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty PDF summary response.");
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

  const userSnapshot = await getFirebaseAdminDb().collection("users").doc(decodedToken.uid).get();
  const userData = userSnapshot.data() ?? {};
  const plan = userData.plan;
  const paidPlanTier = userData.paidPlanTier;

  if (plan !== "paid" || (paidPlanTier !== "pro" && paidPlanTier !== "agency")) {
    return NextResponse.json(
      { error: "PDF originality rewrite is available on Pro and Agency plans only." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const extractedText = typeof body?.extractedText === "string" ? body.extractedText : "";
  const language = typeof body?.language === "string" && body.language.trim() ? body.language.trim() : "en";
  const sourceFileName =
    typeof body?.sourceFileName === "string" && body.sourceFileName.trim()
      ? body.sourceFileName.trim()
      : "uploaded-document.pdf";
  const pageCount =
    typeof body?.pageCount === "number" && Number.isFinite(body.pageCount) && body.pageCount > 0
      ? Math.floor(body.pageCount)
      : 0;

  if (!extractedText.trim()) {
    return NextResponse.json({ error: "Extracted PDF text is required." }, { status: 400 });
  }

  const warnings: string[] = [];
  let normalizedText = normalizePdfText(extractedText);

  if (!normalizedText) {
    return NextResponse.json(
      { error: "The PDF did not contain readable text. Try a text-based PDF instead of a scanned image." },
      { status: 400 },
    );
  }

  if (normalizedText.length > MAX_INPUT_CHARS) {
    normalizedText = normalizedText.slice(0, MAX_INPUT_CHARS).trim();
    warnings.push("Large PDF detected. The rewrite used the first part of the document to keep the run reliable.");
  }

  const chunks = chunkText(normalizedText, CHUNK_SIZE);
  const rewrittenChunks: string[] = [];
  const highlightSet = new Set<string>();

  for (const [index, chunk] of chunks.entries()) {
    try {
      const parsed = await requestChunkRewrite({
        apiKey,
        chunk,
        chunkIndex: index + 1,
        language,
        totalChunks: chunks.length,
      });

      let rewrittenText =
        typeof parsed?.rewrittenText === "string" && parsed.rewrittenText.trim()
          ? parsed.rewrittenText.trim()
          : chunk;

      for (const item of normalizeHighlights(parsed?.highlights)) {
        highlightSet.add(item);
      }

      let aiScore = estimateAiContentPercent(rewrittenText);

      // Run up to two extra passes when the chunk still reads formulaic.
      for (let pass = 0; pass < 2 && aiScore > 24; pass += 1) {
        const humanized = await requestChunkHumanize({
          apiKey,
          chunkIndex: index + 1,
          currentText: rewrittenText,
          language,
          scoreHint: aiScore,
          sourceChunk: chunk,
          totalChunks: chunks.length,
        });

        const candidate =
          typeof humanized?.rewrittenText === "string" && humanized.rewrittenText.trim()
            ? humanized.rewrittenText.trim()
            : rewrittenText;
        const candidateScore = estimateAiContentPercent(candidate);

        // Prefer the candidate whenever it improves the heuristic score.
        if (candidateScore <= aiScore) {
          rewrittenText = candidate;
          aiScore = candidateScore;
        }

        for (const item of normalizeHighlights(humanized?.highlights)) {
          highlightSet.add(item);
        }
      }

      rewrittenChunks.push(rewrittenText);
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? error.message
          : `Chunk ${index + 1} could not be rewritten. Original text was kept for that section.`,
      );
      rewrittenChunks.push(chunk);
    }
  }

  const cleanedContent = rewrittenChunks.join("\n\n");
  const baseName = path.basename(sourceFileName, path.extname(sourceFileName));
  const fallbackTitle = baseName
    .split(/[-_]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "Cleaned PDF rewrite";
  const summaryFallback =
    "This document was rewritten to reduce AI-style phrasing and lower duplication risk while keeping the original meaning intact.";
  const fallbackAiContentBefore = estimateAiContentPercent(normalizedText);
  const fallbackAiContentAfter = Math.max(
    6,
    Math.min(fallbackAiContentBefore, estimateAiContentPercent(cleanedContent)),
  );

  let summaryPayload: Record<string, unknown> | null = null;
  try {
    summaryPayload = await requestRewriteSummary({
      apiKey,
      fileName: sourceFileName,
      language,
      originalText: normalizedText,
      rewrittenText: cleanedContent,
    });
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Could not summarize the cleaned PDF.");
  }

  return NextResponse.json({
    document: {
      cleanedContent,
      fileName: `${slugify(baseName) || "cleaned-pdf"}-originality-rewrite.txt`,
      highlights: [...highlightSet].slice(0, 6),
      model: resolveRewriteModel(),
      pageCount,
      sourceFileName,
      aiContentAfter:
        typeof summaryPayload?.aiContentAfter === "number" && Number.isFinite(summaryPayload.aiContentAfter)
          ? Math.max(
              0,
              Math.min(
                typeof summaryPayload?.aiContentBefore === "number" && Number.isFinite(summaryPayload.aiContentBefore)
                  ? Math.round(summaryPayload.aiContentBefore)
                  : fallbackAiContentBefore,
                Math.round(summaryPayload.aiContentAfter),
              ),
            )
          : fallbackAiContentAfter,
      aiContentBefore:
        typeof summaryPayload?.aiContentBefore === "number" && Number.isFinite(summaryPayload.aiContentBefore)
          ? Math.max(0, Math.min(100, Math.round(summaryPayload.aiContentBefore)))
          : fallbackAiContentBefore,
      summary:
        typeof summaryPayload?.summary === "string" && summaryPayload.summary.trim()
          ? summaryPayload.summary.trim()
          : summaryFallback,
      title:
        typeof summaryPayload?.title === "string" && summaryPayload.title.trim()
          ? summaryPayload.title.trim()
          : fallbackTitle,
      warnings,
      wordCount: countWords(cleanedContent),
    },
  });
}

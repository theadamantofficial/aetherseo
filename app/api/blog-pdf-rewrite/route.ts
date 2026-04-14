import path from "node:path";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
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

async function extractPdfText(file: File) {
  const parser = new PDFParse({ data: Buffer.from(await file.arrayBuffer()) });

  try {
    return await parser.getText();
  } finally {
    await parser.destroy().catch(() => undefined);
  }
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

async function requestRewriteSummary({
  apiKey,
  fileName,
  language,
  rewrittenText,
}: {
  apiKey: string;
  fileName: string;
  language: string;
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
  "title": string,
  "summary": string
}

Requirements:
- title should be concise and publication-ready
- summary should be 1 to 2 sentences
- mention that the document was rewritten to reduce AI-style phrasing and duplication risk

Text sample:
${rewrittenText.slice(0, 8000)}`,
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

  const formData = await request.formData().catch(() => null);
  const fileValue = formData?.get("file");
  const languageValue = formData?.get("language");
  const language = typeof languageValue === "string" && languageValue.trim() ? languageValue.trim() : "en";

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }

  if (!fileValue.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF uploads are supported." }, { status: 400 });
  }

  if (fileValue.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "PDF must be 10 MB or smaller." }, { status: 400 });
  }

  let extracted;
  try {
    extracted = await extractPdfText(fileValue);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read the uploaded PDF." },
      { status: 400 },
    );
  }

  const warnings: string[] = [];
  let normalizedText = normalizePdfText(extracted.text || "");

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

      const rewrittenText =
        typeof parsed?.rewrittenText === "string" && parsed.rewrittenText.trim()
          ? parsed.rewrittenText.trim()
          : chunk;

      rewrittenChunks.push(rewrittenText);

      if (Array.isArray(parsed?.highlights)) {
        for (const item of parsed.highlights) {
          if (typeof item === "string" && item.trim()) {
            highlightSet.add(normalizeWhitespace(item));
          }
        }
      }
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
  const baseName = path.basename(fileValue.name, path.extname(fileValue.name));
  const fallbackTitle = baseName
    .split(/[-_]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "Cleaned PDF rewrite";
  const summaryFallback =
    "This document was rewritten to reduce AI-style phrasing and lower duplication risk while keeping the original meaning intact.";

  let summaryPayload: Record<string, unknown> | null = null;
  try {
    summaryPayload = await requestRewriteSummary({
      apiKey,
      fileName: fileValue.name,
      language,
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
      pageCount: extracted.total,
      sourceFileName: fileValue.name,
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

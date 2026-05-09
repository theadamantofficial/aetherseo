import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import type { GeneratedBlogImageAsset } from "@/lib/firebase-data";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_IMAGE_ENDPOINT = "https://api.openai.com/v1/images/generations";
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const IMAGE_BLOB_PREFIX = "blog-images/";

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
  return process.env.OPENAI_MODEL || "gpt-5.5";
}

function resolveAnthropicKey() {
  return process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || "";
}

function resolveClaudeModel() {
  return process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
}

function resolveImageModel() {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
}

function readBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

function extractJsonObject(source: string): Record<string, unknown> | null {
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

function normalizeCreditCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function normalizeStringArray(value: unknown, limit: number) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, limit)
    : [];
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
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

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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

function buildBlogDetectorText(draft: Record<string, unknown>, paragraphCount: number) {
  return [
    readString(draft.title),
    readString(draft.metaDescription),
    readString(draft.previewMeta),
    ...normalizeStringArray(draft.paragraphs, paragraphCount),
    readString(draft.sectionTitle),
    readString(draft.sectionBody),
    ...normalizeStringArray(draft.bullets, 3),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildPersistentImagePath(fileName: string) {
  return path.posix.join(IMAGE_BLOB_PREFIX, `${Date.now()}-${fileName}`);
}

async function reserveImageCredit(uid: string) {
  const db = getFirebaseAdminDb();
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    const userData = userSnapshot.data() ?? {};
    const imageCredits = normalizeCreditCount(userData.assistantImageCredits);

    if (imageCredits < 1) {
      throw new Error("SEO image credits are empty. Buy a $5 image credit before adding it to this run.");
    }

    transaction.set(
      userRef,
      {
        assistantImageCredits: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  return 1;
}

async function restoreImageCredit(uid: string, count: number) {
  if (!count) {
    return;
  }

  await getFirebaseAdminDb().collection("users").doc(uid).set(
    {
      assistantImageCredits: FieldValue.increment(count),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

function buildFallbackImageAsset(keyword: string, title: string): GeneratedBlogImageAsset {
  const slug = slugify(keyword || title || "seo-blog-image") || "seo-blog-image";

  return {
    alt: `${title || keyword} blog illustration`,
    fileName: `${slug}.png`,
    imageUrl: null,
    prompt:
      `Create a clean editorial SEO blog illustration for "${title || keyword}". ` +
      `Show a modern startup marketing workspace with analytics, content planning, and website growth cues. ` +
      "Use a polished SaaS visual style, natural lighting, and no text overlay.",
    title: title || keyword || "SEO blog image",
  };
}

function buildLocalBlogDraft({
  includeSeoImageAsset,
  keyword,
  language,
  paragraphCount,
  tone,
}: {
  includeSeoImageAsset: boolean;
  keyword: string;
  language: string;
  paragraphCount: number;
  tone: string;
}): Record<string, unknown> {
  const title = `${keyword} SEO Strategy`;
  const paragraphTemplates = [
    `${keyword} works best when the page is built around a clear search intent, not a loose collection of related terms. Start by deciding what the reader needs to understand, compare, or do next, then make every section support that outcome.`,
    `For a ${tone.toLowerCase()} article, the strongest structure is practical: define the problem, show the workflow, explain the tradeoffs, and give the reader a simple next step. This keeps the content useful for humans while giving search engines a cleaner topic map.`,
    `A good optimization pass should tighten the title, meta description, headings, internal links, and supporting examples. Those details help the page feel more specific and reduce the generic phrasing that often makes AI-generated content sound flat.`,
    `The final draft should include evidence from the product workflow, customer questions, or implementation details. That kind of specificity improves EEAT signals without making claims the business cannot support.`,
    `After publishing, re-run the audit, check whether the page is crawlable, and update the article as new search questions appear. SEO quality improves when content becomes part of a maintained system rather than a one-time draft.`,
    `Use the article as a cluster anchor by linking it to related guides, comparison pages, and conversion pages. This helps readers move naturally through the site and gives crawlers a clearer view of the topic hierarchy.`,
  ];

  return {
    bullets: [
      "Match the opening section to the dominant search intent.",
      "Use specific workflow details instead of broad marketing claims.",
      "Refresh metadata and internal links after each major edit.",
    ],
    imageAsset: includeSeoImageAsset ? buildFallbackImageAsset(keyword, title) : null,
    metaDescription: `Build a practical ${keyword} strategy with clearer intent, stronger structure, and SEO-ready optimization steps.`,
    paragraphs: paragraphTemplates.slice(0, paragraphCount),
    previewMeta:
      `Fallback draft generated in ${language} after provider retries. Review before publishing for brand voice and local nuance.`,
    sectionBody:
      "Use this fallback as a structured starting point, then refine examples, proof points, and calls to action around the actual product or service.",
    sectionTitle: "Publishing Checklist",
    title,
  };
}

function buildBlogPrompt({
  includeSeoImageAsset,
  keyword,
  language,
  length,
  paragraphCount,
  tone,
}: {
  includeSeoImageAsset: boolean;
  keyword: string;
  language: string;
  length: string;
  paragraphCount: number;
  tone: string;
}) {
  return `Create a humanized SEO blog draft in ${language} for the keyword "${keyword}".

Tone: ${tone}
Length: ${length}
Include SEO image metadata: ${includeSeoImageAsset ? "yes" : "no"}

Return JSON with this exact shape:
{
  "title": string,
  "metaDescription": string,
  "previewMeta": string,
  "paragraphs": string[],
  "sectionTitle": string,
  "sectionBody": string,
  "bullets": string[],
  "imageAsset": ${includeSeoImageAsset ? `{"prompt": string, "alt": string, "title": string, "fileName": string}` : "null"}
}

Requirements:
- title under 70 characters
- metaDescription under 160 characters
- previewMeta should be a short editorial summary
- exactly ${paragraphCount} paragraphs
- exactly 3 bullets
- practical, publishable, startup-oriented writing
- use natural sentence variation and avoid robotic repetition
- strengthen EEAT with concrete workflow detail, not unverifiable claims
- no markdown fences
${includeSeoImageAsset ? `- imageAsset.prompt should describe a realistic blog hero image related to the article
- imageAsset.alt must be concise and under 125 characters
- imageAsset.title should read like an editorial image title
- imageAsset.fileName must be lowercase kebab-case and end in .png
- avoid brand logos or text overlays in the image prompt` : "- imageAsset must be null"}`;
}

async function requestOpenAIBlogDraft({
  apiKey,
  includeSeoImageAsset,
  keyword,
  language,
  length,
  paragraphCount,
  tone,
}: {
  apiKey: string;
  includeSeoImageAsset: boolean;
  keyword: string;
  language: string;
  length: string;
  paragraphCount: number;
  tone: string;
}) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveModel(),
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write high-quality SEO blog drafts. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: buildBlogPrompt({
            includeSeoImageAsset,
            keyword,
            language,
            length,
            paragraphCount,
            tone,
          }),
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI blog generation failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = extractJsonObject(content);
  if (!parsed) {
    throw new Error("Could not parse OpenAI JSON response.");
  }

  return parsed;
}

async function requestOpenAIHumanizedBlogDraft({
  apiKey,
  draft,
  includeSeoImageAsset,
  keyword,
  language,
  paragraphCount,
  scoreHint,
  tone,
}: {
  apiKey: string;
  draft: Record<string, unknown>;
  includeSeoImageAsset: boolean;
  keyword: string;
  language: string;
  paragraphCount: number;
  scoreHint: number;
  tone: string;
}) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveModel(),
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior SEO editor humanizing AI-generated blog drafts. Preserve meaning and SEO structure. Return valid JSON only.",
        },
        {
          role: "user",
          content: `Regenerate this SEO blog draft in ${language} so it reads like careful human editorial work, not AI-written content.

Keyword: ${keyword}
Tone: ${tone}
Current detector-style AI content estimate: ${scoreHint}/100

Draft:
${JSON.stringify(draft, null, 2)}

Return JSON with this exact shape:
{
  "title": string,
  "metaDescription": string,
  "previewMeta": string,
  "paragraphs": string[],
  "sectionTitle": string,
  "sectionBody": string,
  "bullets": string[],
  "imageAsset": ${includeSeoImageAsset ? `{"prompt": string, "alt": string, "title": string, "fileName": string}` : "null"}
}

Requirements:
- keep the same topic, search intent, and factual scope
- exactly ${paragraphCount} paragraphs and exactly 3 bullets
- title under 70 characters and metaDescription under 160 characters
- remove AI tells: generic setup lines, repetitive sentence starts, predictable transitions, filler, and abstract marketing language
- vary sentence length and rhythm naturally
- add concrete workflow phrasing without inventing statistics, case studies, customers, citations, or claims
- preserve or improve the imageAsset metadata when present
- no markdown fences`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI blog humanization failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty blog humanization response.");
  }

  const parsed = extractJsonObject(content);
  if (!parsed) {
    throw new Error("Could not parse OpenAI blog humanization JSON response.");
  }

  return parsed;
}

async function requestClaudeBlogDraft({
  apiKey,
  includeSeoImageAsset,
  keyword,
  language,
  length,
  paragraphCount,
  tone,
}: {
  apiKey: string;
  includeSeoImageAsset: boolean;
  keyword: string;
  language: string;
  length: string;
  paragraphCount: number;
  tone: string;
}) {
  const response = await fetch(ANTHROPIC_ENDPOINT, {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      max_tokens: 5000,
      messages: [
        {
          role: "user",
          content: buildBlogPrompt({
            includeSeoImageAsset,
            keyword,
            language,
            length,
            paragraphCount,
            tone,
          }),
        },
      ],
      model: resolveClaudeModel(),
      system:
        "You are Claude writing the main blog draft and humanization pass for an SEO content workflow. Return valid JSON only.",
      temperature: 0.65,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Claude blog generation failed.");
  }

  const content = Array.isArray(payload?.content)
    ? payload.content
        .map((part: { text?: unknown; type?: unknown }) =>
          part.type === "text" && typeof part.text === "string" ? part.text : "",
        )
        .join("")
    : "";

  if (!content.trim()) {
    throw new Error("Claude returned an empty response.");
  }

  const parsed = extractJsonObject(content);
  if (!parsed) {
    throw new Error("Could not parse Claude JSON response.");
  }

  return parsed;
}

async function generateSeoImage({
  apiKey,
  asset,
}: {
  apiKey: string;
  asset: GeneratedBlogImageAsset;
}) {
  const response = await fetch(OPENAI_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      background: "opaque",
      model: resolveImageModel(),
      output_format: "png",
      prompt: asset.prompt,
      quality: "high",
      size: "1536x1024",
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI image generation failed.");
  }

  const b64Json =
    payload?.data?.[0]?.b64_json ||
    payload?.output?.[0]?.b64_json ||
    payload?.b64_json ||
    "";

  if (typeof b64Json !== "string" || !b64Json.trim()) {
    throw new Error("OpenAI returned an empty image response.");
  }

  const imageBuffer = Buffer.from(b64Json, "base64");

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(buildPersistentImagePath(asset.fileName), imageBuffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "image/png",
    });

    return {
      asset: {
        ...asset,
        imageUrl: blob.url,
      },
      ephemeralImageDataUrl: null,
    };
  }

  return {
    asset,
    ephemeralImageDataUrl: `data:image/png;base64,${b64Json}`,
  };
}

export async function POST(request: Request) {
  const openAIKey = resolveOpenAIKey();
  const anthropicKey = resolveAnthropicKey();
  if (!openAIKey && !anthropicKey) {
    return NextResponse.json(
      { error: "Missing AI API key. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment." },
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
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
  const tone = typeof body?.tone === "string" ? body.tone.trim() : "Professional & Authoritative";
  const length = typeof body?.length === "string" ? body.length.trim() : "Medium";
  const language = typeof body?.language === "string" ? body.language.trim() : "en";
  const includeSeoImageAsset = Boolean(body?.includeSeoImageAsset);

  if (!keyword) {
    return NextResponse.json({ error: "Keyword is required." }, { status: 400 });
  }

  if (includeSeoImageAsset && !openAIKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key. SEO image generation requires OPENAI_API_KEY." },
      { status: 500 },
    );
  }

  const paragraphCount = length.toLowerCase().includes("long")
    ? 6
    : length.toLowerCase().includes("short")
      ? 3
      : 4;

  let reservedImageCredits = 0;
  const creditsUsed = { image: 0 };
  const warnings: string[] = [];

  try {
    if (includeSeoImageAsset) {
      reservedImageCredits = await reserveImageCredit(decodedToken.uid);
      creditsUsed.image = reservedImageCredits;
    }

    let parsed: Record<string, unknown>;

    if (anthropicKey) {
      try {
        parsed = await requestClaudeBlogDraft({
          apiKey: anthropicKey,
          includeSeoImageAsset,
          keyword,
          language,
          length,
          paragraphCount,
          tone,
        });
      } catch (error) {
        if (!openAIKey) {
          warnings.push(
            error instanceof Error
              ? `Claude blog generation failed and no OpenAI fallback key is configured, so a local structured draft was used. ${error.message}`
              : "Claude blog generation failed and no OpenAI fallback key is configured, so a local structured draft was used.",
          );
          parsed = buildLocalBlogDraft({
            includeSeoImageAsset,
            keyword,
            language,
            paragraphCount,
            tone,
          });
        } else {
          warnings.push(
            error instanceof Error
              ? `Claude blog generation failed, so OpenAI fallback was used. ${error.message}`
              : "Claude blog generation failed, so OpenAI fallback was used.",
          );
          try {
            parsed = await requestOpenAIBlogDraft({
              apiKey: openAIKey,
              includeSeoImageAsset,
              keyword,
              language,
              length,
              paragraphCount,
              tone,
            });
          } catch (fallbackError) {
            warnings.push(
              fallbackError instanceof Error
                ? `OpenAI paid blog fallback failed, so a local structured draft was used. ${fallbackError.message}`
                : "OpenAI paid blog fallback failed, so a local structured draft was used.",
            );
            parsed = buildLocalBlogDraft({
              includeSeoImageAsset,
              keyword,
              language,
              paragraphCount,
              tone,
            });
          }
        }
      }
    } else {
      try {
        parsed = await requestOpenAIBlogDraft({
          apiKey: openAIKey,
          includeSeoImageAsset,
          keyword,
          language,
          length,
          paragraphCount,
          tone,
        });
      } catch (error) {
        warnings.push(
          error instanceof Error
            ? `OpenAI blog generation failed, so a local structured draft was used. ${error.message}`
            : "OpenAI blog generation failed, so a local structured draft was used.",
        );
        parsed = buildLocalBlogDraft({
          includeSeoImageAsset,
          keyword,
          language,
          paragraphCount,
          tone,
        });
      }
    }

    const aiContentBefore = estimateAiContentPercent(buildBlogDetectorText(parsed, paragraphCount));
    let aiContentAfter = aiContentBefore;

    if (openAIKey && aiContentBefore >= 35) {
      for (let pass = 1; pass <= 2 && aiContentAfter >= 25; pass += 1) {
        try {
          const regenerated = await requestOpenAIHumanizedBlogDraft({
            apiKey: openAIKey,
            draft: parsed,
            includeSeoImageAsset,
            keyword,
            language,
            paragraphCount,
            scoreHint: aiContentAfter,
            tone,
          });
          const regeneratedScore = estimateAiContentPercent(
            buildBlogDetectorText(regenerated, paragraphCount),
          );

          if (regeneratedScore <= aiContentAfter) {
            parsed = regenerated;
            aiContentAfter = regeneratedScore;
            warnings.push(
              `AI-content refinement pass ${pass} reduced the detector-style estimate to ${aiContentAfter}%.`,
            );
          } else {
            warnings.push(
              `AI-content refinement pass ${pass} did not improve the detector-style estimate, so the previous draft was kept.`,
            );
            break;
          }
        } catch (error) {
          warnings.push(
            error instanceof Error
              ? `AI-content refinement failed, so the best available draft was kept. ${error.message}`
              : "AI-content refinement failed, so the best available draft was kept.",
          );
          break;
        }
      }
    } else if (!openAIKey && aiContentBefore >= 35) {
      warnings.push(
        "AI-content estimate was high, but no OpenAI paid key is configured for the regeneration pass.",
      );
    }

    let imageAsset: GeneratedBlogImageAsset | null =
      includeSeoImageAsset &&
      parsed.imageAsset &&
      typeof parsed.imageAsset === "object" &&
      typeof (parsed.imageAsset as { prompt?: unknown }).prompt === "string" &&
      typeof (parsed.imageAsset as { alt?: unknown }).alt === "string" &&
      typeof (parsed.imageAsset as { title?: unknown }).title === "string" &&
      typeof (parsed.imageAsset as { fileName?: unknown }).fileName === "string"
        ? {
            alt: ((parsed.imageAsset as { alt: string }).alt || "").trim(),
            fileName:
              ((parsed.imageAsset as { fileName: string }).fileName || "").trim() ||
              `${slugify(keyword) || "seo-blog-image"}.png`,
            imageUrl: null,
            prompt: ((parsed.imageAsset as { prompt: string }).prompt || "").trim(),
            title: ((parsed.imageAsset as { title: string }).title || "").trim(),
          }
        : includeSeoImageAsset
          ? buildFallbackImageAsset(keyword, typeof parsed.title === "string" ? parsed.title : keyword)
          : null;

    let ephemeralImageDataUrl: string | null = null;

    if (imageAsset) {
      try {
        const generatedImage = await generateSeoImage({
          apiKey: openAIKey,
          asset: {
            ...imageAsset,
            fileName: imageAsset.fileName.endsWith(".png")
              ? imageAsset.fileName
              : `${slugify(imageAsset.fileName) || "seo-blog-image"}.png`,
          },
        });
        imageAsset = generatedImage.asset;
        ephemeralImageDataUrl = generatedImage.ephemeralImageDataUrl;
      } catch (error) {
        await restoreImageCredit(decodedToken.uid, 1);
        reservedImageCredits = 0;
        creditsUsed.image = 0;
        warnings.push(
          error instanceof Error
            ? `SEO image generation failed, so the $5 image credit was restored. ${error.message}`
            : "SEO image generation failed, so the $5 image credit was restored.",
        );
        imageAsset = null;
      }
    }

    return NextResponse.json({
      blog: {
        keyword,
        tone,
        length,
        language,
        title: typeof parsed.title === "string" ? parsed.title : `Draft for ${keyword}`,
        metaDescription:
          typeof parsed.metaDescription === "string"
            ? parsed.metaDescription
            : `AI-generated article for ${keyword}.`,
        previewMeta:
          typeof parsed.previewMeta === "string"
            ? parsed.previewMeta
            : `Generated in ${language} with a ${tone} tone.`,
        paragraphs: normalizeStringArray(parsed.paragraphs, paragraphCount),
        sectionTitle:
          typeof parsed.sectionTitle === "string" ? parsed.sectionTitle : "Key Takeaway",
        sectionBody:
          typeof parsed.sectionBody === "string"
            ? parsed.sectionBody
            : "This section outlines the most practical next step for the topic.",
        bullets: normalizeStringArray(parsed.bullets, 3),
        imageAsset,
      },
      creditsUsed,
      aiContent: {
        after: aiContentAfter,
        before: aiContentBefore,
      },
      ephemeralImageDataUrl,
      warnings,
    });
  } catch (error) {
    await restoreImageCredit(decodedToken.uid, reservedImageCredits).catch(() => undefined);
    const message =
      error instanceof Error ? error.message : "Could not generate the blog.";
    const status = message.includes("credit") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

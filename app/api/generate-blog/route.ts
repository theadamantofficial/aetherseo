import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import type { GeneratedBlogImageAsset } from "@/lib/firebase-data";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_IMAGE_ENDPOINT = "https://api.openai.com/v1/images/generations";
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
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
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
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
  const tone = typeof body?.tone === "string" ? body.tone.trim() : "Professional & Authoritative";
  const length = typeof body?.length === "string" ? body.length.trim() : "Medium";
  const language = typeof body?.language === "string" ? body.language.trim() : "en";
  const includeSeoImageAsset = Boolean(body?.includeSeoImageAsset);

  if (!keyword) {
    return NextResponse.json({ error: "Keyword is required." }, { status: 400 });
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
            content: `Create an SEO blog draft in ${language} for the keyword "${keyword}".

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
- no markdown fences
${includeSeoImageAsset ? `- imageAsset.prompt should describe a realistic blog hero image related to the article
- imageAsset.alt must be concise and under 125 characters
- imageAsset.title should read like an editorial image title
- imageAsset.fileName must be lowercase kebab-case and end in .png
- avoid brand logos or text overlays in the image prompt` : "- imageAsset must be null"}`,
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
          apiKey,
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

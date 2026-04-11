import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_IMAGE_ENDPOINT = "https://api.openai.com/v1/images/generations";
const IMAGE_BLOB_PREFIX = "assistant-images/";

type AssistantActionType =
  | "blog-brief"
  | "metadata"
  | "keyword-cluster"
  | "schema-faq"
  | "fix-plan";

type AssistantSection = {
  heading: string;
  body: string;
  bullets: string[];
};

type AssistantReadyOutput = {
  label: string;
  content: string;
  bullets: string[];
};

type AssistantAlternative = {
  title: string;
  summary: string;
  sections: AssistantSection[];
};

type AssistantPromptPack = {
  brief: string;
  conductor: string;
  cursor: string;
};

type AssistantImageAsset = {
  alt: string;
  fileName: string;
  imageUrl: string | null;
  prompt: string;
  title: string;
};

const SUPPORTED_ACTIONS: AssistantActionType[] = [
  "blog-brief",
  "metadata",
  "keyword-cluster",
  "schema-faq",
  "fix-plan",
];

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

function isAssistantAction(value: unknown): value is AssistantActionType {
  return typeof value === "string" && SUPPORTED_ACTIONS.includes(value as AssistantActionType);
}

function readTag(source: string, pattern: RegExp) {
  const match = source.match(pattern);
  return match?.[1]?.replace(/\s+/g, " ").trim() || "";
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

function normalizeSections(value: unknown, fallback: AssistantSection[]) {
  const sections = Array.isArray(value)
    ? value
        .filter(
          (
            item,
          ): item is {
            heading: string;
            body: string;
            bullets?: unknown;
          } =>
            typeof item === "object" &&
            item !== null &&
            typeof item.heading === "string" &&
            typeof item.body === "string",
        )
        .slice(0, 3)
        .map((item) => ({
          heading: item.heading.trim(),
          body: item.body.trim(),
          bullets: normalizeStringArray(item.bullets, 5),
        }))
        .filter((item) => item.heading && item.body)
    : [];

  return sections.length ? sections : fallback;
}

function normalizeReadyToUse(value: unknown, fallback: AssistantReadyOutput[]) {
  const readyToUse = Array.isArray(value)
    ? value
        .filter(
          (
            item,
          ): item is {
            label: string;
            content: string;
            bullets?: unknown;
          } =>
            typeof item === "object" &&
            item !== null &&
            typeof item.label === "string" &&
            typeof item.content === "string",
        )
        .slice(0, 2)
        .map((item) => ({
          label: item.label.trim(),
          content: item.content.trim(),
          bullets: normalizeStringArray(item.bullets, 5),
        }))
        .filter((item) => item.label && item.content)
    : [];

  return readyToUse.length ? readyToUse : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildActionTitle(action: AssistantActionType) {
  switch (action) {
    case "blog-brief":
      return "SEO Blog Brief";
    case "metadata":
      return "Metadata Pack";
    case "keyword-cluster":
      return "Keyword Cluster";
    case "schema-faq":
      return "Schema and FAQ Pack";
    case "fix-plan":
      return "SEO Fix Plan";
  }
}

function buildFallbackSections(action: AssistantActionType, input: string, url: string): AssistantSection[] {
  const pageLabel = url || "the target page";

  switch (action) {
    case "blog-brief":
      return [
        {
          heading: "Audience and search intent",
          body: `Use "${input}" as the core topic and align the article to a clear commercial or informational search intent.`,
          bullets: [
            "Define the ICP and problem being solved",
            "Match the page angle to the strongest search intent",
            "Lead with the sharpest differentiator in the introduction",
          ],
        },
        {
          heading: "Outline and talking points",
          body: "Structure the draft around practical sections that move from problem framing into solution depth.",
          bullets: [
            "Open with the market problem and stakes",
            "Break the article into 3 to 5 problem-solution sections",
            "Add proof, examples, or comparisons where possible",
          ],
        },
        {
          heading: "CTA, links, and publish checklist",
          body: "Close with a focused CTA and connect the draft to adjacent product or knowledge-base pages.",
          bullets: [
            `Link the draft back to ${pageLabel}`,
            "Include one conversion CTA and one discovery CTA",
            "Add two internal links to supporting cluster pages",
          ],
        },
      ];
    case "metadata":
      return [
        {
          heading: "Title tag",
          body: `Create a concise title tag centered on "${input}" with a clear product or outcome modifier.`,
          bullets: [
            "Keep the title under 60 characters",
            "Place the primary keyword toward the front",
            "Use a differentiator like AI, startup, or SEO workflow",
          ],
        },
        {
          heading: "Meta description",
          body: "Write a high-intent description that previews value and nudges the click.",
          bullets: [
            "Keep the meta description under 155 characters",
            "Mention the outcome or use case directly",
            "Use action-oriented language instead of generic claims",
          ],
        },
        {
          heading: "SERP package",
          body: `Align the slug, H1, and open graph framing for ${pageLabel}.`,
          bullets: [
            "Keep the slug short and keyword-aligned",
            "Use one H1 that matches the page promise",
            "Make open graph copy more narrative than the title tag",
          ],
        },
      ];
    case "keyword-cluster":
      return [
        {
          heading: "Pillar keyword",
          body: `Treat "${input}" as the anchor topic and define its highest-value search intent.`,
          bullets: [
            `${input} strategy`,
            `${input} examples`,
            `${input} guide`,
          ],
        },
        {
          heading: "Supporting clusters",
          body: "Expand the topic into adjacent subtopics that can support rankings and internal depth.",
          bullets: [
            `${input} tools`,
            `${input} checklist`,
            `${input} best practices`,
          ],
        },
        {
          heading: "Internal linking map",
          body: `Create explicit linking paths between the cluster pages and ${pageLabel}.`,
          bullets: [
            "Link every supporting article back to the pillar page",
            "Use descriptive anchors instead of generic text",
            "Add reciprocal links where user journeys overlap",
          ],
        },
      ];
    case "schema-faq":
      return [
        {
          heading: "Recommended schema",
          body: `Start with schema that best matches "${input}" and the intent of ${pageLabel}.`,
          bullets: [
            "Use FAQ schema only when the page genuinely answers the questions",
            "Add organization or software schema where relevant",
            "Keep structured data aligned with visible page content",
          ],
        },
        {
          heading: "FAQ candidates",
          body: "Draft FAQ prompts that reduce friction and capture secondary search demand.",
          bullets: [
            "Answer setup, pricing, and comparison questions",
            "Keep each FAQ concise and non-promotional",
            "Use FAQs to support conversions, not just rankings",
          ],
        },
        {
          heading: "Entity coverage",
          body: "Clarify the key entities, product terms, and use cases the page should reinforce.",
          bullets: [
            "Repeat the core entity names consistently",
            "Support them with related use cases and terminology",
            "Avoid introducing off-topic entities that dilute relevance",
          ],
        },
      ];
    case "fix-plan":
      return [
        {
          heading: "What to fix",
          body: `Resolve the issue "${input}" first on ${pageLabel}.`,
          bullets: [
            "Confirm exactly where the issue appears on the page",
            "Fix the highest-impact element before secondary cleanup",
            "Align the rewrite to the page's target keyword and intent",
          ],
        },
        {
          heading: "Recommended rewrite",
          body: "Implement a practical rewrite that improves clarity, relevance, and crawl understanding.",
          bullets: [
            "Rewrite the affected copy with clearer keyword alignment",
            "Keep the updated text shorter and more specific",
            "Preserve conversion intent while improving SEO relevance",
          ],
        },
        {
          heading: "Validation checklist",
          body: "Verify the change after publishing so the fix is measurable and durable.",
          bullets: [
            "Check indexing, rendering, and on-page copy after deployment",
            "Re-run the audit to confirm the issue is gone",
            "Track CTR and ranking movement after the change ships",
          ],
        },
      ];
  }
}

function buildFallbackReadyToUse(action: AssistantActionType, input: string, url: string): AssistantReadyOutput[] {
  const pageLabel = url || "the target page";

  switch (action) {
    case "blog-brief":
      return [
        {
          label: "Best publishable angle",
          content: `Working title: ${input} for practical SEO growth. Intro angle: frame the pain clearly, show the cost of inaction, and promise a tactical walkthrough that leads into your product or service.`,
          bullets: [
            "Open with a sharper outcome-led H1",
            "Use one concrete example in the first section",
            "Close with a CTA tied to implementation help",
          ],
        },
        {
          label: "Alternative editorial angle",
          content: `Approach the brief as a problem-to-playbook article for teams evaluating ${input}. Focus on quick wins first, then expand into long-term workflow recommendations.`,
          bullets: [
            "Lead with a comparison or misconception",
            "Add one proof point or case-style snapshot",
            `Link back to ${pageLabel} as the next step`,
          ],
        },
      ];
    case "metadata":
      return [
        {
          label: "Best metadata set",
          content: `Title: ${input} | Aether SEO. Meta: Improve visibility with structured SEO execution, clearer metadata, and practical content workflows.`,
          bullets: [
            `Slug: /${slugify(input) || "page"}`,
            `H1: ${input}`,
            "Open graph: Sharper SEO execution for lean teams",
          ],
        },
        {
          label: "Alternative metadata set",
          content: `Title: ${input} for startups. Meta: Publish cleaner pages with stronger search intent, metadata structure, and conversion clarity.`,
          bullets: [
            `Slug: /${slugify(`${input}-seo`) || "page-seo"}`,
            `H1: ${input} strategy`,
            "Open graph: Launch-ready SEO workflows without extra overhead",
          ],
        },
      ];
    case "keyword-cluster":
      return [
        {
          label: "Best keyword cluster",
          content: `Primary cluster for ${input}: build one pillar page, then support it with comparison, workflow, tooling, and execution subtopics.`,
          bullets: [
            `${input}`,
            `${input} strategy`,
            `${input} tools`,
          ],
        },
        {
          label: "Alternative quick-win cluster",
          content: `Use faster-win supporting content around narrower intent terms before expanding into the broad pillar page.`,
          bullets: [
            `${input} checklist`,
            `${input} examples`,
            `${input} best practices`,
          ],
        },
      ];
    case "schema-faq":
      return [
        {
          label: "Best implementation pack",
          content: `Lead with schema that matches the page intent, then add FAQs that reduce hesitation and support the conversion path.`,
          bullets: [
            "FAQPage schema only if the page visibly answers the questions",
            "SoftwareApplication or Organization schema where relevant",
            "Questions should cover setup, pricing, and outcomes",
          ],
        },
        {
          label: "Alternative FAQ angle",
          content: `Center the FAQ block on objections and comparisons so it helps both SEO visibility and purchase confidence.`,
          bullets: [
            `What is the fastest way to implement ${input}?`,
            `How does ${input} compare with manual SEO workflows?`,
            `What should users measure after deploying ${input}?`,
          ],
        },
      ];
    case "fix-plan":
      return [
        {
          label: "Best direct-use fix",
          content: `Rewrite the affected copy so the primary keyword is explicit, the value proposition is shorter, and the CTA feels aligned with the user's next step.`,
          bullets: [
            "Replace vague phrasing with the target keyword",
            "Keep the revised copy outcome-led and specific",
            `Re-check ${pageLabel} after publishing`,
          ],
        },
        {
          label: "Alternative rewrite path",
          content: "Keep the structure, but tighten the first sentence, clarify the promise, and remove any repeated or generic wording that weakens relevance.",
          bullets: [
            "Reduce the sentence count in the target block",
            "Add one stronger intent-matching phrase",
            "Verify click-through copy after the update ships",
          ],
        },
      ];
  }
}

function buildFallbackAlternative(
  action: AssistantActionType,
  input: string,
  url: string,
  sections: AssistantSection[],
): AssistantAlternative {
  const pageLabel = url || "the target page";

  return {
    title: `Alternative ${buildActionTitle(action)} for ${input}`,
    summary: `Use this alternative version when you want a sharper angle, a more conversion-focused structure, or a lighter-weight path for ${pageLabel}.`,
    sections: sections.map((section, index) => ({
      heading: index === 0 ? `${section.heading} alternative` : section.heading,
      body: section.body,
      bullets: section.bullets.slice(0, 3),
    })),
  };
}

function buildFallbackPromptPack(
  action: AssistantActionType,
  input: string,
  url: string,
  language: string,
  sections: AssistantSection[],
  readyToUse: AssistantReadyOutput[],
): AssistantPromptPack {
  const pageLabel = url || "No URL provided";
  const sectionSummary = sections
    .map((section) => `- ${section.heading}: ${section.body}`)
    .join("\n");
  const bestOutput = readyToUse[0]?.content || `Create the strongest ${buildActionTitle(action)} for ${input}.`;

  return {
    brief: `Action: ${buildActionTitle(action)}\nInput: ${input}\nURL: ${pageLabel}\nLanguage: ${language}\n\nBest output:\n${bestOutput}\n\nSections:\n${sectionSummary}`,
    conductor: `Act as a senior SEO and product operator. Using the following task, produce implementation-ready output for ${pageLabel}. Task: ${input}. Action type: ${buildActionTitle(action)}. Work in ${language}. Use this plan:\n${sectionSummary}\nReturn concrete, directly usable execution steps, replacement copy where relevant, and one alternative option.`,
    cursor: `You are working in a product codebase and content workspace. Implement the ${buildActionTitle(action)} for "${input}" on ${pageLabel}. Keep the output practical, preserve existing intent, and provide copy or structured content that can be pasted directly. Use this plan:\n${sectionSummary}\nAlso provide one alternative version and list the final validation checks.`,
  };
}

function buildFallbackImageAsset(input: string): AssistantImageAsset {
  const slug = slugify(input) || "seo-visual";
  const fileName = `${slug}.png`;

  return {
    alt: `${input} illustration designed for a search-focused blog post`,
    fileName,
    imageUrl: null,
    prompt: `Create a polished editorial illustration for a blog post about ${input}. Make it clean, modern, SEO-focused, startup-friendly, and useful as a featured article image. Avoid text in the image.`,
    title: `${input} featured image`,
  };
}

function buildUserPrompt(
  action: AssistantActionType,
  input: string,
  url: string,
  language: string,
  includePromptPack: boolean,
  includeSeoImageAsset: boolean,
) {
  const sharedContext = `Primary input: ${input}
Reference URL: ${url || "Not provided"}
Output language: ${language}
Include developer prompt pack: ${includePromptPack ? "yes" : "no"}
Include SEO image metadata: ${includeSeoImageAsset ? "yes" : "no"}`;

  const actionRequirements = {
    "blog-brief":
      "readyToUse[0] must include a stronger publishable angle and a refined opener. readyToUse[1] must provide an alternative editorial angle.",
    metadata:
      "readyToUse outputs must include publishable title/meta options plus slug/H1/open graph bullets.",
    "keyword-cluster":
      "readyToUse outputs must include exact keywords in the bullets arrays, with one best cluster and one alternative cluster.",
    "schema-faq":
      "readyToUse outputs must give directly usable schema/FAQ recommendations with implementation-friendly bullets.",
    "fix-plan":
      "readyToUse outputs must include direct replacement or rewrite guidance the team can use immediately.",
  }[action];

  const sectionShape = {
    "blog-brief": [
      "Audience and search intent",
      "Outline and talking points",
      "CTA, links, and publish checklist",
    ],
    metadata: ["Title tag", "Meta description", "SERP package"],
    "keyword-cluster": ["Pillar keyword", "Supporting clusters", "Internal linking map"],
    "schema-faq": ["Recommended schema", "FAQ candidates", "Entity coverage"],
    "fix-plan": ["What to fix", "Recommended rewrite", "Validation checklist"],
  }[action];

  return `${sharedContext}

Create an SEO execution package for the requested action.

Return JSON with this exact shape:
{
  "title": string,
  "summary": string,
  "sections": [
    {"heading": "${sectionShape[0]}", "body": string, "bullets": string[]},
    {"heading": "${sectionShape[1]}", "body": string, "bullets": string[]},
    {"heading": "${sectionShape[2]}", "body": string, "bullets": string[]}
  ],
  "readyToUse": [
    {"label": string, "content": string, "bullets": string[]},
    {"label": string, "content": string, "bullets": string[]}
  ],
  "alternative": {
    "title": string,
    "summary": string,
    "sections": [
      {"heading": string, "body": string, "bullets": string[]},
      {"heading": string, "body": string, "bullets": string[]},
      {"heading": string, "body": string, "bullets": string[]}
    ]
  },
  "promptPack": ${includePromptPack ? `{"brief": string, "conductor": string, "cursor": string}` : "null"},
  "imageAsset": ${includeSeoImageAsset ? `{"prompt": string, "alt": string, "title": string, "fileName": string}` : "null"}
}

Requirements:
- each section should be directly usable and implementation-ready
- each bullets array should contain 3 to 5 bullets
- readyToUse[0] is the strongest immediate output the user can apply now
- readyToUse[1] is the best alternative option
- ${actionRequirements}
- if promptPack is requested, write prompts that a developer can paste directly into Conductor and Cursor
- if imageAsset is requested, create blog-feature image metadata and a production-ready image prompt with no text inside the image
- no markdown fences`;
}

async function fetchPageContext(url: string) {
  if (!url) {
    return "No page URL provided.";
  }

  try {
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent": "AetherAssistantBot/1.0",
      },
      cache: "no-store",
    });
    const html = await pageResponse.text();

    return JSON.stringify(
      {
        fetchedUrl: url,
        status: pageResponse.status,
        title: readTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
        metaDescription: readTag(
          html,
          /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
        ),
        canonical: readTag(
          html,
          /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i,
        ),
        firstH1: readTag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, ""),
        htmlLength: html.length,
      },
      null,
      2,
    );
  } catch {
    return `Could not fetch the page context for ${url}.`;
  }
}

async function reserveRequestedCredits({
  includePromptPack,
  includeSeoImageAsset,
  uid,
}: {
  includePromptPack: boolean;
  includeSeoImageAsset: boolean;
  uid: string;
}) {
  const reserved = {
    image: includeSeoImageAsset ? 1 : 0,
    prompt: includePromptPack ? 1 : 0,
  };

  if (!reserved.prompt && !reserved.image) {
    return reserved;
  }

  const db = getFirebaseAdminDb();
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    const userData = userSnapshot.data() ?? {};
    const promptCredits = normalizeCreditCount(userData.assistantPromptCredits);
    const imageCredits = normalizeCreditCount(userData.assistantImageCredits);
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (reserved.prompt && promptCredits < 1) {
      throw new Error("Developer prompt credits are empty. Purchase a $2 prompt pack to continue.");
    }

    if (reserved.image && imageCredits < 1) {
      throw new Error("SEO image credits are empty. Purchase a $5 image credit to continue.");
    }

    if (reserved.prompt) {
      updates.assistantPromptCredits = FieldValue.increment(-1);
    }

    if (reserved.image) {
      updates.assistantImageCredits = FieldValue.increment(-1);
    }

    transaction.set(
      userRef,
      updates,
      { merge: true },
    );
  });

  return reserved;
}

async function restoreReservedCredits(uid: string, reserved: { prompt: number; image: number }) {
  if (!reserved.prompt && !reserved.image) {
    return;
  }

  const db = getFirebaseAdminDb();
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (reserved.prompt) {
    updates.assistantPromptCredits = FieldValue.increment(reserved.prompt);
  }

  if (reserved.image) {
    updates.assistantImageCredits = FieldValue.increment(reserved.image);
  }

  await db.collection("users").doc(uid).set(
    updates,
    { merge: true },
  );
}

async function requestAssistantPayload({
  action,
  apiKey,
  includePromptPack,
  includeSeoImageAsset,
  input,
  language,
  pageContext,
  url,
}: {
  action: AssistantActionType;
  apiKey: string;
  includePromptPack: boolean;
  includeSeoImageAsset: boolean;
  input: string;
  language: string;
  pageContext: string;
  url: string;
}) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveModel(),
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an SEO execution assistant. Return valid JSON only.",
        },
        {
          role: "user",
          content: `${buildUserPrompt(
            action,
            input,
            url,
            language,
            includePromptPack,
            includeSeoImageAsset,
          )}

Page context:
${pageContext}`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI AI assistant request failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty AI assistant response.");
  }

  const parsed = extractJsonObject(content);
  if (!parsed) {
    throw new Error("Could not parse OpenAI AI assistant JSON.");
  }

  return parsed;
}

function buildPersistentImagePath(fileName: string) {
  return path.posix.join(IMAGE_BLOB_PREFIX, `${Date.now()}-${fileName}`);
}

async function generateSeoImage({
  apiKey,
  asset,
}: {
  apiKey: string;
  asset: AssistantImageAsset;
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
  const action = isAssistantAction(body?.action) ? body.action : "blog-brief";
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  let url = typeof body?.url === "string" ? body.url.trim() : "";
  const language = typeof body?.language === "string" ? body.language.trim() : "en";
  const includePromptPack = Boolean(body?.includePromptPack);
  const includeSeoImageAsset = Boolean(body?.includeSeoImageAsset);

  if (!input) {
    return NextResponse.json({ error: "Input is required." }, { status: 400 });
  }

  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const db = getFirebaseAdminDb();
  const userSnapshot = await db.collection("users").doc(decodedToken.uid).get();
  const userData = userSnapshot.data() ?? {};

  if (userData.plan !== "paid") {
    return NextResponse.json(
      { error: "AI assistant is available on paid plans only. Upgrade to continue." },
      { status: 403 },
    );
  }

  const warnings: string[] = [];
  let reservedCredits = {
    image: 0,
    prompt: 0,
  };
  let creditsUsed = {
    image: 0,
    prompt: 0,
  };

  try {
    reservedCredits = await reserveRequestedCredits({
      includePromptPack,
      includeSeoImageAsset,
      uid: decodedToken.uid,
    });
    creditsUsed = {
      image: reservedCredits.image,
      prompt: reservedCredits.prompt,
    };

    const pageContext = await fetchPageContext(url);
    const parsed = await requestAssistantPayload({
      action,
      apiKey,
      includePromptPack,
      includeSeoImageAsset,
      input,
      language,
      pageContext,
      url,
    });

    const fallbackSections = buildFallbackSections(action, input, url);
    const sections = normalizeSections(parsed.sections, fallbackSections);
    const readyToUse = normalizeReadyToUse(parsed.readyToUse, buildFallbackReadyToUse(action, input, url));
    const alternativeSections = normalizeSections(parsed.alternative && typeof parsed.alternative === "object" ? (parsed.alternative as { sections?: unknown }).sections : null, sections);
    const alternative: AssistantAlternative =
      parsed.alternative &&
      typeof parsed.alternative === "object" &&
      typeof (parsed.alternative as { title?: unknown }).title === "string" &&
      typeof (parsed.alternative as { summary?: unknown }).summary === "string"
        ? {
            title: ((parsed.alternative as { title: string }).title || "").trim(),
            summary: ((parsed.alternative as { summary: string }).summary || "").trim(),
            sections: alternativeSections,
          }
        : buildFallbackAlternative(action, input, url, sections);
    const promptPack =
      includePromptPack &&
      parsed.promptPack &&
      typeof parsed.promptPack === "object" &&
      typeof (parsed.promptPack as { brief?: unknown }).brief === "string" &&
      typeof (parsed.promptPack as { conductor?: unknown }).conductor === "string" &&
      typeof (parsed.promptPack as { cursor?: unknown }).cursor === "string"
        ? {
            brief: ((parsed.promptPack as { brief: string }).brief || "").trim(),
            conductor: ((parsed.promptPack as { conductor: string }).conductor || "").trim(),
            cursor: ((parsed.promptPack as { cursor: string }).cursor || "").trim(),
          }
        : includePromptPack
          ? buildFallbackPromptPack(action, input, url, language, sections, readyToUse)
          : null;

    let imageAsset: AssistantImageAsset | null =
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
              `${slugify(input) || "seo-image"}.png`,
            imageUrl: null,
            prompt: ((parsed.imageAsset as { prompt: string }).prompt || "").trim(),
            title: ((parsed.imageAsset as { title: string }).title || "").trim(),
          }
        : includeSeoImageAsset
          ? buildFallbackImageAsset(input)
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
              : `${slugify(imageAsset.fileName) || "seo-image"}.png`,
          },
        });
        imageAsset = generatedImage.asset;
        ephemeralImageDataUrl = generatedImage.ephemeralImageDataUrl;
      } catch (error) {
        await restoreReservedCredits(decodedToken.uid, { prompt: 0, image: 1 });
        reservedCredits.image = 0;
        creditsUsed.image = 0;
        warnings.push(
          error instanceof Error
            ? `SEO image generation failed, so the $5 image credit was restored. ${error.message}`
            : "SEO image generation failed, so the $5 image credit was restored.",
        );
      }
    }

    return NextResponse.json({
      assistantRun: {
        action,
        alternative,
        imageAsset,
        input,
        language,
        promptPack,
        readyToUse,
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary
            : "AI assistant response generated successfully.",
        sections,
        title:
          typeof parsed.title === "string" && parsed.title.trim()
            ? parsed.title
            : `${buildActionTitle(action)} for ${input}`,
        url,
      },
      creditsUsed,
      ephemeralImageDataUrl,
      warnings,
    });
  } catch (error) {
    await restoreReservedCredits(decodedToken.uid, reservedCredits).catch(() => undefined);
    const message =
      error instanceof Error ? error.message : "Could not generate the AI assistant result.";
    const status =
      typeof message === "string" && message.includes("credits are empty") ? 402 : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status },
    );
  }
}

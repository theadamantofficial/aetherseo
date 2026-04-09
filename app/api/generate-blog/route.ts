import { NextResponse } from "next/server";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

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

export async function POST(request: Request) {
  const apiKey = resolveOpenAIKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key. Set OPENAI_API_KEY in your environment." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
  const tone = typeof body?.tone === "string" ? body.tone.trim() : "Professional & Authoritative";
  const length = typeof body?.length === "string" ? body.length.trim() : "Medium";
  const language = typeof body?.language === "string" ? body.language.trim() : "en";

  if (!keyword) {
    return NextResponse.json({ error: "Keyword is required." }, { status: 400 });
  }

  const paragraphCount = length.toLowerCase().includes("long")
    ? 6
    : length.toLowerCase().includes("short")
      ? 3
      : 4;

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

Return JSON with this exact shape:
{
  "title": string,
  "metaDescription": string,
  "previewMeta": string,
  "paragraphs": string[],
  "sectionTitle": string,
  "sectionBody": string,
  "bullets": string[]
}

Requirements:
- title under 70 characters
- metaDescription under 160 characters
- previewMeta should be a short editorial summary
- exactly ${paragraphCount} paragraphs
- exactly 3 bullets
- practical, publishable, startup-oriented writing
- no markdown fences`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error?.message || "OpenAI blog generation failed." },
      { status: response.status },
    );
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return NextResponse.json({ error: "OpenAI returned an empty response." }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Could not parse OpenAI JSON response." }, { status: 502 });
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
      paragraphs: Array.isArray(parsed.paragraphs)
        ? parsed.paragraphs.filter((item): item is string => typeof item === "string")
        : [],
      sectionTitle:
        typeof parsed.sectionTitle === "string" ? parsed.sectionTitle : "Key Takeaway",
      sectionBody:
        typeof parsed.sectionBody === "string"
          ? parsed.sectionBody
          : "This section outlines the most practical next step for the topic.",
      bullets: Array.isArray(parsed.bullets)
        ? parsed.bullets.filter((item): item is string => typeof item === "string")
        : [],
    },
  });
}

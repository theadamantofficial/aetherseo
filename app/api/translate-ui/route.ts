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

export async function POST(request: Request) {
  const apiKey = resolveOpenAIKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key. Set OPENAI_API_KEY in your environment." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { language?: unknown; source?: unknown }
    | null;
  const language = typeof body?.language === "string" ? body.language.trim() : "";
  const source = body?.source;

  if (!language) {
    return NextResponse.json({ error: "Language is required." }, { status: 400 });
  }

  if (source === null || source === undefined) {
    return NextResponse.json({ error: "Source payload is required." }, { status: 400 });
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You translate UI copy. Translate only user-facing string values in the JSON payload. Preserve keys, nesting, arrays, numbers, booleans, nulls, URLs, paths, slugs, locale codes, product names, and any value in fields named slug, href, url, code, id, or locale. Return valid JSON only as {\"result\": <translated payload>} with the same structure.",
        },
        {
          role: "user",
          content: `Translate this JSON payload into ${language}.\n\n${JSON.stringify({ source })}`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error?.message || "OpenAI UI translation failed." },
      { status: response.status },
    );
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return NextResponse.json({ error: "OpenAI returned an empty translation response." }, { status: 502 });
  }

  const parsed = extractJsonObject(content);
  if (!parsed || !("result" in parsed)) {
    return NextResponse.json({ error: "Could not parse translated UI JSON." }, { status: 502 });
  }

  return NextResponse.json({ result: parsed.result });
}

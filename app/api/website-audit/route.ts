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

function readTag(source: string, pattern: RegExp) {
  const match = source.match(pattern);
  return match?.[1]?.replace(/\s+/g, " ").trim() || "";
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

  let html = "";
  let fetchStatus = "Homepage HTML fetched successfully.";
  try {
    const fetchResponse = await fetch(url.toString(), {
      headers: {
        "User-Agent": "AetherAuditBot/1.0",
      },
      cache: "no-store",
    });
    html = await fetchResponse.text();
    if (!fetchResponse.ok) {
      fetchStatus = `Homepage request returned status ${fetchResponse.status}.`;
    }
  } catch {
    fetchStatus = "Homepage fetch failed. Audit is based on URL heuristics.";
  }

  const signals = {
    url: url.toString(),
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
    fetchStatus,
  };

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
            "You are an SEO auditor. Use the provided signals only. Return valid JSON only.",
        },
        {
          role: "user",
          content: `Audit this website homepage and return JSON:
${JSON.stringify(signals, null, 2)}

Return:
{
  "score": number,
  "summary": string,
  "issues": [{"title": string, "severity": "Critical" | "Warning" | "Good", "detail": string}],
  "recommendations": string[]
}

Requirements:
- score 0 to 100
- exactly 3 issues
- exactly 3 recommendations
- practical SEO language
- if fetch failed, make that explicit in summary`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error?.message || "OpenAI website audit failed." },
      { status: response.status },
    );
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return NextResponse.json({ error: "OpenAI returned an empty audit response." }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Could not parse OpenAI audit JSON." }, { status: 502 });
  }

  return NextResponse.json({
    audit: {
      url: url.toString(),
      score:
        typeof parsed.score === "number" && !Number.isNaN(parsed.score)
          ? Math.max(0, Math.min(100, Math.round(parsed.score)))
          : 72,
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : "Audit completed using homepage signals and AI heuristics.",
      issues: Array.isArray(parsed.issues)
        ? parsed.issues
            .filter(
              (item): item is { title: string; severity: string; detail: string } =>
                typeof item === "object" &&
                item !== null &&
                typeof item.title === "string" &&
                typeof item.severity === "string" &&
                typeof item.detail === "string",
            )
            .slice(0, 3)
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((item): item is string => typeof item === "string").slice(0, 3)
        : [],
    },
  });
}

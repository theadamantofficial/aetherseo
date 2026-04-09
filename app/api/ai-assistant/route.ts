import { NextResponse } from "next/server";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

type AssistantActionType =
  | "blog-brief"
  | "metadata"
  | "keyword-cluster"
  | "schema-faq"
  | "fix-plan";

const SUPPORTED_ACTIONS: AssistantActionType[] = [
  "blog-brief",
  "metadata",
  "keyword-cluster",
  "schema-faq",
  "fix-plan",
];

type AssistantSection = {
  heading: string;
  body: string;
  bullets: string[];
};

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
          heading: "CTA and internal links",
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
            "Choose one main keyword with strong business relevance",
            "Clarify whether the intent is educational or transactional",
            "Build one pillar page around the broadest qualifying term",
          ],
        },
        {
          heading: "Supporting clusters",
          body: "Expand the topic into adjacent subtopics that can support rankings and internal depth.",
          bullets: [
            "Group supporting terms by intent and funnel stage",
            "Separate comparison, how-to, and problem-based queries",
            "Prioritize the clusters that can link back to the pillar page",
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

function buildUserPrompt(action: AssistantActionType, input: string, url: string, language: string) {
  const sharedContext = `Primary input: ${input}
Reference URL: ${url || "Not provided"}
Output language: ${language}`;

  switch (action) {
    case "blog-brief":
      return `${sharedContext}

Create an SEO content brief for the primary input.

Return JSON with this exact shape:
{
  "title": string,
  "summary": string,
  "sections": [
    {"heading": string, "body": string, "bullets": string[]},
    {"heading": string, "body": string, "bullets": string[]},
    {"heading": string, "body": string, "bullets": string[]}
  ]
}

Requirements:
- section 1 should cover audience, search intent, and angle
- section 2 should cover outline and talking points
- section 3 should cover CTA, internal links, and publish checklist
- each bullets array should contain exactly 3 bullets
- no markdown fences`;
    case "metadata":
      return `${sharedContext}

Create SEO metadata for the primary input.

Return JSON with this exact shape:
{
  "title": string,
  "summary": string,
  "sections": [
    {"heading": "Title tag", "body": string, "bullets": string[]},
    {"heading": "Meta description", "body": string, "bullets": string[]},
    {"heading": "SERP package", "body": string, "bullets": string[]}
  ]
}

Requirements:
- include a title tag under 60 characters
- include a meta description under 155 characters
- include slug, H1, and open graph angle inside bullets
- each bullets array should contain exactly 3 bullets
- no markdown fences`;
    case "keyword-cluster":
      return `${sharedContext}

Create a keyword cluster and internal linking plan for the primary input.

Return JSON with this exact shape:
{
  "title": string,
  "summary": string,
  "sections": [
    {"heading": "Pillar keyword", "body": string, "bullets": string[]},
    {"heading": "Supporting clusters", "body": string, "bullets": string[]},
    {"heading": "Internal linking map", "body": string, "bullets": string[]}
  ]
}

Requirements:
- each bullets array should contain exactly 3 bullets
- include search intent and prioritization
- no markdown fences`;
    case "schema-faq":
      return `${sharedContext}

Create structured data and FAQ recommendations for the primary input.

Return JSON with this exact shape:
{
  "title": string,
  "summary": string,
  "sections": [
    {"heading": "Recommended schema", "body": string, "bullets": string[]},
    {"heading": "FAQ candidates", "body": string, "bullets": string[]},
    {"heading": "Entity coverage", "body": string, "bullets": string[]}
  ]
}

Requirements:
- bullets should be implementation-ready
- each bullets array should contain exactly 3 bullets
- no markdown fences`;
    case "fix-plan":
      return `${sharedContext}

Turn the SEO issue or audit recommendation into a concrete implementation plan.

Return JSON with this exact shape:
{
  "title": string,
  "summary": string,
  "sections": [
    {"heading": "What to fix", "body": string, "bullets": string[]},
    {"heading": "Recommended rewrite", "body": string, "bullets": string[]},
    {"heading": "Validation checklist", "body": string, "bullets": string[]}
  ]
}

Requirements:
- each bullets array should contain exactly 3 bullets
- include practical SEO implementation language
- no markdown fences`;
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

  const body = await request.json().catch(() => null);
  const action = isAssistantAction(body?.action) ? body.action : "blog-brief";
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  let url = typeof body?.url === "string" ? body.url.trim() : "";
  const language = typeof body?.language === "string" ? body.language.trim() : "en";

  if (!input) {
    return NextResponse.json({ error: "Input is required." }, { status: 400 });
  }

  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  let html = "";
  let pageContext = "No page URL provided.";
  if (url) {
    try {
      const pageResponse = await fetch(url, {
        headers: {
          "User-Agent": "AetherAssistantBot/1.0",
        },
        cache: "no-store",
      });
      html = await pageResponse.text();
      pageContext = JSON.stringify(
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
      pageContext = `Could not fetch the page context for ${url}.`;
    }
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveModel(),
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an SEO execution assistant. Return valid JSON only.",
        },
        {
          role: "user",
          content: `${buildUserPrompt(action, input, url, language)}

Page context:
${pageContext}`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error?.message || "OpenAI AI assistant request failed." },
      { status: response.status },
    );
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return NextResponse.json({ error: "OpenAI returned an empty AI assistant response." }, { status: 502 });
  }

  const parsed = extractJsonObject(content);
  if (!parsed) {
    return NextResponse.json({ error: "Could not parse OpenAI AI assistant JSON." }, { status: 502 });
  }

  const sections = Array.isArray(parsed.sections)
    ? parsed.sections
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
        .slice(0, 4)
        .map((item) => ({
          heading: item.heading,
          body: item.body,
          bullets: Array.isArray(item.bullets)
            ? item.bullets.filter((bullet): bullet is string => typeof bullet === "string").slice(0, 3)
            : [],
        }))
    : [];

  return NextResponse.json({
    assistantRun: {
      action,
      input,
      url,
      language,
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title
          : `${buildActionTitle(action)} for ${input}`,
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary
          : "AI assistant response generated successfully.",
      sections: sections.length ? sections : buildFallbackSections(action, input, url),
    },
  });
}

type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  goal?: string;
  details?: string;
  language?: string;
};

function sanitize(value: unknown, maxLength: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function fieldValue(value: string, fallback = "Not provided") {
  return value.length > 0 ? value : fallback;
}

export async function POST(request: Request) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return Response.json({ error: "Discord webhook is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as ContactPayload;

  const payload = {
    name: sanitize(body.name, 120),
    email: sanitize(body.email, 160),
    company: sanitize(body.company, 160),
    goal: sanitize(body.goal, 180),
    details: sanitize(body.details, 1000),
    language: sanitize(body.language, 16),
  };

  if (!payload.name || !payload.email || !payload.goal) {
    return Response.json({ error: "Missing required inquiry fields." }, { status: 400 });
  }

  const discordPayload = {
    username: "Aether Website",
    embeds: [
      {
        title: "New Aether website inquiry",
        description:
          "A new submission came in from the Aether landing page. Review the lead and follow up with the right workspace or onboarding path.",
        color: 7169532,
        fields: [
          { name: "Name", value: fieldValue(payload.name), inline: true },
          { name: "Email", value: fieldValue(payload.email), inline: true },
          { name: "Company", value: fieldValue(payload.company), inline: true },
          { name: "Primary Goal", value: fieldValue(payload.goal), inline: false },
          { name: "Preferred Language", value: fieldValue(payload.language.toUpperCase()), inline: true },
          { name: "Source", value: "Aether website", inline: true },
          { name: "Details", value: fieldValue(payload.details), inline: false },
        ],
        footer: {
          text: "Aether lead intake",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(discordPayload),
  });

  if (!response.ok) {
    return Response.json({ error: "Discord rejected the webhook request." }, { status: 502 });
  }

  return Response.json({ ok: true });
}

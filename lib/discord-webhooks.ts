const webhookEnvNames = {
  leads: "DISCORD_LEADS_WEBHOOK_URL",
  blogPosted: "DISCORD_BLOG_POSTED_WEBHOOK_URL",
  planPurchase: "DISCORD_PLAN_PURCHASE_WEBHOOK_URL",
  siteAnalytics: "DISCORD_SITE_ANALYTICS_WEBHOOK_URL",
  siteCrash: "DISCORD_SITE_CRASH_WEBHOOK_URL",
} as const;

type DiscordEmbed = {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
};

function getWebhookUrl(name: keyof typeof webhookEnvNames) {
  return process.env[webhookEnvNames[name]]?.trim();
}

async function postWebhook(name: keyof typeof webhookEnvNames, embed: DiscordEmbed) {
  const url = getWebhookUrl(name);
  if (!url) {
    return;
  }

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "Aether SEO",
      embeds: [
        {
          title: embed.title,
          description: embed.description,
          color: embed.color ?? 0x6366f1,
          fields: embed.fields,
        },
      ],
    }),
  });
}

export async function sendLeadNotification(payload: {
  name: string;
  email: string;
  company?: string;
  goal?: string;
  details?: string;
  language?: string;
}) {
  await postWebhook("leads", {
    title: "New Aether SEO lead",
    description: "A visitor submitted the site inquiry form.",
    fields: [
      { name: "Name", value: payload.name || "Not provided", inline: true },
      { name: "Email", value: payload.email || "Not provided", inline: true },
      { name: "Company", value: payload.company || "Not provided", inline: true },
      { name: "Primary goal", value: payload.goal || "Not provided" },
      { name: "Preferred language", value: payload.language || "Not provided", inline: true },
      { name: "Source", value: "Aether SEO website", inline: true },
      { name: "Details", value: payload.details || "Not provided" },
    ],
  });
}

export async function sendBlogPublishedNotification(payload: {
  title: string;
  slug: string;
  language: string;
  category: string;
  authorName: string;
}) {
  await postWebhook("blogPosted", {
    title: "Aether SEO blog published",
    description: "A new public article is now live on the site.",
    fields: [
      { name: "Title", value: payload.title },
      { name: "Slug", value: payload.slug, inline: true },
      { name: "Language", value: payload.language, inline: true },
      { name: "Category", value: payload.category, inline: true },
      { name: "Author", value: payload.authorName, inline: true },
    ],
  });
}

export async function sendPlanPurchaseNotification(payload: {
  uid: string;
  email?: string;
  phone?: string;
  paidPlanTier: string;
}) {
  await postWebhook("planPurchase", {
    title: "Paid plan selected on Aether SEO",
    description: "A user completed the paid-plan selection flow.",
    fields: [
      { name: "Tier", value: payload.paidPlanTier, inline: true },
      { name: "Email", value: payload.email || "Not provided", inline: true },
      { name: "Phone", value: payload.phone || "Not provided", inline: true },
      { name: "UID", value: payload.uid },
    ],
  });
}

export async function sendAnalyticsNotification(payload: {
  path: string;
  locale?: string;
  referrer?: string;
  userAgent?: string;
}) {
  await postWebhook("siteAnalytics", {
    title: "Aether SEO page view",
    description: "A client-side page view event was recorded.",
    fields: [
      { name: "Path", value: payload.path, inline: true },
      { name: "Locale", value: payload.locale || "Unknown", inline: true },
      { name: "Referrer", value: payload.referrer || "Direct" },
      { name: "User agent", value: payload.userAgent || "Unknown" },
    ],
  });
}

export async function sendCrashNotification(payload: {
  path: string;
  message: string;
  stack?: string;
  userAgent?: string;
}) {
  await postWebhook("siteCrash", {
    title: "Aether SEO crash report",
    description: "A client error or unhandled promise rejection was captured.",
    color: 0xef4444,
    fields: [
      { name: "Path", value: payload.path, inline: true },
      { name: "Message", value: payload.message || "Unknown error" },
      { name: "User agent", value: payload.userAgent || "Unknown" },
      { name: "Stack", value: payload.stack || "No stack trace available" },
    ],
  });
}

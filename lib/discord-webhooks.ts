const fallbackWebhookUrls = {
  leads:
    "https://discord.com/api/webhooks/1491821804371578951/8j3m6Z7D_x3G1kv_s5pDLdACCSl_GcHfLqbfJSF6fVpsxwn8XmVQViY4zeUpJBlRa0bX",
  blogPosted:
    "https://discord.com/api/webhooks/1488937214850371676/Ue4SrCFjJIK7HVxypWiop-D7JlNrDeHAAJajXumF2Gz0_S5cEhyyGJMSlF64BmtPQyeR",
  planPurchase:
    "https://discord.com/api/webhooks/1491821804371578951/8j3m6Z7D_x3G1kv_s5pDLdACCSl_GcHfLqbfJSF6fVpsxwn8XmVQViY4zeUpJBlRa0bX",
  siteAnalytics:
    "https://discord.com/api/webhooks/1491822016683311194/0Kia4i0WP5rVSjhzFzKMbEBPZbzkOR-_ypanJ73ENYtvN2-BjTX8_DXax0msVC-bZ6aZ",
  siteCrash:
    "https://discord.com/api/webhooks/1491822215946043633/ImBUnpKmLbwTF_JlfXGGMHqbOBex8t91g9YosWZsFQye8R4pbFVLDeNkRj8rdN4k5mVU",
} as const;

type DiscordEmbed = {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
};

function getWebhookUrl(name: keyof typeof fallbackWebhookUrls) {
  const envValue = {
    leads: process.env.DISCORD_LEADS_WEBHOOK_URL,
    blogPosted: process.env.DISCORD_BLOG_POSTED_WEBHOOK_URL,
    planPurchase: process.env.DISCORD_PLAN_PURCHASE_WEBHOOK_URL,
    siteAnalytics: process.env.DISCORD_SITE_ANALYTICS_WEBHOOK_URL,
    siteCrash: process.env.DISCORD_SITE_CRASH_WEBHOOK_URL,
  }[name];

  return envValue || fallbackWebhookUrls[name];
}

async function postWebhook(name: keyof typeof fallbackWebhookUrls, embed: DiscordEmbed) {
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

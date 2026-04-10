export type PaidPlanTier = "starter" | "pro" | "agency";

export type PaidPlanDefinition = {
  badge: string;
  title: string;
  subtitle: string;
  priceInr: string;
  priceUsd: string;
  amountInr: number;
  features: string[];
};

export const PAID_PLAN_DEFINITIONS: Record<PaidPlanTier, PaidPlanDefinition> = {
  starter: {
    badge: "Most popular entry",
    title: "Starter",
    subtitle: "For individuals and freelancers",
    priceInr: "₹299/month",
    priceUsd: "$5/month",
    amountInr: 29900,
    features: [
      "50 blogs per month",
      "20 website audits",
      "Faster generation",
      "No watermark",
    ],
  },
  pro: {
    badge: "Main money maker",
    title: "Pro",
    subtitle: "For serious users who need depth",
    priceInr: "₹999/month",
    priceUsd: "$15/month",
    amountInr: 99900,
    features: [
      "200 blogs per month",
      "100 website audits",
      "Priority AI",
      "Advanced SEO suggestions",
      "History and export",
    ],
  },
  agency: {
    badge: "High-ticket tier",
    title: "Agency",
    subtitle: "For agencies and businesses",
    priceInr: "₹2999/month",
    priceUsd: "$39/month",
    amountInr: 299900,
    features: [
      "Unlimited usage with fair usage policy",
      "Team access",
      "API access",
      "Automation features",
    ],
  },
};

export function isPaidPlanTier(value: unknown): value is PaidPlanTier {
  return value === "starter" || value === "pro" || value === "agency";
}

export function getPaidPlanDefinition(tier: PaidPlanTier): PaidPlanDefinition {
  return PAID_PLAN_DEFINITIONS[tier];
}

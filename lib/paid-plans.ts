export type PaidPlanTier = "starter" | "pro" | "agency";

export const USD_TO_INR_RATE = 92.68;
export const PLATFORM_FEE_USD = 0.5;
export const PAID_PLAN_TIERS: PaidPlanTier[] = ["starter", "pro", "agency"];

type PaidPlanSeed = {
  badge: string;
  title: string;
  subtitle: string;
  monthlyPriceUsd: number;
  features: string[];
};

export type PaidPlanDefinition = {
  badge: string;
  title: string;
  subtitle: string;
  monthlyPriceUsd: number;
  monthlyPriceInr: number;
  monthlyAmountUsd: number;
  monthlyAmountInr: number;
  platformFeeUsd: number;
  platformFeeInr: number;
  platformFeeAmountUsd: number;
  platformFeeAmountInr: number;
  totalPriceUsd: number;
  totalPriceInr: number;
  amountUsd: number;
  amountInr: number;
  priceInr: string;
  priceUsd: string;
  totalPriceInrLabel: string;
  totalPriceUsdLabel: string;
  features: string[];
};

const PAID_PLAN_SEEDS: Record<PaidPlanTier, PaidPlanSeed> = {
  starter: {
    badge: "Most popular entry",
    title: "Starter",
    subtitle: "For individuals and freelancers",
    monthlyPriceUsd: 5,
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
    monthlyPriceUsd: 15,
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
    monthlyPriceUsd: 39,
    features: [
      "Unlimited usage with fair usage policy",
      "Team access",
      "API access",
      "Automation features",
    ],
  },
};

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function convertUsdToInr(amountInUsd: number, usdToInrRate = USD_TO_INR_RATE): number {
  return Number((amountInUsd * usdToInrRate).toFixed(2));
}

export function formatUsdAmount(amount: number, suffix = ""): string {
  const hasDecimals = !Number.isInteger(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    style: "currency",
  }).format(amount);

  return suffix ? `${formatted}${suffix}` : formatted;
}

export function formatInrAmount(
  amount: number,
  options?: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
    suffix?: string;
  },
): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    style: "currency",
  }).format(amount);

  return options?.suffix ? `${formatted}${options.suffix}` : formatted;
}

function createPaidPlanDefinition(seed: PaidPlanSeed, usdToInrRate = USD_TO_INR_RATE): PaidPlanDefinition {
  const monthlyPriceInr = convertUsdToInr(seed.monthlyPriceUsd, usdToInrRate);
  const platformFeeInr = convertUsdToInr(PLATFORM_FEE_USD, usdToInrRate);
  const totalPriceUsd = Number((seed.monthlyPriceUsd + PLATFORM_FEE_USD).toFixed(2));
  const totalPriceInr = Number((monthlyPriceInr + platformFeeInr).toFixed(2));

  return {
    badge: seed.badge,
    title: seed.title,
    subtitle: seed.subtitle,
    monthlyPriceUsd: seed.monthlyPriceUsd,
    monthlyPriceInr,
    monthlyAmountUsd: toMinorUnits(seed.monthlyPriceUsd),
    monthlyAmountInr: toMinorUnits(monthlyPriceInr),
    platformFeeUsd: PLATFORM_FEE_USD,
    platformFeeInr,
    platformFeeAmountUsd: toMinorUnits(PLATFORM_FEE_USD),
    platformFeeAmountInr: toMinorUnits(platformFeeInr),
    totalPriceUsd,
    totalPriceInr,
    amountUsd: toMinorUnits(totalPriceUsd),
    amountInr: toMinorUnits(totalPriceInr),
    priceInr: formatInrAmount(Math.round(monthlyPriceInr), {
      maximumFractionDigits: 0,
      suffix: "/month",
    }),
    priceUsd: formatUsdAmount(seed.monthlyPriceUsd, "/month"),
    totalPriceInrLabel: formatInrAmount(totalPriceInr, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }),
    totalPriceUsdLabel: formatUsdAmount(totalPriceUsd),
    features: seed.features,
  };
}

export function getPaidPlanDefinition(
  tier: PaidPlanTier,
  usdToInrRate = USD_TO_INR_RATE,
): PaidPlanDefinition {
  return createPaidPlanDefinition(PAID_PLAN_SEEDS[tier], usdToInrRate);
}

export function getPaidPlanDefinitions(
  usdToInrRate = USD_TO_INR_RATE,
): Record<PaidPlanTier, PaidPlanDefinition> {
  return {
    starter: createPaidPlanDefinition(PAID_PLAN_SEEDS.starter, usdToInrRate),
    pro: createPaidPlanDefinition(PAID_PLAN_SEEDS.pro, usdToInrRate),
    agency: createPaidPlanDefinition(PAID_PLAN_SEEDS.agency, usdToInrRate),
  };
}

export const PAID_PLAN_DEFINITIONS: Record<PaidPlanTier, PaidPlanDefinition> = getPaidPlanDefinitions();

export function isPaidPlanTier(value: unknown): value is PaidPlanTier {
  return value === "starter" || value === "pro" || value === "agency";
}

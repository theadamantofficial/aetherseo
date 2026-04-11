import { formatUsdAmount } from "@/lib/paid-plans";

export const ASSISTANT_ADDON_TYPES = ["developer-prompt-pack", "seo-image"] as const;

export type AssistantAddonType = (typeof ASSISTANT_ADDON_TYPES)[number];

export type AssistantAddonDefinition = {
  amountUsd: number;
  amountUsdMinor: number;
  description: string;
  id: AssistantAddonType;
  priceLabel: string;
  title: string;
};

const ASSISTANT_ADDON_PRICES: Record<AssistantAddonType, number> = {
  "developer-prompt-pack": 2,
  "seo-image": 5,
};

function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

export function isAssistantAddonType(value: unknown): value is AssistantAddonType {
  return typeof value === "string" && ASSISTANT_ADDON_TYPES.includes(value as AssistantAddonType);
}

export function getAssistantAddonDefinition(addonType: AssistantAddonType): AssistantAddonDefinition {
  const amountUsd = ASSISTANT_ADDON_PRICES[addonType];

  if (addonType === "developer-prompt-pack") {
    return {
      amountUsd,
      amountUsdMinor: toMinorUnits(amountUsd),
      description:
        "Unlock one developer-ready prompt pack for Conductor, Cursor, and direct implementation handoff.",
      id: addonType,
      priceLabel: formatUsdAmount(amountUsd),
      title: "Developer Prompt Pack",
    };
  }

  return {
    amountUsd,
    amountUsdMinor: toMinorUnits(amountUsd),
    description:
      "Unlock one SEO-driven image generation credit for a blog-ready visual with metadata and download output.",
    id: addonType,
    priceLabel: formatUsdAmount(amountUsd),
    title: "SEO Image Generation",
  };
}

export function getAssistantAddonDefinitions(): Record<AssistantAddonType, AssistantAddonDefinition> {
  return {
    "developer-prompt-pack": getAssistantAddonDefinition("developer-prompt-pack"),
    "seo-image": getAssistantAddonDefinition("seo-image"),
  };
}

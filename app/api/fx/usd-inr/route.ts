import { NextResponse } from "next/server";
import { USD_TO_INR_RATE } from "@/lib/paid-plans";

export const runtime = "nodejs";

const FX_QUOTE_URL = "https://api.frankfurter.dev/v2/rates?base=USD&quotes=INR&providers=ECB";

function createResponse(body: { date: string | null; fallback: boolean; rate: number; source: string }) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "s-maxage=43200, stale-while-revalidate=86400",
    },
  });
}

export async function GET() {
  try {
    const response = await fetch(FX_QUOTE_URL, {
      next: { revalidate: 43200 },
    });

    if (!response.ok) {
      throw new Error(`Frankfurter responded with ${response.status}.`);
    }

    const payload = (await response.json()) as Array<{
      date?: string;
      rate?: number;
    }>;
    const quote = Array.isArray(payload) ? payload[0] : null;

    if (!quote || typeof quote.rate !== "number") {
      throw new Error("Frankfurter did not return a USD to INR rate.");
    }

    return createResponse({
      date: typeof quote.date === "string" ? quote.date : null,
      fallback: false,
      rate: Number(quote.rate.toFixed(4)),
      source: "Frankfurter ECB",
    });
  } catch {
    return createResponse({
      date: null,
      fallback: true,
      rate: USD_TO_INR_RATE,
      source: "Local fallback",
    });
  }
}

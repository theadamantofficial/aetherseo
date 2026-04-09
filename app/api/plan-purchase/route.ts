import { NextResponse } from "next/server";
import { sendPlanPurchaseNotification } from "@/lib/discord-webhooks";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      uid?: string;
      email?: string;
      phone?: string;
      paidPlanTier?: string;
    };

    if (!body.uid || !body.paidPlanTier) {
      return NextResponse.json({ error: "Missing purchase payload." }, { status: 400 });
    }

    await sendPlanPurchaseNotification({
      uid: body.uid,
      email: body.email,
      phone: body.phone,
      paidPlanTier: body.paidPlanTier,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to notify Discord." }, { status: 500 });
  }
}

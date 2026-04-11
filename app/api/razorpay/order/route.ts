import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { createPendingRazorpayOrder, RazorpayApiError } from "@/lib/razorpay";
import { isPaidPlanTier } from "@/lib/paid-plans";

export const runtime = "nodejs";

function readBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

export async function POST(request: Request) {
  try {
    const token = readBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 401 });
    }

    const body = (await request.json()) as {
      paidPlanTier?: string;
      phone?: string;
    };

    if (!isPaidPlanTier(body.paidPlanTier)) {
      return NextResponse.json({ error: "Unsupported paid plan tier." }, { status: 400 });
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
    const order = await createPendingRazorpayOrder({
      email: decodedToken.email ?? null,
      phone: typeof body.phone === "string" ? body.phone.trim() : "",
      tier: body.paidPlanTier,
      uid: decodedToken.uid,
    });

    return NextResponse.json({
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      mode: order.mode,
      orderId: order.orderId,
      title: order.title,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Razorpay order.";
    const status = error instanceof RazorpayApiError ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

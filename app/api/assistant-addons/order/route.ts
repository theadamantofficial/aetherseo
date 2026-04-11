import { NextResponse } from "next/server";
import {
  createPendingAssistantAddonOrder,
} from "@/lib/assistant-addon-payments";
import { isAssistantAddonType } from "@/lib/assistant-addons";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { RazorpayApiError } from "@/lib/razorpay";

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
      addonType?: string;
      phone?: string;
    };

    if (!isAssistantAddonType(body.addonType)) {
      return NextResponse.json({ error: "Unsupported assistant add-on." }, { status: 400 });
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
    const order = await createPendingAssistantAddonOrder({
      addonType: body.addonType,
      email: decodedToken.email ?? null,
      phone: typeof body.phone === "string" ? body.phone.trim() : "",
      uid: decodedToken.uid,
    });

    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Razorpay add-on order.";
    const status = error instanceof RazorpayApiError ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

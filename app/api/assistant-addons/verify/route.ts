import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  getPendingAssistantAddonOrder,
  markAssistantAddonOrderVerified,
  verifyRazorpaySignature,
} from "@/lib/assistant-addon-payments";
import { isAssistantAddonType } from "@/lib/assistant-addons";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getRazorpayCredentials } from "@/lib/razorpay";

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
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (
      !isAssistantAddonType(body.addonType) ||
      !body.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    ) {
      return NextResponse.json({ error: "Incomplete assistant add-on verification payload." }, { status: 400 });
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
    const addonOrder = await getPendingAssistantAddonOrder(body.razorpay_order_id);

    if (!addonOrder.uid || addonOrder.uid !== decodedToken.uid) {
      return NextResponse.json({ error: "Assistant add-on order does not belong to this user." }, { status: 403 });
    }

    if (addonOrder.addonType !== body.addonType) {
      return NextResponse.json({ error: "Assistant add-on order type does not match." }, { status: 409 });
    }

    if (
      addonOrder.status === "verified" &&
      addonOrder.paymentId &&
      addonOrder.paymentId !== body.razorpay_payment_id
    ) {
      return NextResponse.json({ error: "Assistant add-on order was already verified with a different payment." }, { status: 409 });
    }

    const credentials = await getRazorpayCredentials(addonOrder.mode);
    const isSignatureValid = verifyRazorpaySignature({
      keySecret: credentials.keySecret,
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });

    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
    }

    if (
      addonOrder.status === "verified" &&
      addonOrder.paymentId === body.razorpay_payment_id
    ) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const db = getFirebaseAdminDb();
    const userRef = db.collection("users").doc(decodedToken.uid);
    const creditField =
      body.addonType === "developer-prompt-pack"
        ? { assistantPromptCredits: FieldValue.increment(1) }
        : { assistantImageCredits: FieldValue.increment(1) };

    await Promise.all([
      markAssistantAddonOrderVerified({
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        signature: body.razorpay_signature,
      }),
      userRef.set(
        {
          uid: decodedToken.uid,
          ...creditField,
          updatedAt: FieldValue.serverTimestamp(),
          lastAddonPaymentId: body.razorpay_payment_id,
          lastAddonOrderId: body.razorpay_order_id,
        },
        { merge: true },
      ),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify assistant add-on payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

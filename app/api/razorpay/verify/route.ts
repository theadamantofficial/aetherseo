import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import {
  getPendingPaymentOrder,
  getRazorpayCredentials,
  markPaymentOrderVerified,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
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
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (
      !isPaidPlanTier(body.paidPlanTier) ||
      !body.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    ) {
      return NextResponse.json({ error: "Incomplete payment verification payload." }, { status: 400 });
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
    const paymentOrder = await getPendingPaymentOrder(body.razorpay_order_id);

    if (!paymentOrder.uid || paymentOrder.uid !== decodedToken.uid) {
      return NextResponse.json({ error: "Payment order does not belong to this user." }, { status: 403 });
    }

    if (paymentOrder.tier !== body.paidPlanTier) {
      return NextResponse.json({ error: "Payment order tier does not match." }, { status: 409 });
    }

    if (
      paymentOrder.status === "verified" &&
      paymentOrder.paymentId === body.razorpay_payment_id
    ) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const credentials = await getRazorpayCredentials(paymentOrder.mode);
    const isSignatureValid = verifyRazorpaySignature({
      keySecret: credentials.keySecret,
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });

    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const userRef = db.collection("users").doc(decodedToken.uid);
    const dashboardRef = db.collection("dashboard_data").doc(decodedToken.uid);
    const [userSnapshot, dashboardSnapshot] = await Promise.all([userRef.get(), dashboardRef.get()]);
    const userData = userSnapshot.exists ? userSnapshot.data() ?? {} : {};

    await Promise.all([
      markPaymentOrderVerified({
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        signature: body.razorpay_signature,
      }),
      userRef.set(
        {
          uid: decodedToken.uid,
          email: userData.email ?? decodedToken.email ?? null,
          displayName: userData.displayName ?? decodedToken.name ?? null,
          phone: typeof userData.phone === "string" ? userData.phone : "",
          plan: "paid",
          paidPlanTier: body.paidPlanTier,
          provider: userData.provider ?? null,
          billingProvider: "razorpay",
          lastPaymentId: body.razorpay_payment_id,
          lastPaymentOrderId: body.razorpay_order_id,
          updatedAt: FieldValue.serverTimestamp(),
          lastLoginAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
      dashboardRef.set(
        dashboardSnapshot.exists
          ? {
              plan: "paid",
              uid: decodedToken.uid,
              updatedAt: FieldValue.serverTimestamp(),
            }
          : {
              assistantRuns: [],
              auditRuns: [],
              generatedBlogs: [],
              plan: "paid",
              uid: decodedToken.uid,
              updatedAt: FieldValue.serverTimestamp(),
            },
        { merge: true },
      ),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import {
  getPaidPlanDefinition,
  isPaidPlanTier,
  type PaidPlanTier,
} from "@/lib/paid-plans";

type RazorpayMode = "test" | "prod";

type RazorpayCredentials = {
  keyId: string;
  keySecret: string;
  mode: RazorpayMode;
};

export class RazorpayApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "RazorpayApiError";
    this.status = status;
  }
}

type PendingPaymentOrder = {
  amount: number;
  createdAt: FirebaseFirestore.FieldValue;
  currency: "INR" | "USD";
  email: string | null;
  mode: RazorpayMode;
  orderId: string;
  phone: string;
  status: "created" | "verified";
  tier: PaidPlanTier;
  title: string;
  uid: string;
  updatedAt: FirebaseFirestore.FieldValue;
};

const ORDERS_COLLECTION = "payment_orders";
const RAZORPAY_CREDS_COLLECTION = "razorpay";
const RAZORPAY_CREDS_DOC = "creds";

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function resolveMode(rawMode: unknown): RazorpayMode {
  if (rawMode === "prod" || rawMode === "production" || rawMode === "live") {
    return "prod";
  }

  if (rawMode === "test" || rawMode === "sandbox") {
    return "test";
  }

  if (process.env.RAZORPAY_MODE === "prod") {
    return "prod";
  }

  return "test";
}

export async function getRazorpayCredentials(expectedMode?: RazorpayMode): Promise<RazorpayCredentials> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection(RAZORPAY_CREDS_COLLECTION).doc(RAZORPAY_CREDS_DOC).get();

  if (!snapshot.exists) {
    throw new Error("Missing Firestore document razorpay/creds.");
  }

  const data = snapshot.data() ?? {};
  const preferredMode = expectedMode ?? resolveMode(data.mode ?? data.environment ?? data.env);
  const testKeyId = readString(data.test_key_id);
  const testKeySecret = readString(data.test_key_secret);
  const prodKeyId = readString(data.prod_key_id ?? data.live_key_id ?? data.key_id);
  const prodKeySecret = readString(data.prod_key_secret ?? data.live_key_secret ?? data.key_secret);

  if (preferredMode === "prod" && prodKeyId && prodKeySecret) {
    return {
      keyId: prodKeyId,
      keySecret: prodKeySecret,
      mode: "prod",
    };
  }

  if (testKeyId && testKeySecret) {
    return {
      keyId: testKeyId,
      keySecret: testKeySecret,
      mode: "test",
    };
  }

  if (prodKeyId && prodKeySecret) {
    return {
      keyId: prodKeyId,
      keySecret: prodKeySecret,
      mode: "prod",
    };
  }

  throw new Error("Razorpay keys are missing in Firestore document razorpay/creds.");
}

function createBasicAuthHeader(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function createReceipt(tier: PaidPlanTier): string {
  return `aeth_${tier}_${Date.now().toString(36)}`;
}

export async function createPendingRazorpayOrder({
  email,
  phone,
  tier,
  uid,
}: {
  email: string | null;
  phone: string;
  tier: PaidPlanTier;
  uid: string;
}) {
  const definition = getPaidPlanDefinition(tier);
  const credentials = await getRazorpayCredentials();
  const receipt = createReceipt(tier);

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: createBasicAuthHeader(credentials.keyId, credentials.keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: definition.amountUsd,
      currency: "USD",
      notes: {
        email: email ?? "",
        phone,
        tier,
        uid,
      },
      receipt,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new RazorpayApiError(`Razorpay order creation failed: ${payload}`, response.status);
  }

  const payload = (await response.json()) as {
    amount: number;
    currency: "INR" | "USD";
    id: string;
  };

  const db = getFirebaseAdminDb();
  const orderRecord: PendingPaymentOrder = {
    amount: payload.amount,
    createdAt: FieldValue.serverTimestamp(),
    currency: payload.currency,
    email,
    mode: credentials.mode,
    orderId: payload.id,
    phone,
    status: "created",
    tier,
    title: definition.title,
    uid,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection(ORDERS_COLLECTION).doc(payload.id).set(orderRecord);

  return {
    amount: payload.amount,
    currency: payload.currency,
    keyId: credentials.keyId,
    mode: credentials.mode,
    orderId: payload.id,
    title: definition.title,
  };
}

export function verifyRazorpaySignature({
  keySecret,
  orderId,
  paymentId,
  signature,
}: {
  keySecret: string;
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBytes = Buffer.from(expectedSignature);
  const providedBytes = Buffer.from(signature);

  if (expectedBytes.length !== providedBytes.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBytes, providedBytes);
}

export async function getPendingPaymentOrder(orderId: string): Promise<{
  amount: number;
  currency: "INR" | "USD";
  id: string;
  mode: RazorpayMode;
  paymentId: string | null;
  status: "created" | "verified";
  tier: PaidPlanTier;
  uid: string;
}> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection(ORDERS_COLLECTION).doc(orderId).get();

  if (!snapshot.exists) {
    throw new Error("Payment order was not found.");
  }

  const data = snapshot.data() ?? {};
  if (!isPaidPlanTier(data.tier)) {
    throw new Error("Payment order tier is invalid.");
  }

  return {
    amount: typeof data.amount === "number" ? data.amount : 0,
    currency: data.currency === "USD" ? "USD" : "INR",
    id: snapshot.id,
    mode: data.mode === "prod" ? "prod" : "test",
    paymentId: readString(data.paymentId),
    status: data.status === "verified" ? "verified" : "created",
    tier: data.tier,
    uid: typeof data.uid === "string" ? data.uid : "",
  };
}

export async function markPaymentOrderVerified({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const db = getFirebaseAdminDb();
  await db.collection(ORDERS_COLLECTION).doc(orderId).set(
    {
      paymentId,
      signature,
      status: "verified",
      updatedAt: FieldValue.serverTimestamp(),
      verifiedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

import { FieldValue } from "firebase-admin/firestore";
import {
  getAssistantAddonDefinition,
  isAssistantAddonType,
  type AssistantAddonType,
} from "@/lib/assistant-addons";
import {
  RazorpayApiError,
  getRazorpayCredentials,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

type RazorpayMode = "test" | "prod";

type PendingAssistantAddonOrder = {
  addonType: AssistantAddonType;
  amount: number;
  createdAt: FirebaseFirestore.FieldValue;
  currency: "INR" | "USD";
  email: string | null;
  mode: RazorpayMode;
  orderId: string;
  phone: string;
  status: "created" | "verified";
  title: string;
  uid: string;
  updatedAt: FirebaseFirestore.FieldValue;
};

const ORDERS_COLLECTION = "assistant_addon_orders";

function createBasicAuthHeader(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function createReceipt(addonType: AssistantAddonType) {
  return `aeth_addon_${addonType}_${Date.now().toString(36)}`;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function createPendingAssistantAddonOrder({
  addonType,
  email,
  phone,
  uid,
}: {
  addonType: AssistantAddonType;
  email: string | null;
  phone: string;
  uid: string;
}) {
  const definition = getAssistantAddonDefinition(addonType);
  const credentials = await getRazorpayCredentials();
  const receipt = createReceipt(addonType);

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: createBasicAuthHeader(credentials.keyId, credentials.keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: definition.amountUsdMinor,
      currency: "USD",
      notes: {
        addonType,
        email: email ?? "",
        phone,
        uid,
      },
      receipt,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new RazorpayApiError(`Razorpay add-on order creation failed: ${payload}`, response.status);
  }

  const payload = (await response.json()) as {
    amount: number;
    currency: "INR" | "USD";
    id: string;
  };

  const db = getFirebaseAdminDb();
  const orderRecord: PendingAssistantAddonOrder = {
    addonType,
    amount: payload.amount,
    createdAt: FieldValue.serverTimestamp(),
    currency: payload.currency,
    email,
    mode: credentials.mode,
    orderId: payload.id,
    phone,
    status: "created",
    title: definition.title,
    uid,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection(ORDERS_COLLECTION).doc(payload.id).set(orderRecord);

  return {
    addonType,
    amount: payload.amount,
    currency: payload.currency,
    keyId: credentials.keyId,
    mode: credentials.mode,
    orderId: payload.id,
    title: definition.title,
  };
}

export async function getPendingAssistantAddonOrder(orderId: string): Promise<{
  addonType: AssistantAddonType;
  amount: number;
  currency: "INR" | "USD";
  email: string | null;
  id: string;
  mode: RazorpayMode;
  paymentId: string | null;
  phone: string;
  status: "created" | "verified";
  uid: string;
}> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection(ORDERS_COLLECTION).doc(orderId).get();

  if (!snapshot.exists) {
    throw new Error("Assistant add-on order was not found.");
  }

  const data = snapshot.data() ?? {};
  if (!isAssistantAddonType(data.addonType)) {
    throw new Error("Assistant add-on order type is invalid.");
  }

  return {
    addonType: data.addonType,
    amount: typeof data.amount === "number" ? data.amount : 0,
    currency: data.currency === "USD" ? "USD" : "INR",
    email: readString(data.email),
    id: snapshot.id,
    mode: data.mode === "prod" ? "prod" : "test",
    paymentId: readString(data.paymentId),
    phone: typeof data.phone === "string" ? data.phone.trim() : "",
    status: data.status === "verified" ? "verified" : "created",
    uid: typeof data.uid === "string" ? data.uid : "",
  };
}

export async function markAssistantAddonOrderVerified({
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

export { verifyRazorpaySignature };

import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

const SITE_LEADS_COLLECTION = "site_leads";

type ContactLeadRecord = {
  company: string | null;
  createdAt: FirebaseFirestore.FieldValue;
  details: string | null;
  email: string;
  goal: string | null;
  ipAddress: string | null;
  language: string | null;
  name: string;
  referrer: string | null;
  source: "website-contact-form";
  updatedAt: FirebaseFirestore.FieldValue;
  userAgent: string | null;
};

export async function createContactLead(payload: Omit<ContactLeadRecord, "createdAt" | "updatedAt">) {
  const record: ContactLeadRecord = {
    ...payload,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await getFirebaseAdminDb().collection(SITE_LEADS_COLLECTION).add(record);
}

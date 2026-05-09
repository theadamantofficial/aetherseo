import { NextResponse } from "next/server";
import { createContactLead } from "@/lib/contact-leads";
import { sendLeadNotification } from "@/lib/discord-webhooks";

export const runtime = "nodejs";

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function limitString(value: string | null, maxLength: number): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstAddress] = forwardedFor.split(",");
    return firstAddress?.trim() || null;
  }

  return readString(request.headers.get("x-real-ip"));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      company?: string;
      goal?: string;
      details?: string;
      language?: string;
      website?: string;
    };

    if (readString(body.website)) {
      return NextResponse.json({ ok: true });
    }

    const name = limitString(readString(body.name), 120);
    const email = limitString(readString(body.email)?.toLowerCase() ?? null, 320);
    const company = limitString(readString(body.company), 200);
    const goal = limitString(readString(body.goal), 500);
    const details = limitString(readString(body.details), 4000);
    const language = limitString(readString(body.language), 32);

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    await createContactLead({
      name,
      email,
      company,
      goal,
      details,
      language,
      source: "website-contact-form",
      ipAddress: readIpAddress(request),
      referrer: limitString(readString(request.headers.get("referer")), 1000),
      userAgent: limitString(readString(request.headers.get("user-agent")), 1000),
    });

    let notificationSent = false;

    try {
      await sendLeadNotification({
        name,
        email,
        company: company ?? undefined,
        goal: goal ?? undefined,
        details: details ?? undefined,
        language: language ?? undefined,
      });
      notificationSent = true;
    } catch (error) {
      console.error("Lead notification failed after Firestore write.", error);
    }

    return NextResponse.json({ ok: true, notificationSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send your message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

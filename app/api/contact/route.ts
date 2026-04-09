import { NextResponse } from "next/server";
import { sendLeadNotification } from "@/lib/discord-webhooks";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      company?: string;
      goal?: string;
      details?: string;
      language?: string;
    };

    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    await sendLeadNotification({
      name: body.name,
      email: body.email,
      company: body.company,
      goal: body.goal,
      details: body.details,
      language: body.language,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to send your message." }, { status: 500 });
  }
}

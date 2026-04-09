import { NextResponse } from "next/server";
import { sendBlogPublishedNotification } from "@/lib/discord-webhooks";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      language?: string;
      category?: string;
      authorName?: string;
    };

    if (!body.title || !body.slug || !body.language) {
      return NextResponse.json({ error: "Missing blog payload." }, { status: 400 });
    }

    await sendBlogPublishedNotification({
      title: body.title,
      slug: body.slug,
      language: body.language,
      category: body.category || "Editorial",
      authorName: body.authorName || "Aether SEO",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to notify Discord." }, { status: 500 });
  }
}

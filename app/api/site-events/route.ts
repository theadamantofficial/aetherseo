import { NextResponse } from "next/server";
import { sendAnalyticsNotification, sendCrashNotification } from "@/lib/discord-webhooks";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      path?: string;
      locale?: string;
      referrer?: string;
      userAgent?: string;
      message?: string;
      stack?: string;
    };

    if (body.type === "pageview" && body.path) {
      await sendAnalyticsNotification({
        path: body.path,
        locale: body.locale,
        referrer: body.referrer,
        userAgent: body.userAgent,
      });

      return NextResponse.json({ ok: true });
    }

    if (body.type === "crash" && body.path && body.message) {
      await sendCrashNotification({
        path: body.path,
        message: body.message,
        stack: body.stack,
        userAgent: body.userAgent,
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported site event." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unable to forward site event." }, { status: 500 });
  }
}

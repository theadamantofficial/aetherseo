import { NextResponse } from "next/server";
import {
  clearBlogAdminSession,
  createBlogAdminSession,
  isBlogAdminAuthenticated,
  isBlogAdminConfigured,
  validateBlogAdminCredentials,
} from "@/lib/blog-admin-auth";

export async function GET() {
  return NextResponse.json({
    authenticated: await isBlogAdminAuthenticated(),
    usesDefaults: false,
  });
}

export async function POST(request: Request) {
  if (!isBlogAdminConfigured()) {
    return NextResponse.json(
      { error: "Blog admin credentials are not configured in env." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { email?: string; password?: string };
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (!validateBlogAdminCredentials(body.email, body.password)) {
    return NextResponse.json({ error: "Incorrect internal credentials." }, { status: 401 });
  }

  await createBlogAdminSession();
  return NextResponse.json({
    authenticated: true,
    email: body.email,
    usesDefaults: false,
  });
}

export async function DELETE() {
  await clearBlogAdminSession();
  return NextResponse.json({ ok: true });
}

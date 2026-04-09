import crypto from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "aether-blog-admin";

function getAdminEmail() {
  return process.env.BLOG_ADMIN_EMAIL || "";
}

function getAdminPassword() {
  return process.env.BLOG_ADMIN_PASSWORD || "";
}

function getSessionToken() {
  const email = getAdminEmail();
  const password = getAdminPassword();

  if (!email || !password) {
    return "";
  }

  return crypto
    .createHash("sha256")
    .update(`${email}:${password}:aether-seo-admin-session`)
    .digest("hex");
}

export function isBlogAdminConfigured() {
  return Boolean(getAdminEmail() && getAdminPassword());
}

export function validateBlogAdminCredentials(email: string, password: string) {
  return email === getAdminEmail() && password === getAdminPassword();
}

export async function isBlogAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === getSessionToken();
}

export async function createBlogAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, getSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearBlogAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

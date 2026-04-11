import crypto from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "aether-blog-admin";

function getAdminApiToken() {
  return process.env.BLOG_ADMIN_API_TOKEN || "";
}

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

export function isBlogAdminApiTokenConfigured() {
  return Boolean(getAdminApiToken());
}

export function validateBlogAdminCredentials(email: string, password: string) {
  return email === getAdminEmail() && password === getAdminPassword();
}

function hasValidApiToken(request: Request) {
  const expectedToken = getAdminApiToken();
  if (!expectedToken) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const headerToken =
    request.headers.get("x-blog-admin-token") ||
    request.headers.get("x-api-key") ||
    "";

  const candidate = bearerToken || headerToken;
  return Boolean(candidate) && candidate === expectedToken;
}

export async function isBlogAdminAuthenticated(request?: Request) {
  if (request && hasValidApiToken(request)) {
    return true;
  }

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

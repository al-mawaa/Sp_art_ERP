import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { portalSessionCookieOptions, clearSessionCookieOptions } from "@/lib/auth/portal-session";

export const ADMIN_SESSION_COOKIE = "lba_admin_session";

function adminSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "change-me-in-production-admin-session"
  );
}

/** Signed token: base64url(payloadJson).hexHmac */
export function createAdminSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const payload = Buffer.from(JSON.stringify({ sub: "admin", exp }), "utf8").toString("base64url");
  const sig = createHmac("sha256", adminSessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** Cookie first, then Authorization Bearer or x-admin-session (fallback when cookies are blocked). */
export function getAdminSessionTokenFromRequest(request: NextRequest): string | undefined {
  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (cookie) return cookie;
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const header = request.headers.get("x-admin-session");
  if (header) return header.trim();
  return undefined;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token || !token.includes(".")) return false;
  const dot = token.lastIndexOf(".");
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", adminSessionSecret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
    if (json.sub !== "admin" || typeof json.exp !== "number") return false;
    if (json.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function adminSessionCookieOptions() {
  return portalSessionCookieOptions();
}

export function clearAdminSessionCookieOptions() {
  return clearSessionCookieOptions();
}

/** Server-side admin login — prefers ADMIN_*; falls back to NEXT_PUBLIC_* from .env. */
export function serverAdminCredentials() {
  const email = (
    process.env.ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    "anjali@littlebrushes.in"
  )
    .toLowerCase()
    .trim();
  const password =
    process.env.ADMIN_PASSWORD ||
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
    "demo1234";
  return { email, password };
}

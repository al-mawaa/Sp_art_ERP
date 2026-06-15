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
export function createAdminSessionToken(role: "admin" | "super-admin"): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const payload = Buffer.from(JSON.stringify({ sub: "admin", role, exp }), "utf8").toString("base64url");
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

type AdminSessionPayload = {
  sub: "admin";
  role: "admin" | "super-admin";
  exp: number;
};

function parseAdminSessionToken(token: string): AdminSessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const dot = token.lastIndexOf(".");
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", adminSessionSecret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSessionPayload;
    if (json.sub !== "admin" || (json.role !== "admin" && json.role !== "super-admin")) return null;
    if (typeof json.exp !== "number" || json.exp < Math.floor(Date.now() / 1000)) return null;
    return json;
  } catch {
    return null;
  }
}

export function verifyAdminSessionToken(token: string | undefined, requiredRole?: "admin" | "super-admin"): boolean {
  const parsed = token ? parseAdminSessionToken(token) : null;
  if (!parsed) return false;
  if (requiredRole && parsed.role !== requiredRole) return false;
  return true;
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

/** Server-side super admin login — read from secure env only. */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function serverSuperAdminCredentials() {
  const email = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.SUPER_ADMIN_PASSWORD || "";
  return { email, password };
}

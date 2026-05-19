import crypto from "node:crypto";

export const TEACHER_COOKIE = "teacher_token";

function getSecret(): string {
  const key = process.env.JWT_SECRET;
  if (!key || key.length < 16) {
    throw new Error("JWT_SECRET must be set in .env (min 16 characters) for teacher session");
  }
  return key;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(segment: string): string {
  const pad = segment.length % 4 === 0 ? "" : "=".repeat(4 - (segment.length % 4));
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

export type TeacherTokenPayload = {
  sub: string;
  email: string;
  role: "teacher";
};

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function signTeacherToken(payload: { id: string; email: string }): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64UrlEncode(
    JSON.stringify({
      sub: payload.id,
      email: payload.email,
      role: "teacher",
      iat: now,
      exp: now + MAX_AGE_SEC,
    }),
  );
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${header}.${body}.${sig}`;
}

export function verifyTeacherToken(token: string): TeacherTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(`${h}.${p}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    if (s.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;

    const payload = JSON.parse(base64UrlDecode(p)) as {
      sub?: string;
      email?: string;
      role?: string;
      exp?: number;
    };
    if (payload.role !== "teacher" || typeof payload.sub !== "string" || typeof payload.email !== "string")
      return null;
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: payload.sub, email: payload.email, role: "teacher" };
  } catch {
    return null;
  }
}

export function teacherCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

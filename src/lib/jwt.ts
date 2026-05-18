import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const ADMIN_COOKIE = "admin_token";

export type AdminJwtPayload = {
  id: string;
  role: "admin";
  email: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short. Set it in .env");
  }
  return new TextEncoder().encode(secret);
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN?.trim() || "7d";
}

export async function signAdminToken(payload: AdminJwtPayload): Promise<string> {
  return new SignJWT({
    id: payload.id,
    role: payload.role,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(getExpiresIn())
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin" || !payload.id || !payload.email) {
      return null;
    }
    return {
      id: String(payload.id),
      role: "admin",
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

export function decodeJwtPayloadUnsafe(token: string): JWTPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part, "base64url").toString("utf8");
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminEnv, verifyAdminPassword } from "@/lib/auth/admin-env";
import { ADMIN_COOKIE, signAdminToken } from "@/lib/jwt";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

function cookieMaxAgeSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN?.trim() || "7d";
  const match = raw.match(/^(\d+)([dhms])$/i);
  if (!match) return 60 * 60 * 24 * 7;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "d") return n * 86400;
  if (unit === "h") return n * 3600;
  if (unit === "m") return n * 60;
  return n;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map(e => e.message).join("; ") },
        { status: 422 },
      );
    }

    const { email, password } = parsed.data;
    const { email: adminEmail, password: adminPassword, passwordHash } = getAdminEnv();

    if (email.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordValid = await verifyAdminPassword(password, adminPassword, passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const payload = {
      id: "admin",
      role: "admin" as const,
      email: adminEmail,
    };

    const token = await signAdminToken(payload);

    const response = NextResponse.json({
      message: "Login successful",
      admin: {
        id: payload.id,
        role: payload.role,
        email: payload.email,
        name: "Admin",
      },
    });

    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAgeSeconds(),
    });

    return response;
  } catch (error) {
    console.error("[admin/login]", error);
    const message =
      error instanceof Error && error.message.includes("ADMIN_EMAIL")
        ? "Server configuration error"
        : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

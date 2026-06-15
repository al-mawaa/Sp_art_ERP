import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  verifyAdminSessionToken,
  getAdminSessionTokenFromRequest,
  adminSessionCookieOptions,
  clearAdminSessionCookieOptions,
  serverAdminCredentials,
  serverSuperAdminCredentials,
} from "@/lib/auth/admin-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .toLowerCase()
      .trim();
    const password = String(body.password || "");
    const desiredRole = String(body.role || "admin");

    if (!email || !password || (desiredRole !== "admin" && desiredRole !== "super-admin")) {
      return NextResponse.json({ success: false, error: "Email, password, and role are required" }, { status: 400 });
    }

    let token: string | null = null;
    if (desiredRole === "super-admin") {
      const expectedEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
      const expectedPassword = process.env.SUPER_ADMIN_PASSWORD || "";

      console.log("[Super Admin Login]", {
        attempt: { email, passwordLen: password.length },
        expected: { email: expectedEmail, passwordLen: expectedPassword.length },
      });

      if (!expectedEmail || !expectedPassword) {
        console.error("[Super Admin] Credentials not configured in .env");
        return NextResponse.json({ success: false, error: "Super Admin login is not configured" }, { status: 500 });
      }

      const emailMatch = email === expectedEmail;
      const passwordMatch = password === expectedPassword;

      console.log("[Super Admin Validation]", { emailMatch, passwordMatch });

      if (!emailMatch || !passwordMatch) {
        console.warn("[Super Admin] Invalid credentials attempt", { email, expectedEmail });
        return NextResponse.json({ success: false, error: "Invalid Super Admin credentials" }, { status: 401 });
      }

      token = createAdminSessionToken("super-admin");
    } else {
      const { email: expectedEmail, password: expectedPassword } = serverAdminCredentials();
      if (!expectedEmail || !expectedPassword) {
        return NextResponse.json({ success: false, error: "Admin login is not configured" }, { status: 500 });
      }
      if (email !== expectedEmail || password !== expectedPassword) {
        return NextResponse.json({ success: false, error: "Invalid admin credentials" }, { status: 401 });
      }
      token = createAdminSessionToken("admin");
    }

    const res = NextResponse.json({ success: true, data: { token } });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    return res;
  } catch (error) {
    console.error("[Admin Session] Error:", error);
    return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", clearAdminSessionCookieOptions());
  return res;
}

export async function GET(request: NextRequest) {
  const token = getAdminSessionTokenFromRequest(request);
  const ok = verifyAdminSessionToken(token);
  return NextResponse.json({
    success: true,
    data: { authenticated: ok, token: ok ? token : undefined },
  });
}

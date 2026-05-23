import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  verifyAdminSessionToken,
  getAdminSessionTokenFromRequest,
  adminSessionCookieOptions,
  clearAdminSessionCookieOptions,
  serverAdminCredentials,
} from "@/lib/auth/admin-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .toLowerCase()
      .trim();
    const password = String(body.password || "");
    const { email: expectEmail, password: expectPassword } = serverAdminCredentials();
    if (!email || !password || email !== expectEmail || password !== expectPassword) {
      return NextResponse.json({ success: false, error: "Invalid admin credentials" }, { status: 401 });
    }
    const token = createAdminSessionToken();
    const res = NextResponse.json({ success: true, data: { token } });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    return res;
  } catch {
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

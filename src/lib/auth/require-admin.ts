import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionTokenFromRequest, verifyAdminSessionToken } from "@/lib/auth/admin-session";

export async function requireAdminFromRequest(
  request: NextRequest,
  requiredRole?: "admin" | "super-admin"
) {
  const token = getAdminSessionTokenFromRequest(request);
  if (!verifyAdminSessionToken(token, requiredRole)) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  const { serverAdminCredentials } = await import("@/lib/auth/admin-session");
  return { ok: true as const, adminEmail: serverAdminCredentials().email };
}

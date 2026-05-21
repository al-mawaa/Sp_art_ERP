import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionTokenFromRequest, verifyAdminSessionToken } from "@/lib/auth/admin-session";

export async function requireAdminFromRequest(request: NextRequest) {
  const token = getAdminSessionTokenFromRequest(request);
  if (!verifyAdminSessionToken(token)) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const };
}

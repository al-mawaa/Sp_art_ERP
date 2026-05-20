import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, getAdminSessionTokenFromRequest } from "@/lib/auth/admin-session";
import { requireSeniorTeacherFromRequest } from "@/lib/auth/require-senior-teacher";

export type BatchAccess =
  | { kind: "admin" }
  | { kind: "senior"; seniorTeacherId: string };

export async function getBatchAccess(request: NextRequest): Promise<BatchAccess | null> {
  const adminToken = getAdminSessionTokenFromRequest(request);
  if (verifyAdminSessionToken(adminToken)) {
    return { kind: "admin" };
  }
  const st = await requireSeniorTeacherFromRequest(request);
  if (st.ok) {
    return { kind: "senior", seniorTeacherId: st.seniorTeacher.id };
  }
  return null;
}

export async function requireBatchRead(request: NextRequest) {
  const access = await getBatchAccess(request);
  if (!access) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const, access };
}

/** Create / update / delete batches — admin HTTP-only session only (req. 14). */
export async function requireBatchWrite(request: NextRequest) {
  const token = getAdminSessionTokenFromRequest(request);
  if (!verifyAdminSessionToken(token)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Forbidden — only an authenticated admin can modify batches" },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const };
}

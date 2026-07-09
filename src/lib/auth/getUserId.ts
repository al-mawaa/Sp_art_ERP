import { NextRequest } from "next/server";
import { STUDENT_SESSION_COOKIE, TEACHER_SESSION_COOKIE, SENIOR_TEACHER_SESSION_COOKIE } from "@/lib/auth/portal-session";
import { getAdminSessionTokenFromRequest, verifyAdminSessionToken } from "@/lib/auth/admin-session";

export function getUserIdFromRequest(req: NextRequest): string | null {
  const studentId = req.cookies.get(STUDENT_SESSION_COOKIE)?.value;
  if (studentId) return studentId;

  const teacherId = req.cookies.get(TEACHER_SESSION_COOKIE)?.value;
  if (teacherId) return teacherId;

  const srTeacherId = req.cookies.get(SENIOR_TEACHER_SESSION_COOKIE)?.value;
  if (srTeacherId) return srTeacherId;

  const adminToken = getAdminSessionTokenFromRequest(req);
  if (adminToken && verifyAdminSessionToken(adminToken)) {
    return "admin";
  }

  return null;
}

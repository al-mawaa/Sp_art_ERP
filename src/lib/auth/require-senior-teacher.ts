import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { SENIOR_TEACHER_SESSION_COOKIE } from "@/lib/auth/portal-session";

export async function requireSeniorTeacherFromRequest(request: NextRequest) {
  const id = request.cookies.get(SENIOR_TEACHER_SESSION_COOKIE)?.value;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Not signed in as a senior teacher. Log out, then sign in at Login → Senior Teacher.",
        },
        { status: 401 },
      ),
    };
  }
  return { ok: true as const, seniorTeacher: { id } };
}

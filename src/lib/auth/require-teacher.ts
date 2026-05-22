import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { TEACHER_SESSION_COOKIE } from "@/lib/auth/portal-session";

export async function requireTeacherFromRequest(request: NextRequest) {
  const id = request.cookies.get(TEACHER_SESSION_COOKIE)?.value;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Not signed in as a teacher. Log out, then sign in again at Login → Teacher with your credential email and password.",
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true as const, teacher: { id } };
}

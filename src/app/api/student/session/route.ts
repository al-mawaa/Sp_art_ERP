import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/lib/models/Student";
import { requireStudentFromRequest } from "@/lib/auth/require-student";

export const runtime = "nodejs";

/** Verify student session cookie and return basic student info */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return (auth as { ok: false; response: import("next/server").NextResponse }).response;

    await dbConnect();
    const student = await Student.findById(auth.student.id).select("fullName email");
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student record not found. Please log in again." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: student._id.toString(),
        fullName: student.fullName,
        email: student.email,
      },
    });
  } catch (e) {
    console.error("[student/session GET]", e);
    return NextResponse.json({ success: false, error: "Session check failed" }, { status: 500 });
  }
}

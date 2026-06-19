import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireTeacherFromRequest } from "@/lib/auth/require-teacher";
import { getTeacherPayrollHistory } from "@/lib/payroll/payrollService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const history = await getTeacherPayrollHistory("teacher", auth.teacher.id);
    return apiSuccess({
      current: history[0] ?? null,
      history,
    });
  } catch (error) {
    console.error("[teacher/salary GET]", error);
    return apiError("Failed to load salary details", 500);
  }
}

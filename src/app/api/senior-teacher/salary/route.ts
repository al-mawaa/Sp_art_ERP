import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSeniorTeacherFromRequest } from "@/lib/auth/require-senior-teacher";
import { getTeacherPayrollHistory } from "@/lib/payroll/payrollService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const history = await getTeacherPayrollHistory("senior_teacher", auth.seniorTeacher.id);
    return apiSuccess({
      current: history[0] ?? null,
      history,
    });
  } catch (error) {
    console.error("[senior-teacher/salary GET]", error);
    return apiError("Failed to load salary details", 500);
  }
}

import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { findStudentById } from "@/lib/student-portal";
import { findBatchesForStudent } from "@/lib/student/studentBatches";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const student = await findStudentById(auth.student.id);
    if (!student) {
      return apiError("Student not found", 404);
    }

    const classes = await findBatchesForStudent(student);

    return apiSuccess({ classes });
  } catch (error) {
    console.error("[student/classes GET]", error);
    return apiError("Failed to load classes", 500);
  }
}

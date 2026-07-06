import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { findStudentById } from "@/lib/student-portal";
import { findBatchesForStudent } from "@/lib/student/studentBatches";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    console.log("[student/classes GET] Starting request");
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    console.log("[student/classes GET] Student auth OK, ID:", auth.student.id);
    await dbConnect();

    console.log("[student/classes GET] DB connected, finding student");
    const student = await findStudentById(auth.student.id);
    if (!student) {
      console.log("[student/classes GET] Student not found");
      return apiError("Student not found", 404);
    }

    console.log("[student/classes GET] Student found, finding batches");
    const classes = await findBatchesForStudent(student);

    console.log("[student/classes GET] Classes found:", classes.length);
    return apiSuccess({ classes });
  } catch (error) {
    console.error("[student/classes GET] Error:", error);
    console.error("[student/classes GET] Error stack:", error instanceof Error ? error.stack : "No stack");
    return apiError("Failed to load classes", 500);
  }
}

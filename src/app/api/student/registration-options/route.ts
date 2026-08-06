import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import CourseModel from "@/lib/models/Course";
import BatchModel from "@/lib/models/Batch";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    // Fetch active courses
    const courses = await CourseModel.find({ status: "active" }, "courseTitle").lean();

    // Fetch active batches
    const batches = await BatchModel.find(
      { batchStatus: "Active" },
      "batchName batchTiming branch courseName"
    ).lean();

    // Get unique branches from the active batches
    const branches = await BatchModel.distinct("branch", { batchStatus: "Active" });

    return apiSuccess({
      courses,
      batches,
      branches,
    });
  } catch (error) {
    console.error("[registration-options GET]", error);
    return apiError("Failed to fetch registration options", 500);
  }
}

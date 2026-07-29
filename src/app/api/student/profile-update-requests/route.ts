import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import ProfileUpdateRequest from "@/lib/models/ProfileUpdateRequest";
import Student from "@/lib/models/Student";

export const runtime = "nodejs";

const createRequestSchema = z.object({
  field: z.string().min(1, "Field is required"),
  currentValue: z.string(),
  newValue: z.string().min(1, "New value is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map(e => e.message).join("; "), 422);
    }

    await dbConnect();

    // Get student details
    const student = await Student.findById(auth.student.id);
    if (!student) {
      return apiError("Student not found", 404);
    }

    // Check if there's already a pending request for the same field
    const existingPendingRequest = await ProfileUpdateRequest.findOne({
      studentId: auth.student.id,
      field: parsed.data.field,
      status: 'pending',
    });

    if (existingPendingRequest) {
      return apiError("You already have a pending request for this field. Please wait for it to be reviewed.", 400);
    }

    // Create the profile update request
    const updateRequest = await ProfileUpdateRequest.create({
      studentId: auth.student.id,
      studentName: student.fullName,
      studentEmail: student.email,
      field: parsed.data.field,
      currentValue: parsed.data.currentValue,
      newValue: parsed.data.newValue,
      reason: parsed.data.reason,
      status: 'pending',
    });

    return apiSuccess(
      { request: updateRequest },
      { message: "Profile update request submitted successfully" },
    );
  } catch (error) {
    console.error("[student/profile-update-requests POST]", error);
    return apiError("Failed to submit profile update request", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    // Get all profile update requests for this student
    const requests = await ProfileUpdateRequest.find({
      studentId: auth.student.id,
    }).sort({ createdAt: -1 });

    return apiSuccess({ requests });
  } catch (error) {
    console.error("[student/profile-update-requests GET]", error);
    return apiError("Failed to fetch profile update requests", 500);
  }
}

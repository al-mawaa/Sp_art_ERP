import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import CourseEnrollment from "@/lib/models/CourseEnrollment";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError("Invalid enrollment", 400);
    }

    const body = await request.json();
    const action = String(body.action || "");

    await dbConnect();
    const enrollment = await CourseEnrollment.findById(id);
    if (!enrollment) return apiError("Enrollment not found", 404);

    if (action === "approve") {
      enrollment.status = "enrolled";
      if (enrollment.paymentStatus === "pending") {
        enrollment.paymentStatus = "paid";
        enrollment.paidAmount = enrollment.totalAmount;
      }
      enrollment.enrollmentDate = enrollment.enrollmentDate ?? new Date();
      await enrollment.save();
      return apiSuccess({
        id: enrollment._id.toString(),
        status: enrollment.status,
        paymentStatus: enrollment.paymentStatus,
      });
    }

    if (action === "cancel") {
      enrollment.status = "cancelled";
      await enrollment.save();
      return apiSuccess({ id: enrollment._id.toString(), status: enrollment.status });
    }

    return apiError("Unknown action", 400);
  } catch (e) {
    console.error("[admin/enrollments/[id] PATCH]", e);
    return apiError("Failed to update enrollment", 500);
  }
}

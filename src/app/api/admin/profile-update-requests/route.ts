import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import ProfileUpdateRequest from "@/lib/models/ProfileUpdateRequest";
import Student from "@/lib/models/Student";

export const runtime = "nodejs";

const reviewRequestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  action: z.enum(['approve', 'reject']),
  reviewComment: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const requests = await ProfileUpdateRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('studentId', 'fullName email badgeId')
      .populate('reviewedBy', 'fullName email');

    return apiSuccess({ requests });
  } catch (error) {
    console.error("[admin/profile-update-requests GET]", error);
    return apiError("Failed to fetch profile update requests", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map(e => e.message).join("; "), 422);
    }

    await dbConnect();

    const updateRequest = await ProfileUpdateRequest.findById(parsed.data.requestId);
    if (!updateRequest) {
      return apiError("Profile update request not found", 404);
    }

    if (updateRequest.status !== 'pending') {
      return apiError("This request has already been reviewed", 400);
    }

    const isApproved = parsed.data.action === 'approve';

    // Update the request status
    updateRequest.status = isApproved ? 'approved' : 'rejected';
    updateRequest.reviewedBy = undefined; // Store admin email in reviewComment instead
    updateRequest.reviewedAt = new Date();
    updateRequest.reviewComment = parsed.data.reviewComment 
      ? `${parsed.data.reviewComment} (Reviewed by: ${auth.adminEmail})`
      : `Reviewed by: ${auth.adminEmail}`;
    await updateRequest.save();

    // If approved, update the student's profile
    if (isApproved) {
      const student = await Student.findById(updateRequest.studentId);
      if (!student) {
        return apiError("Student not found", 404);
      }

      // Update the specific field
      switch (updateRequest.field) {
        case 'dob':
          student.dob = updateRequest.newValue ? new Date(updateRequest.newValue) : undefined;
          break;
        case 'gender':
          student.gender = updateRequest.newValue;
          break;
        case 'bloodGroup':
          student.bloodGroup = updateRequest.newValue;
          break;
        case 'phone':
          student.phone = updateRequest.newValue;
          break;
        case 'address':
          student.address = updateRequest.newValue;
          break;
        case 'fatherMobile':
          student.fatherMobile = updateRequest.newValue;
          break;
        case 'motherMobile':
          student.motherMobile = updateRequest.newValue;
          break;
        case 'howYouKnowUs':
          student.howYouKnowUs = updateRequest.newValue;
          break;
        default:
          break;
      }

      await student.save();
    }

    return apiSuccess(
      { request: updateRequest },
      { message: isApproved ? "Profile update request approved and profile updated" : "Profile update request rejected" },
    );
  } catch (error) {
    console.error("[admin/profile-update-requests PATCH]", error);
    return apiError("Failed to review profile update request", 500);
  }
}

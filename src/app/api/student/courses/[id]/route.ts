import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { findStudentById } from "@/lib/student-portal";
import { findCourseDetailForStudent } from "@/lib/student/studentCourses";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import StudentPayment from "@/lib/models/StudentPayment";
import { getPublicRazorpayKeyId } from "@/lib/razorpay/server";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id: batchId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return apiError("Invalid course", 400);
    }

    await dbConnect();
    const student = await findStudentById(auth.student.id);
    if (!student) return apiError("Student not found", 404);

    const course = await findCourseDetailForStudent(student, batchId);
    if (!course) return apiError("Course not found", 404);

    const enrollment = await CourseEnrollment.findOne({
      studentId: student._id,
      batchId: new mongoose.Types.ObjectId(batchId),
    }).lean();

    const payments = enrollment
      ? await StudentPayment.find({
          enrollmentId: enrollment._id,
          status: "paid",
        })
          .sort({ paidAt: -1 })
          .lean()
      : [];

    return apiSuccess({
      course,
      enrollment: enrollment
        ? {
            id: enrollment._id.toString(),
            paymentStatus: enrollment.paymentStatus,
            status: enrollment.status,
            totalAmount: enrollment.totalAmount,
            paidAmount: enrollment.paidAmount,
            installmentType: enrollment.installmentType,
            installmentsPaid: enrollment.installmentsPaid,
            installmentCount: enrollment.installmentCount,
            nextDueDate: enrollment.nextDueDate,
          }
        : null,
      payments: payments.map(p => ({
        id: p._id.toString(),
        amount: p.amount,
        receiptNumber: p.receiptNumber,
        razorpayPaymentId: p.razorpayPaymentId,
        paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : null,
        installmentNumber: p.installmentNumber,
      })),
      schedule: {
        batchDays: course.batchDays,
        batchTiming: course.batchTiming,
        branch: course.branch,
        startDate: course.startDate,
        endDate: course.endDate,
      },
      assignments: [],
      exams: [],
      tasks: [
        { id: "1", title: "Studio practice log", status: course.completedTasks >= 3 ? "done" : "pending" },
        { id: "2", title: "Color theory worksheet", status: course.completedTasks >= 6 ? "done" : "pending" },
        { id: "3", title: "Final artwork submission", status: course.completedTasks >= 9 ? "done" : "pending" },
      ],
      razorpayKeyId: getPublicRazorpayKeyId(),
    });
  } catch (e) {
    console.error("[student/courses/[id] GET]", e);
    return apiError("Failed to load course details", 500);
  }
}

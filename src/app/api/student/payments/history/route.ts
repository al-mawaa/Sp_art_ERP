import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { findStudentById } from "@/lib/student-portal";
import StudentPayment from "@/lib/models/StudentPayment";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import Batch from "@/lib/models/Batch";
import Course from "@/lib/models/Course";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const student = await findStudentById(auth.student.id);
    if (!student) return apiError("Student not found", 404);

    const [payments, enrollments] = await Promise.all([
      StudentPayment.find({ studentId: student._id }).sort({ createdAt: -1 }).limit(50).lean(),
      CourseEnrollment.find({ studentId: student._id }).lean(),
    ]);

    const batchIds = [...new Set(payments.map(p => p.batchId.toString()))];
    const courseIds = [...new Set(payments.map(p => p.courseId.toString()))];

    const [batches, courses] = await Promise.all([
      Batch.find({ _id: { $in: batchIds } }).select("batchName courseName").lean(),
      Course.find({ _id: { $in: courseIds } }).select("courseTitle").lean(),
    ]);

    const batchMap = new Map(batches.map(b => [b._id.toString(), b.batchName]));
    const courseMap = new Map(courses.map(c => [c._id.toString(), c.courseTitle]));

    const history = payments.map(p => ({
      id: p._id.toString(),
      amount: p.amount,
      status: p.status,
      receiptNumber: p.receiptNumber,
      razorpayPaymentId: p.razorpayPaymentId,
      razorpayOrderId: p.razorpayOrderId,
      paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : null,
      installmentNumber: p.installmentNumber,
      batchName: batchMap.get(p.batchId.toString()) ?? "—",
      courseName: courseMap.get(p.courseId.toString()) ?? "—",
    }));

    const enrolled = enrollments.filter(e => e.status === "enrolled").length;
    const active = enrollments.filter(
      e => e.status === "enrolled" && (e.paymentStatus === "paid" || e.paymentStatus === "partial"),
    ).length;
    const upcoming = enrollments.filter(
      e => e.paymentStatus === "pending" || e.paymentStatus === "partial",
    );

    return apiSuccess({
      history,
      summary: {
        enrolledCourses: enrolled,
        activeCourses: active,
        upcomingPayments: upcoming.map(e => ({
          batchId: e.batchId.toString(),
          remainingAmount: Math.max(0, e.totalAmount - e.paidAmount),
          nextDueDate: e.nextDueDate,
          paymentStatus: e.paymentStatus,
        })),
        totalPaid: payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0),
      },
    });
  } catch (e) {
    console.error("[student/payments/history GET]", e);
    return apiError("Failed to load payment history", 500);
  }
}

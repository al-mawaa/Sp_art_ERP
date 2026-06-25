import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import type { CourseDocument } from "@/lib/models/Course";
import type { CourseEnrollmentDocument } from "@/lib/models/CourseEnrollment";
import type { StudentDocument } from "@/lib/models/Student";
import type { BatchDocument } from "@/lib/models/Batch";
import dbConnect from "@/lib/mongodb";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import EnrollmentInstallment from "@/lib/models/EnrollmentInstallment";
import EnrollmentPaymentRecord from "@/lib/models/EnrollmentPaymentRecord";
import Student from "@/lib/models/Student";
import Course from "@/lib/models/Course";
import Batch from "@/lib/models/Batch";
import Teacher from "@/lib/models/Teacher";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import { refreshEnrollmentPaymentStatus } from "@/lib/enrollment/enrollmentPaymentService";

export const runtime = "nodejs";

type PopulatedEnrollment = CourseEnrollmentDocument & {
  studentId: StudentDocument;
  courseId: CourseDocument;
  batchId?: BatchDocument | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId?: string }> },
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { studentId } = await params;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    await dbConnect();

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const enrollments = await CourseEnrollment.find({
      studentId: new mongoose.Types.ObjectId(studentId),
    })
      .populate({ path: "courseId", model: Course })
      .populate({ path: "batchId", model: Batch })
      .sort({ enrollmentDate: -1 });

    const populatedEnrollments = enrollments as unknown as PopulatedEnrollment[];
    const formattedEnrollments = [];

    let totalPaid = 0;
    let totalAmount = 0;
    let totalPending = 0;
    let completedPayments = 0;
    let pendingInstallments = 0;
    let activeCourses = 0;

    for (const enrollment of populatedEnrollments) {
      const course = enrollment.courseId;
      if (!course?.courseTitle) continue;

      await refreshEnrollmentPaymentStatus(enrollment);

      const installments = await EnrollmentInstallment.find({
        enrollmentId: enrollment._id,
      }).sort({ termNo: 1 });

      const paymentHistory = await EnrollmentPaymentRecord.find({
        enrollmentId: enrollment._id,
      }).sort({ paidAt: -1 });

      const batch = enrollment.batchId;
      let teacherName = "Not Assigned";
      if (batch && batch.teacherIds && batch.teacherIds.length > 0) {
        try {
          const teacher = await Teacher.findById(batch.teacherIds[0]);
          if (teacher?.fullName) teacherName = teacher.fullName;
        } catch {
          // Teacher lookup may fail; gracefully default
        }
      }

      const enrollmentTotalAmount = enrollment.totalAmount ?? enrollment.amount ?? 0;
      const enrollmentPaidAmount = enrollment.paidAmount ?? 0;
      const enrollmentRemainingAmount = enrollment.remainingAmount ?? 0;

      totalAmount += enrollmentTotalAmount;
      totalPaid += enrollmentPaidAmount;
      totalPending += enrollmentRemainingAmount;

      if (enrollment.status === "active") activeCourses++;
      if (
        enrollment.paymentPlanStatus === "paid" ||
        enrollment.paymentStatus === "paid"
      ) {
        completedPayments++;
      }

      const paidInstallments = installments.filter(
        (i) => i.paymentStatus === "paid",
      ).length;
      const unpaidInstallments = installments.filter(
        (i) => i.paymentStatus !== "paid",
      ).length;
      pendingInstallments += unpaidInstallments;

      formattedEnrollments.push({
        enrollmentId: enrollment._id.toString(),
        courseId: course._id?.toString() ?? enrollment.courseId.toString(),
        courseTitle: course.courseTitle,
        courseCode: course.courseCode,
        courseDuration: course.duration ?? 0,
        courseFee: course.discountFees ?? course.totalFees ?? 0,
        batchName: batch?.batchName ?? "Not Assigned",
        teacherName,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status,
        completionPercentage: enrollment.completionPercentage,
        paymentType:
          installments.length > 0
            ? "installment"
            : (enrollment.paymentType ?? "full"),
        baseAmount: enrollment.baseAmount ?? 0,
        gstAmount: enrollment.taxAmount ?? 0,
        referralDiscount: enrollment.referralDiscountApplied ?? 0,
        installmentCharge: enrollment.installmentCharge ?? 0,
        totalAmount: enrollmentTotalAmount,
        paidAmount: enrollmentPaidAmount,
        remainingAmount: enrollmentRemainingAmount,
        paymentStatus: enrollment.paymentStatus,
        paymentPlanStatus:
          enrollment.paymentPlanStatus ?? enrollment.paymentStatus ?? "pending",
        totalInstallments: installments.length,
        paidInstallments,
        pendingInstallments: unpaidInstallments,
        installments: installments.map((i) => ({
          installmentId: i._id.toString(),
          termNo: i.termNo,
          amount: i.amount,
          dueDate: i.dueDate,
          paidDate: i.paidDate,
          paidAmount: i.paidAmount,
          paymentStatus: i.paymentStatus,
        })),
        paymentHistory: paymentHistory.map((p) => ({
          transactionId: p.paymentId,
          paymentDate: p.paidAt,
          amount: p.amount,
          paymentMethod: p.paymentMethod ?? "Razorpay",
          status: p.paymentStatus,
          orderId: p.orderId,
          termNo: p.termNo,
          invoiceId: p.invoiceId,
        })),
      });
    }

    return NextResponse.json(
      {
        student: {
          studentId: student._id.toString(),
          studentName: student.fullName,
          studentEmail: student.email ?? "",
          studentBadgeId: student.badgeId ?? "",
          phone: student.phone ?? "",
        },
        summary: {
          totalCourses: formattedEnrollments.length,
          activeCourses,
          totalAmount,
          totalPaid,
          totalPending,
          completedPayments,
          pendingInstallments,
        },
        enrollments: formattedEnrollments,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching student enrollments:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch student enrollments", details: errorMessage },
      { status: 500 },
    );
  }
}

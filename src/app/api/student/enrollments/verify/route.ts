import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { findStudentById } from "@/lib/student-portal";
import { addStudentToBatchRoster } from "@/lib/student/studentCourses";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import StudentPayment from "@/lib/models/StudentPayment";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay/server";
import { installmentAmount, nextDueDateString } from "@/lib/payments/installments";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const razorpay_order_id = String(body.razorpay_order_id || body.orderId || "");
    const razorpay_payment_id = String(body.razorpay_payment_id || body.paymentId || "");
    const razorpay_signature = String(body.razorpay_signature || body.signature || "");

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return apiError("Missing payment verification fields", 400);
    }

    const valid = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!valid) {
      return apiError("Invalid payment signature", 400);
    }

    await dbConnect();
    const student = await findStudentById(auth.student.id);
    if (!student) return apiError("Student not found", 404);

    const payment = await StudentPayment.findOne({
      razorpayOrderId: razorpay_order_id,
      studentId: student._id,
    });

    if (!payment) return apiError("Payment record not found", 404);

    if (payment.status === "paid") {
      return apiSuccess({
        alreadyVerified: true,
        receiptNumber: payment.receiptNumber,
        paymentId: payment.razorpayPaymentId,
      });
    }

    const enrollment = await CourseEnrollment.findById(payment.enrollmentId);
    if (!enrollment) return apiError("Enrollment not found", 404);

    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();
    await payment.save();

    const newPaid = (enrollment.paidAmount ?? 0) + payment.amount;
    enrollment.paidAmount = newPaid;
    enrollment.installmentsPaid = (enrollment.installmentsPaid ?? 0) + 1;

    if (newPaid >= enrollment.totalAmount) {
      enrollment.paymentStatus = "paid";
      enrollment.status = "enrolled";
      enrollment.enrollmentDate = new Date();
      enrollment.nextDueDate = undefined;
    } else {
      enrollment.paymentStatus = "partial";
      enrollment.status = "enrolled";
      enrollment.nextDueDate = nextDueDateString(1);
    }

    await enrollment.save();

    try {
      await addStudentToBatchRoster(enrollment.batchId.toString(), student);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg !== "BATCH_FULL") throw e;
    }

    const nextInstallment =
      enrollment.paymentStatus === "partial"
        ? installmentAmount(
            enrollment.totalAmount,
            enrollment.installmentType,
            enrollment.installmentCount,
          )
        : 0;

    return apiSuccess({
      success: true,
      receiptNumber: payment.receiptNumber,
      paymentId: razorpay_payment_id,
      enrollment: {
        paymentStatus: enrollment.paymentStatus,
        paidAmount: enrollment.paidAmount,
        totalAmount: enrollment.totalAmount,
        remainingAmount: Math.max(0, enrollment.totalAmount - enrollment.paidAmount),
        nextDueDate: enrollment.nextDueDate,
        nextInstallmentAmount: nextInstallment,
      },
      courseName: payment.courseId.toString(),
    });
  } catch (e) {
    console.error("[student/enrollments/verify POST]", e);
    return apiError("Payment verification failed", 500);
  }
}

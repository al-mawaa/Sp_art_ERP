import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { findStudentById } from "@/lib/student-portal";
import { findCourseDetailForStudent } from "@/lib/student/studentCourses";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import StudentPayment from "@/lib/models/StudentPayment";
import Course from "@/lib/models/Course";
import { createRazorpayOrder, generateReceiptNumber, getPublicRazorpayKeyId } from "@/lib/razorpay/server";
import { installmentAmount, installmentCount, nextDueDateString } from "@/lib/payments/installments";
import type { InstallmentType } from "@/lib/models/CourseEnrollment";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const batchId = String(body.batchId || "").trim();
    const courseId = String(body.courseId || "").trim();
    const installmentType = (body.installmentType || "full") as InstallmentType;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return apiError("Invalid batch", 400);
    }

    await dbConnect();
    const student = await findStudentById(auth.student.id);
    if (!student) return apiError("Student not found", 404);

    const card = await findCourseDetailForStudent(student, batchId);
    if (!card) return apiError("Course not available", 404);
    if (card.availableSeats <= 0 && !card.isEnrolledInBatch) {
      return apiError("No seats available in this batch", 400);
    }

    const course =
      mongoose.Types.ObjectId.isValid(courseId) ?
        await Course.findById(courseId).lean()
      : await Course.findOne({
          courseTitle: { $regex: new RegExp(`^${card.courseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        }).lean();

    const resolvedCourseId = course?._id ?? new mongoose.Types.ObjectId(courseId || batchId);
    const totalAmount = card.courseFees > 0 ? card.courseFees : 5000;
    const duration = course?.duration ?? card.durationMonths;
    const payNow = installmentAmount(totalAmount, installmentType, duration);
    const count = installmentCount(installmentType, duration);

    let enrollment = await CourseEnrollment.findOne({
      studentId: student._id,
      batchId: new mongoose.Types.ObjectId(batchId),
    });

    if (enrollment?.paymentStatus === "paid" && enrollment.status === "enrolled") {
      return apiError("Already enrolled in this course", 400);
    }

    if (!enrollment) {
      enrollment = await CourseEnrollment.create({
        studentId: student._id,
        courseId: resolvedCourseId,
        batchId: new mongoose.Types.ObjectId(batchId),
        paymentStatus: "pending",
        status: "pending",
        totalAmount,
        paidAmount: 0,
        installmentType,
        installmentCount: count,
        installmentsPaid: 0,
        nextDueDate: nextDueDateString(1),
      });
    } else {
      enrollment.installmentType = installmentType;
      enrollment.installmentCount = count;
      enrollment.totalAmount = totalAmount;
      enrollment.paymentStatus = enrollment.paymentStatus === "partial" ? "partial" : "pending";
      await enrollment.save();
    }

    const receiptNumber = generateReceiptNumber();
    const order = await createRazorpayOrder({
      amountPaise: payNow * 100,
      receipt: receiptNumber,
      notes: {
        studentId: student._id.toString(),
        batchId,
        enrollmentId: enrollment._id.toString(),
      },
    });

    await StudentPayment.create({
      enrollmentId: enrollment._id,
      studentId: student._id,
      batchId: new mongoose.Types.ObjectId(batchId),
      courseId: resolvedCourseId,
      razorpayOrderId: order.id!,
      amount: payNow,
      status: "pending",
      installmentNumber: (enrollment.installmentsPaid ?? 0) + 1,
      receiptNumber,
    });

    return apiSuccess({
      orderId: order.id,
      amount: payNow,
      amountPaise: payNow * 100,
      currency: "INR",
      keyId: getPublicRazorpayKeyId(),
      enrollmentId: enrollment._id.toString(),
      receiptNumber,
      student: { name: student.fullName, email: student.email, phone: student.phone },
      course: {
        name: card.courseName,
        batchName: card.batchName,
        teacherName: card.teacherName,
        timing: card.batchTiming,
      },
      summary: {
        totalAmount,
        payNow,
        installmentType,
        installmentCount: count,
        remainingAfterPay: Math.max(0, totalAmount - (enrollment.paidAmount ?? 0) - payNow),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "RAZORPAY_NOT_CONFIGURED") {
      return apiError(
        "Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env",
        503,
      );
    }
    console.error("[student/enrollments/create-order POST]", e);
    return apiError("Failed to create payment order", 500);
  }
}

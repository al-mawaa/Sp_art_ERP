import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import Course from "@/lib/models/Course";
import Student from "@/lib/models/Student";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import { generateEnrollmentInvoicePdf } from "@/lib/invoice";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId?: string; enrollmentId?: string }> },
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { studentId, enrollmentId } = await params;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }
    if (!enrollmentId || !mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return NextResponse.json({ error: "Invalid enrollment ID" }, { status: 400 });
    }

    await dbConnect();

    const enrollment = await CourseEnrollment.findOne({
      _id: new mongoose.Types.ObjectId(enrollmentId),
      studentId: new mongoose.Types.ObjectId(studentId),
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 },
      );
    }

    const course = await Course.findById(enrollment.courseId);
    if (!course) {
      return NextResponse.json(
        { error: "Course data unavailable" },
        { status: 404 },
      );
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 },
      );
    }

    const invoiceId =
      enrollment.invoiceId ??
      `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    if (!enrollment.invoiceId) {
      enrollment.invoiceId = invoiceId;
      enrollment.invoiceGeneratedAt = new Date();
      await enrollment.save();
    }

    const cleanCourseTitle = String(course.courseTitle || "course")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase();
    const cleanStudentName = String(student.fullName || "student")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase();
    const filename = `invoice-${cleanCourseTitle}-${cleanStudentName}.pdf`;

    const pdfBuffer = await generateEnrollmentInvoicePdf({
      invoiceId,
      academyName: "SP Art Hub",
      studentName: String(student.fullName || "Student Name"),
      studentEmail: student.email || "",
      courseTitle: String(course.courseTitle || "Course Title"),
      courseCode: String(course.courseCode || "N/A"),
      courseDurationMonths: Number(course.duration ?? 0),
      baseAmount: Number(enrollment.baseAmount ?? 0),
      amountPaid: Number(enrollment.paidAmount ?? enrollment.amount ?? 0),
      discountPercentage: Number(
        enrollment.discountPercentage ?? course.discountPercentage ?? 0,
      ),
      discountAmount: Number(
        enrollment.discountAmount ??
          Math.max(
            0,
            Number(course.totalFees ?? 0) -
              Number(enrollment.baseAmount ?? enrollment.amount ?? 0),
          ),
      ),
      paymentMethod: enrollment.paymentMethod || "Razorpay",
      transactionId: enrollment.paymentId || "",
      orderId: enrollment.orderId || "",
      purchaseDate: enrollment.enrollmentDate
        ? enrollment.enrollmentDate.toISOString()
        : new Date().toISOString(),
      taxAmount: Number(enrollment.taxAmount ?? 0),
      installmentCharge: Number(enrollment.installmentCharge ?? 0),
      paymentType: enrollment.paymentType ?? "full",
      supportEmail:
        process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        "spinstituteofart@gmail.com",
      supportPhone: process.env.SUPPORT_PHONE || "+91 9819703242",
      gstNumber: process.env.GST_NUMBER,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Admin invoice download error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate invoice",
      },
      { status: 500 },
    );
  }
}

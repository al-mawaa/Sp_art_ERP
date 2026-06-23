import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import dbConnect from "@/lib/mongodb";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { assertRazorpayConfigured } from "@/lib/razorpay/config";
import Student from "@/lib/models/Student";
import type { PaymentType } from "@/lib/enrollment/paymentCalculations";
import {
  createPendingReferralTransaction,
  resolveReferralPaymentAdjustment,
} from "@/lib/referral/referralService";

export const runtime = "nodejs";

function normalizePhoneForRazorpay(phone?: string) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const courseId = typeof body?.courseId === "string" ? body.courseId.trim() : "";
    const paymentType: PaymentType =
      body?.paymentType === "installment" ? "installment" : "full";
    const termNo = Math.max(1, Number(body?.termNo ?? 1));
    const enrollmentId =
      typeof body?.enrollmentId === "string" ? body.enrollmentId.trim() : undefined;
    const referralCode =
      typeof body?.referralCode === "string" ? body.referralCode.trim() : undefined;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    await dbConnect();

    let pricing;
    try {
      pricing = await resolveReferralPaymentAdjustment({
        courseId,
        studentId: auth.student.id,
        paymentType,
        termNo,
        enrollmentId,
        referralCode,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to resolve payment";
      const status =
        message.includes("Already enrolled") || message.includes("referral")
          ? message.includes("Already enrolled")
            ? 409
            : 400
          : 400;
      return NextResponse.json({ error: message }, { status });
    }

    const { resolved, chargeAmount, referralDiscount, validatedReferral } = pricing;

    const { keyId: razorpayKeyId, keySecret: razorpayKeySecret } = assertRazorpayConfigured();
    const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(chargeAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        courseId,
        studentId: auth.student.id,
        paymentType: resolved.paymentType,
        termNo: String(resolved.termNo),
        ...(resolved.enrollmentId ? { enrollmentId: resolved.enrollmentId } : {}),
        ...(validatedReferral?.valid ? { referralCode: validatedReferral.referralCode } : {}),
        ...(referralDiscount > 0 ? { referralDiscount: String(referralDiscount) } : {}),
      },
    });

    if (validatedReferral?.valid) {
      const student = await Student.findById(auth.student.id).select("fullName");
      await createPendingReferralTransaction({
        referrerId: validatedReferral.referrerId,
        referredStudentId: auth.student.id,
        referredStudentName: student?.fullName ?? "Student",
        referralCode: validatedReferral.referralCode,
        referralPercentage: validatedReferral.referralPercentage,
        courseAmount: resolved.breakdown.totalAmount,
        enrolleeDiscount: referralDiscount,
        orderId: order.id,
      });
    }

    const student = await Student.findById(auth.student.id).select("fullName email phone fatherMobile");
    const prefill = {
      name: student?.fullName ?? "",
      email: student?.email ?? "",
      contact: normalizePhoneForRazorpay(student?.phone || student?.fatherMobile),
    };

    return NextResponse.json({
      order,
      keyId: razorpayKeyId,
      amount: chargeAmount,
      originalAmount: resolved.amount,
      referralDiscount,
      breakdown: resolved.breakdown,
      termNo: resolved.termNo,
      paymentType: resolved.paymentType,
      enrollmentId: resolved.enrollmentId,
      prefill,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

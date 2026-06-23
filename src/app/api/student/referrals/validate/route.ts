import { NextRequest, NextResponse } from "next/server";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { validateReferralCode } from "@/lib/referral/referralService";
import { calculateReferralCheckoutDiscount } from "@/lib/referral/referralCalculations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const code = typeof body?.referralCode === "string" ? body.referralCode : "";
    const courseTotalAmount = Number(body?.courseTotalAmount);
    const payAmount = Number(body?.payAmount);

    const result = await validateReferralCode(code, auth.student.id);
    if (result.valid === false) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    let discountPreview: ReturnType<typeof calculateReferralCheckoutDiscount> | undefined;
    if (
      Number.isFinite(courseTotalAmount) &&
      courseTotalAmount > 0 &&
      Number.isFinite(payAmount) &&
      payAmount > 0
    ) {
      discountPreview = calculateReferralCheckoutDiscount({
        courseTotalAmount,
        payAmount,
        referralPercentage: result.referralPercentage,
      });
    }

    return NextResponse.json({
      valid: true,
      message: "Referral Applied Successfully",
      referralCode: result.referralCode,
      referrerName: result.referrerName,
      referrerId: result.referrerId,
      referralPercentage: result.referralPercentage,
      ...(discountPreview
        ? {
            enrolleeDiscount: discountPreview.enrolleeDiscount,
            finalPayAmount: discountPreview.finalPayAmount,
            totalPool: discountPreview.totalPool,
          }
        : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : "Validation failed" },
      { status: 500 },
    );
  }
}

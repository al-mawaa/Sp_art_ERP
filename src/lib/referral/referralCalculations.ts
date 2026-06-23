/** Each party (referrer + enrollee) receives half of the referral pool. */
export const REFERRAL_SHARE_RATIO = 0.5;

const MIN_PAY_INR = 1;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function getReferralEnrolleeDiscountTotal(
  courseTotalAmount: number,
  referralPercentage: number,
) {
  const totalPool = round2((courseTotalAmount * referralPercentage) / 100);
  const enrolleeDiscountTotal = round2(totalPool * REFERRAL_SHARE_RATIO);
  return {
    totalPool,
    referrerAmount: round2(totalPool * REFERRAL_SHARE_RATIO),
    enrolleeDiscountTotal,
  };
}

export function applyReferralDiscountToPayment(payAmount: number, discountRemaining: number) {
  const maxApplicable = round2(Math.max(0, discountRemaining));
  let enrolleeDiscount = round2(Math.min(Math.max(0, payAmount), maxApplicable));
  let finalPayAmount = round2(Math.max(0, payAmount - enrolleeDiscount));

  if (finalPayAmount > 0 && finalPayAmount < MIN_PAY_INR) {
    finalPayAmount = Math.min(MIN_PAY_INR, payAmount);
    enrolleeDiscount = round2(Math.max(0, payAmount - finalPayAmount));
  }

  return { enrolleeDiscount, finalPayAmount };
}

export function calculateReferralCheckoutDiscount(params: {
  courseTotalAmount: number;
  payAmount: number;
  referralPercentage: number;
  /** Remaining enrollee discount (installment follow-up terms). Defaults to full entitlement. */
  discountRemaining?: number;
}) {
  const { courseTotalAmount, payAmount, referralPercentage, discountRemaining } = params;
  const pool = getReferralEnrolleeDiscountTotal(courseTotalAmount, referralPercentage);
  const remaining =
    discountRemaining != null ? round2(Math.max(0, discountRemaining)) : pool.enrolleeDiscountTotal;
  const applied = applyReferralDiscountToPayment(payAmount, remaining);

  return {
    totalPool: pool.totalPool,
    referrerAmount: pool.referrerAmount,
    maxEnrolleeDiscount: pool.enrolleeDiscountTotal,
    enrolleeDiscount: applied.enrolleeDiscount,
    finalPayAmount: applied.finalPayAmount,
  };
}

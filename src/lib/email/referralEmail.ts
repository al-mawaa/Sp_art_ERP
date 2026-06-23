import { sendTransactionalEmail } from "@/lib/email/mailer";

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendReferralUsedEmail(params: {
  referrerEmail: string;
  referrerName: string;
  referredStudentName: string;
  courseTitle: string;
  earnedAmount: number;
  totalPool?: number;
  referralCode: string;
}) {
  const {
    referrerEmail,
    referrerName,
    referredStudentName,
    courseTitle,
    earnedAmount,
    totalPool,
    referralCode,
  } = params;

  const poolLine =
    totalPool != null && totalPool > earnedAmount
      ? `<tr><td style="padding:10px 0;color:#64748b;">Total Referral Pool</td><td style="padding:10px 0;font-weight:600;color:#0f172a;">${formatInr(totalPool)}</td></tr>
      <tr><td style="padding:10px 0;color:#64748b;">Your Share (50%)</td><td style="padding:10px 0;font-weight:600;color:#059669;">${formatInr(earnedAmount)}</td></tr>`
      : `<tr><td style="padding:10px 0;color:#64748b;">Reward Earned</td><td style="padding:10px 0;font-weight:600;color:#059669;">${formatInr(earnedAmount)}</td></tr>`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f3f4f6;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
    <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Referral Successfully Used</h1>
    <p style="margin:0 0 16px;color:#475569;line-height:1.7;">Hi ${referrerName},</p>
    <p style="margin:0 0 20px;color:#475569;line-height:1.7;">A new student has enrolled using your referral code <strong>${referralCode}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px 0;color:#64748b;">Referred Student</td><td style="padding:10px 0;font-weight:600;color:#0f172a;">${referredStudentName}</td></tr>
      <tr><td style="padding:10px 0;color:#64748b;">Course</td><td style="padding:10px 0;font-weight:600;color:#0f172a;">${courseTitle}</td></tr>
      ${poolLine}
    </table>
    <p style="margin:24px 0 0;color:#475569;">Your 50% share has been credited to your referral wallet.</p>
  </div>
</body>
</html>`;

  await sendTransactionalEmail({
    to: referrerEmail,
    subject: "Referral Successfully Used",
    html,
    text: `Hi ${referrerName}, ${referredStudentName} enrolled in ${courseTitle} using your code ${referralCode}. Your reward: ${formatInr(earnedAmount)}.`,
  });
}

export async function sendEnrolleeReferralDiscountEmail(params: {
  enrolleeEmail: string;
  enrolleeName: string;
  referrerName: string;
  courseTitle: string;
  discountAmount: number;
  totalPool?: number;
  referralCode: string;
}) {
  const {
    enrolleeEmail,
    enrolleeName,
    referrerName,
    courseTitle,
    discountAmount,
    totalPool,
    referralCode,
  } = params;

  const poolLine =
    totalPool != null && totalPool > discountAmount
      ? `<tr><td style="padding:10px 0;color:#64748b;">Total Referral Pool</td><td style="padding:10px 0;font-weight:600;color:#0f172a;">${formatInr(totalPool)}</td></tr>
      <tr><td style="padding:10px 0;color:#64748b;">Your Discount (50%)</td><td style="padding:10px 0;font-weight:600;color:#059669;">${formatInr(discountAmount)}</td></tr>`
      : `<tr><td style="padding:10px 0;color:#64748b;">Enrollment Discount</td><td style="padding:10px 0;font-weight:600;color:#059669;">${formatInr(discountAmount)}</td></tr>`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f3f4f6;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
    <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Enrollment Referral Discount Applied</h1>
    <p style="margin:0 0 16px;color:#475569;line-height:1.7;">Hi ${enrolleeName},</p>
    <p style="margin:0 0 20px;color:#475569;line-height:1.7;">Thank you for enrolling with referral code <strong>${referralCode}</strong> from ${referrerName}.</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px 0;color:#64748b;">Course</td><td style="padding:10px 0;font-weight:600;color:#0f172a;">${courseTitle}</td></tr>
      ${poolLine}
    </table>
    <p style="margin:24px 0 0;color:#475569;">Your 50% share was applied as a discount on your enrollment payment.</p>
  </div>
</body>
</html>`;

  await sendTransactionalEmail({
    to: enrolleeEmail,
    subject: "Enrollment Referral Discount Applied",
    html,
    text: `Hi ${enrolleeName}, you received ${formatInr(discountAmount)} enrollment discount for ${courseTitle} using code ${referralCode}.`,
  });
}

/** @deprecated Use sendEnrolleeReferralDiscountEmail — enrollee benefit is checkout discount, not wallet. */
export async function sendEnrolleeReferralBonusEmail(params: {
  enrolleeEmail: string;
  enrolleeName: string;
  referrerName: string;
  courseTitle: string;
  earnedAmount: number;
  totalPool?: number;
  referralCode: string;
}) {
  return sendEnrolleeReferralDiscountEmail({
    enrolleeEmail: params.enrolleeEmail,
    enrolleeName: params.enrolleeName,
    referrerName: params.referrerName,
    courseTitle: params.courseTitle,
    discountAmount: params.earnedAmount,
    totalPool: params.totalPool,
    referralCode: params.referralCode,
  });
}

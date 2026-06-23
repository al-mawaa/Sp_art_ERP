import { sendTransactionalEmail } from "@/lib/email/mailer";

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function baseHtml(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f3f4f6;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
    <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">${title}</h1>
    ${body}
  </div>
</body>
</html>`;
}

export async function sendRewardUnlockedEmail(params: {
  studentEmail: string;
  studentName: string;
  rewardTitle: string;
  requiredReferrals: number;
  successfulReferrals: number;
}) {
  const { studentEmail, studentName, rewardTitle, requiredReferrals, successfulReferrals } = params;
  const html = baseHtml(
    "New Reward Unlocked!",
    `<p style="color:#475569;line-height:1.7;">Hi ${studentName},</p>
    <p style="color:#475569;line-height:1.7;">Congratulations! You reached <strong>${successfulReferrals}</strong> successful referrals and unlocked:</p>
    <p style="font-size:18px;font-weight:700;color:#059669;margin:16px 0;">${rewardTitle}</p>
    <p style="color:#475569;">Required referrals: ${requiredReferrals}. Visit <strong>My Rewards</strong> in SP Art Hub to claim your gift.</p>`,
  );
  await sendTransactionalEmail({
    to: studentEmail,
    subject: `Reward Unlocked: ${rewardTitle}`,
    html,
    text: `Hi ${studentName}, you unlocked ${rewardTitle} with ${successfulReferrals} referrals. Claim it in SP Art Hub.`,
  });
}

export async function sendRewardClaimedEmail(params: {
  studentEmail: string;
  studentName: string;
  rewardTitle: string;
}) {
  const html = baseHtml(
    "Reward Claim Submitted",
    `<p style="color:#475569;line-height:1.7;">Hi ${params.studentName},</p>
    <p style="color:#475569;line-height:1.7;">Your claim for <strong>${params.rewardTitle}</strong> has been submitted. Our team will review it shortly.</p>`,
  );
  await sendTransactionalEmail({
    to: params.studentEmail,
    subject: `Reward Claim Submitted — ${params.rewardTitle}`,
    html,
    text: `Your claim for ${params.rewardTitle} was submitted successfully.`,
  });
}

export async function sendRewardApprovedEmail(params: {
  studentEmail: string;
  studentName: string;
  rewardTitle: string;
  walletAmount?: number;
}) {
  const walletLine =
    params.walletAmount && params.walletAmount > 0
      ? `<p style="color:#059669;font-weight:600;">${formatInr(params.walletAmount)} has been credited to your referral wallet.</p>`
      : "";
  const html = baseHtml(
    "Reward Approved",
    `<p style="color:#475569;line-height:1.7;">Hi ${params.studentName},</p>
    <p style="color:#475569;line-height:1.7;">Your claim for <strong>${params.rewardTitle}</strong> has been approved.</p>
    ${walletLine}
    <p style="color:#475569;">We will notify you when it is shipped or delivered.</p>`,
  );
  await sendTransactionalEmail({
    to: params.studentEmail,
    subject: `Reward Approved — ${params.rewardTitle}`,
    html,
    text: `Your reward ${params.rewardTitle} was approved.${params.walletAmount ? ` ${formatInr(params.walletAmount)} credited to wallet.` : ""}`,
  });
}

export async function sendRewardRejectedEmail(params: {
  studentEmail: string;
  studentName: string;
  rewardTitle: string;
  adminRemark?: string;
}) {
  const html = baseHtml(
    "Reward Claim Update",
    `<p style="color:#475569;line-height:1.7;">Hi ${params.studentName},</p>
    <p style="color:#475569;line-height:1.7;">Your claim for <strong>${params.rewardTitle}</strong> could not be approved at this time.</p>
    ${params.adminRemark ? `<p style="color:#64748b;">Reason: ${params.adminRemark}</p>` : ""}
    <p style="color:#475569;">Please contact support if you have questions.</p>`,
  );
  await sendTransactionalEmail({
    to: params.studentEmail,
    subject: `Reward Claim Update — ${params.rewardTitle}`,
    html,
    text: `Your claim for ${params.rewardTitle} was not approved.${params.adminRemark ? ` Reason: ${params.adminRemark}` : ""}`,
  });
}

export async function sendRewardShippedEmail(params: {
  studentEmail: string;
  studentName: string;
  rewardTitle: string;
}) {
  const html = baseHtml(
    "Reward Shipped",
    `<p style="color:#475569;line-height:1.7;">Hi ${params.studentName},</p>
    <p style="color:#475569;line-height:1.7;">Great news! Your reward <strong>${params.rewardTitle}</strong> has been shipped and is on its way.</p>`,
  );
  await sendTransactionalEmail({
    to: params.studentEmail,
    subject: `Reward Shipped — ${params.rewardTitle}`,
    html,
    text: `Your reward ${params.rewardTitle} has been shipped.`,
  });
}

export async function sendRewardDeliveredEmail(params: {
  studentEmail: string;
  studentName: string;
  rewardTitle: string;
}) {
  const html = baseHtml(
    "Reward Delivered",
    `<p style="color:#475569;line-height:1.7;">Hi ${params.studentName},</p>
    <p style="color:#475569;line-height:1.7;">Your reward <strong>${params.rewardTitle}</strong> has been marked as delivered. Enjoy!</p>`,
  );
  await sendTransactionalEmail({
    to: params.studentEmail,
    subject: `Reward Delivered — ${params.rewardTitle}`,
    html,
    text: `Your reward ${params.rewardTitle} was delivered.`,
  });
}

export async function sendAdminRewardClaimNotification(params: {
  adminEmail: string;
  studentName: string;
  rewardTitle: string;
}) {
  const html = baseHtml(
    "New Reward Claim",
    `<p style="color:#475569;line-height:1.7;">${params.studentName} submitted a claim for <strong>${params.rewardTitle}</strong>.</p>
    <p style="color:#475569;">Review it in Admin → Referral Rewards.</p>`,
  );
  await sendTransactionalEmail({
    to: params.adminEmail,
    subject: `New Reward Claim — ${params.rewardTitle}`,
    html,
    text: `${params.studentName} claimed ${params.rewardTitle}. Review in admin panel.`,
  });
}

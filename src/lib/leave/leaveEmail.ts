import { sendTransactionalEmail } from "@/lib/email/mailer";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type LeaveEmailFields = {
  teacherName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  adminRemark?: string;
};

function leaveDetailsHtml(f: LeaveEmailFields) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;margin:16px 0;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Teacher</strong><br/>${escapeHtml(f.teacherName)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Leave type</strong><br/>${escapeHtml(f.leaveType)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>From</strong><br/>${escapeHtml(f.fromDate)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>To</strong><br/>${escapeHtml(f.toDate)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Reason</strong><br/>${escapeHtml(f.reason || "—")}</td></tr>
      <tr><td style="padding:12px 16px;"><strong>Status</strong><br/>${escapeHtml(f.status)}</td></tr>
      ${f.adminRemark ? `<tr><td style="padding:12px 16px;border-top:1px solid #e2e8f0;"><strong>Admin remarks</strong><br/>${escapeHtml(f.adminRemark)}</td></tr>` : ""}
    </table>
  `;
}

function wrapEmail(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:Segoe UI,sans-serif;background:#f4f6fb;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">
      <h2 style="color:#ea580c;margin:0 0 16px;">${escapeHtml(title)}</h2>
      ${body}
      <p style="color:#64748b;font-size:13px;margin-top:24px;">Little Brushes Art Academy ERP</p>
    </div>
  </body></html>`;
}

export async function sendNewLeaveRequestEmails(
  fields: LeaveEmailFields,
  recipients: string[],
): Promise<string[]> {
  const warnings: string[] = [];
  const unique = [...new Set(recipients.map(e => e.trim().toLowerCase()).filter(Boolean))];
  const html = wrapEmail(
    "New Leave Request Submitted",
    `<p>A teacher has submitted a new leave request.</p>${leaveDetailsHtml({ ...fields, status: "Pending" })}`,
  );
  const text = `New leave request from ${fields.teacherName}. Type: ${fields.leaveType}. ${fields.fromDate} to ${fields.toDate}. Reason: ${fields.reason}. Status: Pending`;

  for (const to of unique) {
    try {
      await sendTransactionalEmail({ to, subject: "New Leave Request Submitted", html, text });
    } catch (e) {
      console.error("[leave email]", to, e);
      warnings.push(to);
    }
  }
  return warnings;
}

export async function sendLeaveStatusEmailToTeacher(
  to: string,
  fields: LeaveEmailFields,
  approved: boolean,
): Promise<void> {
  const subject = approved
    ? "Your Leave Request Has Been Approved"
    : "Your Leave Request Has Been Rejected";
  const html = wrapEmail(
    subject,
    `<p>Hello ${escapeHtml(fields.teacherName)},</p>
     <p>Your leave request has been <strong>${approved ? "approved" : "rejected"}</strong>.</p>
     ${leaveDetailsHtml(fields)}`,
  );
  const text = `${subject}. ${fields.leaveType} ${fields.fromDate} to ${fields.toDate}. Status: ${fields.status}. Remarks: ${fields.adminRemark || "—"}`;

  await sendTransactionalEmail({ to, subject, html, text });
}

export function getAdminNotifyEmails(): string[] {
  const admin =
    process.env.ADMIN_NOTIFY_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.EMAIL_USER ||
    "";
  return admin ? [admin.trim().toLowerCase()] : [];
}

type SeniorLeaveEmailFields = {
  seniorTeacherName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  adminRemark?: string;
};

function seniorLeaveDetailsHtml(f: SeniorLeaveEmailFields) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;margin:16px 0;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Senior Teacher</strong><br/>${escapeHtml(f.seniorTeacherName)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Leave type</strong><br/>${escapeHtml(f.leaveType)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>From</strong><br/>${escapeHtml(f.fromDate)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>To</strong><br/>${escapeHtml(f.toDate)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Reason</strong><br/>${escapeHtml(f.reason || "—")}</td></tr>
      <tr><td style="padding:12px 16px;"><strong>Status</strong><br/>${escapeHtml(f.status)}</td></tr>
      ${f.adminRemark ? `<tr><td style="padding:12px 16px;border-top:1px solid #e2e8f0;"><strong>Admin remarks</strong><br/>${escapeHtml(f.adminRemark)}</td></tr>` : ""}
    </table>
  `;
}

/** Notify admin when a senior teacher submits leave */
export async function sendSeniorTeacherNewLeaveEmails(
  fields: SeniorLeaveEmailFields,
  recipients: string[],
): Promise<string[]> {
  const warnings: string[] = [];
  const unique = [...new Set(recipients.map(e => e.trim().toLowerCase()).filter(Boolean))];
  const html = wrapEmail(
    "Senior Teacher Leave Request Submitted",
    `<p>A senior teacher has submitted a new leave request.</p>${seniorLeaveDetailsHtml({ ...fields, status: "Pending" })}`,
  );
  const text = `Senior teacher leave from ${fields.seniorTeacherName}. Type: ${fields.leaveType}. ${fields.fromDate} to ${fields.toDate}. Reason: ${fields.reason}. Status: Pending`;

  for (const to of unique) {
    try {
      await sendTransactionalEmail({
        to,
        subject: "Senior Teacher Leave Request Submitted",
        html,
        text,
      });
    } catch (e) {
      console.error("[senior leave email]", to, e);
      warnings.push(to);
    }
  }
  return warnings;
}

/** Notify senior teacher after admin approve/reject */
export async function sendSeniorLeaveStatusEmail(
  to: string,
  fields: SeniorLeaveEmailFields,
  approved: boolean,
): Promise<void> {
  const subject = approved
    ? "Your Leave Request Has Been Approved"
    : "Your Leave Request Has Been Rejected";
  const html = wrapEmail(
    subject,
    `<p>Hello ${escapeHtml(fields.seniorTeacherName)},</p>
     <p>Your leave request has been <strong>${approved ? "approved" : "rejected"}</strong>.</p>
     ${seniorLeaveDetailsHtml(fields)}`,
  );
  const text = `${subject}. ${fields.leaveType} ${fields.fromDate} to ${fields.toDate}. Status: ${fields.status}. Remarks: ${fields.adminRemark || "—"}`;

  await sendTransactionalEmail({ to, subject, html, text });
}

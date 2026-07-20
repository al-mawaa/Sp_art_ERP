import { sendTransactionalEmail } from "@/lib/email/mailer";
import { getAdminNotifyEmails } from "@/lib/leave/leaveEmail";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type QueryEmailFields = {
  personName: string;
  personEmail: string;
  category: string;
  remarks: string;
  status: string;
  adminRemark?: string;
};

export function queryDetailsHtml(fields: QueryEmailFields) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;margin:16px 0;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Name</strong><br/>${escapeHtml(fields.personName)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Email</strong><br/>${escapeHtml(fields.personEmail)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Category</strong><br/>${escapeHtml(fields.category)}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong>Remarks</strong><br/>${escapeHtml(fields.remarks)}</td></tr>
      <tr><td style="padding:12px 16px;"><strong>Status</strong><br/>${escapeHtml(fields.status)}</td></tr>
      ${fields.adminRemark ? `<tr><td style="padding:12px 16px;border-top:1px solid #e2e8f0;"><strong>Admin remark</strong><br/>${escapeHtml(fields.adminRemark)}</td></tr>` : ""}
    </table>
  `;
}

export function wrapQueryEmail(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:Segoe UI,sans-serif;background:#f4f6fb;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">
      <h2 style="color:#ea580c;margin:0 0 16px;">${escapeHtml(title)}</h2>
      ${body}
      <p style="color:#64748b;font-size:13px;margin-top:24px;">Sp Art Hub</p>
    </div>
  </body></html>`;
}

export async function sendNewQueryAdminEmails(params: {
  roleLabel: string;
  subjectPrefix: string;
  fields: Omit<QueryEmailFields, "status" | "adminRemark">;
}): Promise<string[]> {
  const warnings: string[] = [];
  const recipients = getAdminNotifyEmails();
  if (!recipients.length) {
    warnings.push("No admin notify email configured");
    return warnings;
  }

  const html = wrapQueryEmail(
    `New ${params.roleLabel} Query`,
    `<p>A new ${params.roleLabel.toLowerCase()} query has been submitted.</p>${queryDetailsHtml({
      ...params.fields,
      status: "Pending",
    })}`,
  );
  const text = `New ${params.roleLabel} query from ${params.fields.personName}. Category: ${params.fields.category}. Remarks: ${params.fields.remarks}`;

  for (const to of recipients) {
    try {
      await sendTransactionalEmail({
        to,
        subject: `${params.subjectPrefix} — ${params.fields.category}`,
        html,
        text,
      });
    } catch (e) {
      console.error("[query email admin]", to, e);
      warnings.push(to);
    }
  }
  return warnings;
}

export async function sendQueryStatusEmail(
  to: string,
  params: {
    personName: string;
    title: string;
    fields: QueryEmailFields;
    approved: boolean;
  },
): Promise<void> {
  const subject = params.approved ? "Your Query Has Been Approved" : "Your Query Has Been Rejected";
  const html = wrapQueryEmail(
    subject,
    `<p>Hello ${escapeHtml(params.personName)},</p>
     <p>Your query has been <strong>${params.approved ? "approved" : "rejected"}</strong>.</p>
     ${queryDetailsHtml(params.fields)}`,
  );
  const text = `${subject}. Category: ${params.fields.category}. Remarks: ${params.fields.remarks}. Status: ${params.fields.status}. Admin remark: ${params.fields.adminRemark || "—"}`;

  await sendTransactionalEmail({ to, subject, html, text });
}

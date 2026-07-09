import { sendTransactionalEmail } from "./mailer";

export async function sendFeedbackNotificationToAdmin(params: {
  adminEmail: string;
  studentName: string;
  teacherName: string;
  course: string;
  category: string;
  rating: number;
  message: string;
}) {
  const { adminEmail, studentName, teacherName, course, category, rating, message } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New Student Feedback</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;color:#fff;">
              <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Student Feedback</div>
              <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;">New Feedback Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#0f172a;line-height:1.6;">
                A new feedback has been submitted by <strong>${escapeHtml(studentName)}</strong>.
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Teacher</span><br/><strong style="color:#0f172a;font-size:15px;">${escapeHtml(teacherName)}</strong></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Course</span><br/><strong style="color:#0f172a;font-size:15px;">${escapeHtml(course)}</strong></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Category</span><br/><strong style="color:#0f172a;font-size:15px;">${escapeHtml(category)}</strong></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Overall Rating</span><br/><strong style="color:#0f172a;font-size:15px;">${rating} / 5</strong></td></tr>
                <tr><td style="padding:14px 18px;"><span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Message</span><br/><span style="color:#0f172a;font-size:14px;line-height:1.5;">${escapeHtml(message)}</span></td></tr>
              </table>
              <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">
                Log in to the admin portal to review this feedback in detail.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendTransactionalEmail({
    to: adminEmail,
    subject: `New Student Feedback: ${teacherName} - ${course}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

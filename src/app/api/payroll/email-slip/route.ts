import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PayrollEntry from "@/lib/models/PayrollEntry";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { apiError, apiSuccess } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { entryId } = await request.json();
    if (!entryId) {
      return apiError("Entry ID is required", 400);
    }

    await dbConnect();

    // 1. Fetch Payroll Entry
    const entry = await PayrollEntry.findById(entryId).lean();
    if (!entry) {
      return apiError("Payroll entry not found", 404);
    }

    // 2. Fetch Recipient Email
    let recipientEmail = "";
    if (entry.staffType === "teacher") {
      const teacher = await Teacher.findById(entry.staffId).select("email").lean();
      recipientEmail = teacher?.email || "";
    } else {
      const senior = await SeniorTeacher.findById(entry.staffId).select("email").lean();
      recipientEmail = senior?.email || "";
    }

    if (!recipientEmail) {
      return apiError("Recipient email address not found in system", 400);
    }

    // Money formatter
    const money = (val: number) =>
      `INR ${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const slipNumber = `SLIP-${entry.month.replace("-", "")}-${entry.employeeId}`;

    // 3. Compose Payslip HTML Email Template (matching Zoho Payroll professional style)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Payslip for ${entry.month}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff; text-align: left;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Sp Arts</h1>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">ERP Payroll System</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">Hi <strong>${entry.staffName}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                Your salary slip for the month of <strong>${entry.month}</strong> has been generated and approved. Please find the details below:
              </p>

              <!-- Employee & Slip Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;" width="40%">Employee ID</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right;">${entry.employeeId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Designation</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right;">${entry.staffType === "teacher" ? "Teacher" : "Senior Teacher"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Slip Number</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; font-family: monospace;">${slipNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Payroll Status</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; color: #10b981;">${entry.payrollStatus}</td>
                </tr>
              </table>

              <!-- Attendance & Batches -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; font-size: 13px;">
                <tr>
                  <td style="width: 48%; vertical-align: top; padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
                    <div style="font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Attendance</div>
                    <div style="margin-bottom: 4px;">Present: <strong>${entry.presentCount} days</strong></div>
                    <div style="margin-bottom: 4px;">Half Days: <strong>${entry.halfDayCount}</strong></div>
                    <div>Approved Leaves: <strong>${entry.leaveCount}</strong></div>
                  </td>
                  <td style="width: 4%"></td>
                  <td style="width: 48%; vertical-align: top; padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
                    <div style="font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Batches</div>
                    <div style="margin-bottom: 4px;">Total Conducted: <strong>${entry.totalBatches}</strong></div>
                    <div>Rate Per Batch: <strong>${money(entry.salaryPerBatch)}</strong></div>
                  </td>
                </tr>
              </table>

              <!-- Salary Breakdown -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; font-size: 13px; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 10px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569;">Description</th>
                  <th style="padding: 10px 16px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569;">Amount</th>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9;">Monthly Salary (Earnings)</td>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${money(entry.monthlySalary)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #ef4444;">Leave Deductions (LWP)</td>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #ef4444;">-${money(entry.deductionAmount)}</td>
                </tr>
                <tr style="background-color: #f0fdf4; font-size: 14px;">
                  <td style="padding: 12px 16px; font-weight: bold; color: #166534;">Net Salary (Take Home)</td>
                  <td style="padding: 12px 16px; text-align: right; font-weight: 850; color: #166534;">${money(entry.netSalary)}</td>
                </tr>
              </table>

              ${
                entry.remarks
                  ? `<p style="font-size: 12px; color: #dc2626; margin: 0 0 20px; font-style: italic;"><strong>Note:</strong> ${entry.remarks}</p>`
                  : ""
              }

              <!-- System note -->
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
                This is a computer-generated transactional email. If you have any queries regarding this payroll entry, please contact the Accounts Department.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 16px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
              Sp Arts Art Academy • Plot 12, Art District, New Delhi • Tel: +91 98765 43210
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 4. Send Email via Mailer Service
    await sendTransactionalEmail({
      to: recipientEmail,
      subject: `Payslip Issued - ${entry.month} (${entry.staffName})`,
      html: emailHtml,
    });

    return apiSuccess(null, { message: `Payslip emailed successfully to ${recipientEmail}` });
  } catch (error) {
    console.error("[payroll/email-slip POST]", error);
    return apiError("Failed to email salary slip. Please check SMTP configuration.", 500);
  }
}

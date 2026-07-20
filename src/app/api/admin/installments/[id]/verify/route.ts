import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Course from '@/lib/models/Course';
import CourseEnrollment from '@/lib/models/CourseEnrollment';
import EnrollmentInstallment from '@/lib/models/EnrollmentInstallment';
import { requireAdminFromRequest } from '@/lib/auth/require-admin';
import { sendTransactionalEmail } from '@/lib/email/mailer';

export const runtime = 'nodejs';

function buildInstallmentPaidEmailHtml(params: {
  studentName: string;
  courseName: string;
  termNo: number;
  amount: number;
  paidDate: string;
  remainingAmount: number;
  academyName: string;
  supportEmail: string;
  supportPhone: string;
}) {
  const { studentName, courseName, termNo, amount, paidDate, remainingAmount, academyName, supportEmail, supportPhone } = params;
  return `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body style="font-family:sans-serif;margin:0;padding:0;background:#f4f6fb;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 56px rgba(0,0,0,0.08);">
            <tr><td style="background:#10b981;color:#ffffff;padding:28px 32px;"><h1 style="margin:0;font-size:24px;">Installment Payment Received</h1></td></tr>
            <tr>
              <td style="padding:32px;">
                <p>Hi ${studentName},</p>
                <p>We have successfully received your installment payment for <strong>${courseName}</strong>.</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;margin-bottom:20px;">
                  <tr><td style="padding:16px;"><strong>Term</strong></td><td style="padding:16px;">Term ${termNo}</td></tr>
                  <tr><td style="padding:16px;"><strong>Amount Paid</strong></td><td style="padding:16px;">₹${amount.toFixed(2)}</td></tr>
                  <tr><td style="padding:16px;"><strong>Paid On</strong></td><td style="padding:16px;">${paidDate}</td></tr>
                </table>
                <p><strong>Remaining Balance:</strong> ₹${remainingAmount.toFixed(2)}</p>
                ${remainingAmount <= 0 ? '<p style="color:#10b981;font-weight:bold;">Your course is now fully paid. Thank you!</p>' : ''}
                <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
                <p style="font-size:14px;color:#6b7280;">Need help? Email: ${supportEmail} | Phone: ${supportPhone}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    
    const params = await context.params;
    const installmentId = params.id;

    if (!mongoose.Types.ObjectId.isValid(installmentId)) {
      return NextResponse.json({ success: false, error: 'Invalid installment ID' }, { status: 400 });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let enrollment;
    let installment;
    try {
      installment = await EnrollmentInstallment.findById(installmentId).session(session);
      if (!installment) {
        throw new Error('Installment not found');
      }

      if (installment.paymentStatus === 'paid') {
        throw new Error('Installment is already marked as paid');
      }

      enrollment = await CourseEnrollment.findById(installment.enrollmentId).session(session);
      if (!enrollment) {
        throw new Error('Course enrollment not found');
      }

      installment.paymentStatus = 'paid';
      installment.paidDate = new Date();
      await installment.save({ session });

      enrollment.paidAmount = (enrollment.paidAmount || 0) + installment.amount;
      enrollment.remainingAmount = Math.max(0, (enrollment.remainingAmount || 0) - installment.amount);
      
      if (enrollment.remainingAmount <= 0) {
        enrollment.paymentPlanStatus = 'paid';
      }

      await enrollment.save({ session });
      await session.commitTransaction();
    } catch (err: unknown) {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Failed to verify installment' }, { status: 500 });
    } finally {
      session.endSession();
    }

    // Send email
    try {
      const student = await Student.findById(enrollment.studentId);
      const course = await Course.findById(enrollment.courseId);

      if (student && student.email && course) {
        const academyName = process.env.ACADEMY_NAME || 'SP Art Hub';
        const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_FROM || 'spinstituteofart@gmail.com';
        const supportPhone = process.env.SUPPORT_PHONE || '+91 9819703242';

        await sendTransactionalEmail({
          to: student.email,
          subject: `Installment Payment Received — ${academyName}`,
          html: buildInstallmentPaidEmailHtml({
            studentName: student.fullName || 'Student',
            courseName: course.courseTitle || course.courseCode || 'Course',
            termNo: installment.termNo,
            amount: installment.amount,
            paidDate: new Date().toISOString().split('T')[0],
            remainingAmount: enrollment.remainingAmount,
            academyName,
            supportEmail,
            supportPhone
          })
        });
      }
    } catch (emailErr) {
      console.error("Failed to send installment paid email", emailErr);
    }

    return NextResponse.json({ success: true, message: 'Installment verified successfully' });
  } catch (error: unknown) {
    console.error('Error verifying installment:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

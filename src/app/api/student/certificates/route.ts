import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CertificateModel from '@/lib/models/Certificate';
import CourseEnrollmentModel from '@/lib/models/CourseEnrollment';
import { requireStudentFromRequest } from '@/lib/auth/require-student';
import Student from '@/lib/models/Student';
import Course from '@/lib/models/Course';

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(req);
    if (!auth.ok) return auth.response;

    const studentId = auth.student.id;
    await dbConnect();

    const certificates = await CertificateModel.find({ studentId })
      .populate('courseId')
      .sort({ createdAt: -1 });

    // Import this at the top (conceptually) or directly here.
    const { generatePendingCertificate } = await import('@/lib/services/certificateService');

    // For the dashboard, we also need to check eligibility for courses that don't have a certificate yet
    const enrollments = await CourseEnrollmentModel.find({ studentId }).populate('courseId');

    const eligibilityStatuses = await Promise.all(enrollments.map(async enrollment => {
      const existingCert = certificates.find(c => c.enrollmentId.toString() === enrollment._id.toString());
      if (existingCert) {
        return {
          enrollmentId: enrollment._id,
          course: enrollment.courseId,
          status: existingCert.status,
          certificate: existingCert,
        };
      } else {
        const isEligible = enrollment.remainingAmount === 0;

        if (isEligible) {
          try {
            // Automatically generate the pending certificate so the admin can review it
            const newCert = await generatePendingCertificate(studentId, enrollment.courseId._id.toString());
            return {
              enrollmentId: enrollment._id,
              course: enrollment.courseId,
              status: 'pending_approval',
              certificate: newCert,
            };
          } catch (e) {
            console.error('Auto-generation failed', e);
          }
        }

        return {
          enrollmentId: enrollment._id,
          course: enrollment.courseId,
          status: 'not_eligible',
          progress: {
            courseCompleted: enrollment.completionPercentage === 100,
            feePaid: enrollment.remainingAmount === 0,
            coursePercentage: enrollment.completionPercentage,
            paidAmount: enrollment.paidAmount,
            totalAmount: enrollment.totalAmount
          }
        };
      }
    }));

    return NextResponse.json({ 
      success: true, 
      data: {
        certificates: certificates.filter(c => c.status === 'approved'),
        eligibility: eligibilityStatuses,
      }
    });
  } catch (error: any) {
    console.error('Error fetching student certificates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

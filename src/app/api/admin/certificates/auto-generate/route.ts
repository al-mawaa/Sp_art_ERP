import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CourseEnrollmentModel from '@/lib/models/CourseEnrollment';
import { generatePendingCertificate } from '@/lib/services/certificateService';

export async function POST() {
  try {
    await dbConnect();
    
    // Find all enrollments with 0 remaining amount
    const eligibleEnrollments = await CourseEnrollmentModel.find({
      remainingAmount: 0,
    });

    const results = [];
    const errors = [];

    for (const enrollment of eligibleEnrollments) {
      try {
        const cert = await generatePendingCertificate(
          enrollment.studentId.toString(),
          enrollment.courseId.toString()
        );
        results.push(cert);
      } catch (e: any) {
        // Ignored if already exists or not eligible
        if (e.message !== 'Student is not eligible for a certificate yet') {
          errors.push({ enrollmentId: enrollment._id, error: e.message });
        }
      }
    }

    return NextResponse.json({ success: true, generated: results.length, errors });
  } catch (error: any) {
    console.error('Error in auto-generate certificates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

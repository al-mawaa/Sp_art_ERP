import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CertificateModel from '@/lib/models/Certificate';
import CourseEnrollmentModel from '@/lib/models/CourseEnrollment';
import Student from '@/lib/models/Student';
import Course from '@/lib/models/Course';
import { approveCertificate } from '@/lib/services/certificateService';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      studentId,
      courseId,
      customStudentName,
      customCourseTitle,
      fromDate,
      toDate,
      grade,
      conductedAt,
      issueDate,
    } = body;

    if (!studentId || !courseId) {
      return NextResponse.json({ success: false, error: 'Student and Course are required' }, { status: 400 });
    }

    // Find or create enrollment to maintain DB integrity
    let enrollment = await CourseEnrollmentModel.findOne({ studentId, courseId });
    if (!enrollment) {
      enrollment = new CourseEnrollmentModel({
        studentId,
        courseId,
        remainingAmount: 0,
        paidAmount: 0,
        status: 'active',
      });
      await enrollment.save();
    }

    // Check if certificate already exists for this enrollment
    let certificate = await CertificateModel.findOne({ enrollmentId: enrollment._id });
    if (!certificate) {
      // Generate certificate number
      const year = new Date().getFullYear();
      let serial = await CertificateModel.countDocuments() + 1;
      let certificateNumber = `SPA-${year}-${String(serial).padStart(6, '0')}`;
      while (await CertificateModel.findOne({ certificateNumber })) {
        serial++;
        certificateNumber = `SPA-${year}-${String(serial).padStart(6, '0')}`;
      }

      certificate = new CertificateModel({
        studentId,
        courseId,
        enrollmentId: enrollment._id,
        certificateNumber,
        status: 'pending_approval',
      });
      await certificate.save();
    } else if (certificate.status === 'approved') {
      return NextResponse.json({ success: false, error: 'Approved certificate already exists for this student and course' }, { status: 400 });
    }

    // Approve & generate PDF
    const result = await approveCertificate(certificate._id.toString(), {
      customStudentName,
      customCourseTitle,
      fromDate,
      toDate,
      grade,
      conductedAt,
      issueDate,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating custom certificate:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

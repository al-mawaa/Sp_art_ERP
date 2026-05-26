import { NextRequest, NextResponse } from 'next/server';
import type { CourseDocument } from '@/lib/models/Course';
import type { CourseEnrollmentDocument } from '@/lib/models/CourseEnrollment';
import type { StudentDocument } from '@/lib/models/Student';
import dbConnect from '@/lib/mongodb';
import CourseEnrollment from '@/lib/models/CourseEnrollment';
import Student from '@/lib/models/Student';
import Course from '@/lib/models/Course';
import { requireAdminFromRequest } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

type PopulatedEnrollment = CourseEnrollmentDocument & {
  studentId: StudentDocument;
  courseId: CourseDocument;
};

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    console.log('[enrollments] admin authenticated, connecting to DB');
    await dbConnect();
    console.log('[enrollments] db connected');

    // Get all enrollments with populated student and course details
    console.log('[enrollments] querying enrollments');
    const enrollments = await CourseEnrollment.find()
      .populate('studentId')
      .populate('courseId')
      .sort({ enrollmentDate: -1 });
    console.log(`[enrollments] found ${enrollments.length} records`);

    const populatedEnrollments = enrollments as unknown as PopulatedEnrollment[];

    const formattedEnrollments = populatedEnrollments.reduce((result, enrollment) => {
      const student = enrollment.studentId as StudentDocument | null;
      const course = enrollment.courseId as CourseDocument | null;

      if (!student || !course || !student.fullName || !course.courseTitle) {
        console.warn("Skipping invalid enrollment record:", enrollment._id?.toString());
        return result;
      }

      const studentId = student._id?.toString() ?? enrollment.studentId.toString();
      const courseId = course._id?.toString() ?? enrollment.courseId.toString();

      result.push({
        enrollmentId: enrollment._id.toString(),
        studentId,
        studentName: student.fullName,
        studentEmail: student.email ?? "",
        courseId,
        courseTitle: course.courseTitle,
        courseCode: course.courseCode,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status,
        completionPercentage: enrollment.completionPercentage,
        amount: enrollment.amount,
        paymentStatus: enrollment.paymentStatus,
      });
      return result;
    }, [] as Array<{
      enrollmentId: string;
      studentId: string;
      studentName: string;
      studentEmail: string;
      courseId: string;
      courseTitle: string;
      courseCode: string;
      enrollmentDate: Date;
      status: string;
      completionPercentage: number;
      amount?: number;
      paymentStatus?: string;
    }>);

    return NextResponse.json(
      { enrollments: formattedEnrollments },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

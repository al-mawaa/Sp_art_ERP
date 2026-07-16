import { NextRequest, NextResponse } from 'next/server';
import type { CourseDocument } from '@/lib/models/Course';
import type { CourseEnrollmentDocument } from '@/lib/models/CourseEnrollment';
import dbConnect from '@/lib/mongodb';
import CourseEnrollment from '@/lib/models/CourseEnrollment';
import Course from '@/lib/models/Course';
import Student from '@/lib/models/Student';
import { requireStudentFromRequest } from '@/lib/auth/require-student';

export const runtime = 'nodejs';

type PopulatedCourseEnrollment = CourseEnrollmentDocument & {
  courseId: CourseDocument;
};

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const student = await Student.findById(auth.student.id);
    if (!student) {
      return NextResponse.json(
        { error: 'Student record not found' },
        { status: 404 }
      );
    }

    // Get all enrollments for the student
    const enrollments = await CourseEnrollment.find({ studentId: student._id })
      .populate('courseId')
      .sort({ enrollmentDate: -1 });
    const populatedEnrollments = enrollments as unknown as PopulatedCourseEnrollment[];

    const enrolledCourses = populatedEnrollments
      .filter((enrollment) => enrollment.courseId != null)
      .map((enrollment) => {
        const course = enrollment.courseId;
        return {
          enrollmentId: enrollment._id.toString(),
          courseId: course._id.toString(),
          courseTitle: course.courseTitle,
          courseCode: course.courseCode,
          image: course.image,
          instructor: course.instructor,
          duration: course.duration,
          startDate: course.startDate?.toISOString() ?? '',
          endDate: course.endDate?.toISOString() ?? '',
          totalFees: course.totalFees,
          discountFees: course.discountFees,
          discountPercentage: course.discountPercentage,
          status: course.status,
          enrollmentStatus: enrollment.status,
          enrollmentDate: enrollment.enrollmentDate,
          completionPercentage: enrollment.completionPercentage,
          notes: course.notes,
          rulesAndRegulations: course.rulesAndRegulations,
          materialsRequired: course.materialsRequired,
        };
      });

    return NextResponse.json(
      { enrolledCourses },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrolled courses' },
      { status: 500 }
    );
  }
}

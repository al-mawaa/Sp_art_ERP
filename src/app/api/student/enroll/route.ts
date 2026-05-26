import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CourseEnrollment from '@/lib/models/CourseEnrollment';
import Course from '@/lib/models/Course';
import Student from '@/lib/models/Student';
import { requireStudentFromRequest } from '@/lib/auth/require-student';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const student = await Student.findById(auth.student.id);
    if (!student) {
      return NextResponse.json(
        { error: 'Student record not found' },
        { status: 404 }
      );
    }

    // Check if course exists and is active
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.status !== 'active') {
      return NextResponse.json(
        { error: 'Course is not currently active' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      studentId: student._id,
      courseId: courseId,
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = new CourseEnrollment({
      studentId: student._id,
      courseId: courseId,
      enrollmentDate: new Date(),
      status: 'active',
      completionPercentage: 0,
    });

    await enrollment.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully enrolled in course',
        enrollment: {
          id: enrollment._id.toString(),
          studentId: student._id.toString(),
          courseId: courseId,
          enrollmentDate: enrollment.enrollmentDate,
          status: enrollment.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if student is enrolled in a course
export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const student = await Student.findById(auth.student.id);
    if (!student) {
      return NextResponse.json(
        { error: 'Student record not found' },
        { status: 404 }
      );
    }

    const enrollment = await CourseEnrollment.findOne({
      studentId: student._id,
      courseId: courseId,
    });

    return NextResponse.json(
      {
        enrolled: !!enrollment,
        enrollment: enrollment ? {
          id: enrollment._id.toString(),
          status: enrollment.status,
          enrollmentDate: enrollment.enrollmentDate,
          completionPercentage: enrollment.completionPercentage,
        } : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to check enrollment' },
      { status: 500 }
    );
  }
}

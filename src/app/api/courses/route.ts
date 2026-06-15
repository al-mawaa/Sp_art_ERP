import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/lib/models/Course';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const courses = await Course.find().sort({ createdAt: -1 });
    return NextResponse.json({
      courses: courses.map((course) => ({
        id: course._id.toString(),
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
        notes: course.notes,
        rulesAndRegulations: course.rulesAndRegulations,
        materialsRequired: course.materialsRequired,
        createdAt: course.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const {
      courseTitle,
      courseCode,
      image,
      instructor,
      duration,
      startDate,
      endDate,
      totalFees,
      discountFees,
      status = 'active',
      notes,
      rulesAndRegulations,
      materials,
      createdBy,
    } = body;

    // Basic validation and coercion
    if (!courseTitle || typeof courseTitle !== 'string' || !courseTitle.trim()) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 });
    }
    if (!courseCode || typeof courseCode !== 'string' || !courseCode.trim()) {
      return NextResponse.json({ error: 'Course code is required' }, { status: 400 });
    }

    const normalizedStatus = typeof status === 'string' ? status : 'active';
    if (!['active', 'inactive'].includes(normalizedStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const totalFeesNumber = Number(totalFees);
    const discountFeesNumber = Number(discountFees);
    const durationNumber = Number(duration);

    if (Number.isNaN(totalFeesNumber) || Number.isNaN(discountFeesNumber) || Number.isNaN(durationNumber)) {
      return NextResponse.json({ error: 'Duration, totalFees and discountFees must be numbers' }, { status: 400 });
    }

    const existingCourse = await Course.findOne({ courseCode: courseCode.trim() });
    if (existingCourse) {
      return NextResponse.json({ error: 'Course code already exists' }, { status: 409 });
    }

    let parsedStartDate: Date | undefined = undefined;
    let parsedEndDate: Date | undefined = undefined;
    if (startDate !== undefined && startDate !== null && startDate !== '') {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json({ error: 'Start date is invalid' }, { status: 400 });
      }
    }
    if (endDate !== undefined && endDate !== null && endDate !== '') {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({ error: 'End date is invalid' }, { status: 400 });
      }
    }

    const discountPercentage = totalFeesNumber > 0
      ? Math.max(0, Math.round(((totalFeesNumber - discountFeesNumber) / totalFeesNumber) * 100))
      : 0;

    const course = await Course.create({
      courseTitle: courseTitle.trim(),
      courseCode: courseCode.trim(),
      image: image || undefined,
      instructor: instructor || undefined,
      duration: durationNumber,
      ...(parsedStartDate ? { startDate: parsedStartDate } : {}),
      ...(parsedEndDate ? { endDate: parsedEndDate } : {}),
      totalFees: totalFeesNumber,
      discountFees: discountFeesNumber,
      discountPercentage,
      status: normalizedStatus as 'active' | 'inactive',
      notes,
      rulesAndRegulations: typeof rulesAndRegulations === 'string' ? rulesAndRegulations : '',
      materialsRequired: typeof materials === 'string' ? materials : '',
      createdBy,
    });

    return NextResponse.json(
      {
        message: 'Course created successfully',
        course: {
          id: course._id.toString(),
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
          notes: course.notes,
          rulesAndRegulations: course.rulesAndRegulations,
          materialsRequired: course.materialsRequired,
          createdAt: course.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

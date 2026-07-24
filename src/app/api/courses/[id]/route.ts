import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/lib/models/Course';

export const runtime = 'nodejs';
export async function GET(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await dbConnect();
    const course = await Course.findById(id).populate('teacherId').populate('seniorTeacherId');
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({
      course: {
        id: course._id.toString(),
        courseTitle: course.courseTitle,
        category: course.category,
        categorySlug: course.categorySlug,
        courseCode: course.courseCode,
        image: course.image,
        instructor: course.instructor,
        session: course.session,
        remainingDays: course.remainingDays,
        teacherId: course.teacherId?.toString(),
        teacherName: (course.teacherId as any)?.fullName || null,
        seniorTeacherId: course.seniorTeacherId?.toString(),
        seniorTeacherName: (course.seniorTeacherId as any)?.fullName || null,
        validUntil: course.validUntil?.toISOString() ?? '',
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
        updatedAt: course.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await dbConnect();
    const body = await request.json();
    const {
      courseTitle,
      category,
      courseCode,
      image,
      instructor,
      session,
      remainingDays,
      teacherId,
      seniorTeacherId,
      validUntil,
      startDate,
      endDate,
      totalFees,
      discountFees,
      status,
      notes,
      rulesAndRegulations,
      materials,
    } = body;

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (courseTitle) updateData.courseTitle = courseTitle;
    if (category) {
      updateData.category = category;
      updateData.categorySlug = category.trim().toLowerCase();
    }
    if (courseCode) {
      const existingCourse = await Course.findOne({ courseCode, _id: { $ne: id } });
      if (existingCourse) {
        return NextResponse.json({ error: 'Course code already exists' }, { status: 409 });
      }
      updateData.courseCode = courseCode;
    }
    if (image !== undefined) updateData.image = image;
    if (instructor !== undefined) updateData.instructor = instructor;
    if (session !== undefined) updateData.session = session;
    if (remainingDays !== undefined) updateData.remainingDays = remainingDays;
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (seniorTeacherId !== undefined) updateData.seniorTeacherId = seniorTeacherId;
    if (validUntil !== undefined) {
      const parsedValidUntil = new Date(validUntil);
      if (isNaN(parsedValidUntil.getTime())) {
        return NextResponse.json({ error: 'Valid Until date is invalid' }, { status: 400 });
      }
      updateData.validUntil = parsedValidUntil;
    }
    if (startDate !== undefined) {
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json({ error: 'Start date is invalid' }, { status: 400 });
      }
      updateData.startDate = parsedStartDate;
    }
    if (endDate !== undefined) {
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({ error: 'End date is invalid' }, { status: 400 });
      }
      updateData.endDate = parsedEndDate;
    }
    if (totalFees !== undefined) updateData.totalFees = Number(totalFees);
    if (discountFees !== undefined) updateData.discountFees = Number(discountFees);

    if (totalFees !== undefined || discountFees !== undefined) {
      const currentTotal = totalFees !== undefined ? Number(totalFees) : course.totalFees;
      const currentDiscountFees = discountFees !== undefined ? Number(discountFees) : course.discountFees;
      updateData.discountPercentage = currentTotal > 0
        ? Math.max(0, Math.round(((currentTotal - currentDiscountFees) / currentTotal) * 100))
        : 0;
    }
    if (status) {
      if (!['active', 'inactive'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }
    if (notes !== undefined) updateData.notes = notes;
    if (rulesAndRegulations !== undefined) updateData.rulesAndRegulations = rulesAndRegulations;
    if (materials !== undefined) updateData.materialsRequired = materials;

    const updatedCourse = await Course.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Course updated successfully',
      course: {
        id: updatedCourse._id.toString(),
        courseTitle: updatedCourse.courseTitle,
        category: updatedCourse.category,
        categorySlug: updatedCourse.categorySlug,
        courseCode: updatedCourse.courseCode,
        image: updatedCourse.image,
        instructor: updatedCourse.instructor,
        session: updatedCourse.session,
        remainingDays: updatedCourse.remainingDays,
        teacherId: updatedCourse.teacherId?.toString(),
        seniorTeacherId: updatedCourse.seniorTeacherId?.toString(),
        validUntil: updatedCourse.validUntil?.toISOString() ?? '',
        startDate: updatedCourse.startDate?.toISOString() ?? '',
        endDate: updatedCourse.endDate?.toISOString() ?? '',
        totalFees: updatedCourse.totalFees,
        discountFees: updatedCourse.discountFees,
        discountPercentage: updatedCourse.discountPercentage,
        status: updatedCourse.status,
        notes: updatedCourse.notes,
        rulesAndRegulations: updatedCourse.rulesAndRegulations,
        materialsRequired: updatedCourse.materialsRequired,
        createdAt: updatedCourse.createdAt,
        updatedAt: updatedCourse.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await dbConnect();
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

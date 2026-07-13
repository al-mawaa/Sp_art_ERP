import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import Student from '@/lib/models/Student';
import StudentCredentials from '@/lib/models/StudentCredentials';
import Batch from '@/lib/models/Batch';
import CourseEnrollment from '@/lib/models/CourseEnrollment';
import Course from '@/lib/models/Course';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const url = new URL(request.url);
    const className = url.searchParams.get('class');
    const feeStatus = url.searchParams.get('feeStatus');

    const filter: Record<string, unknown> = {};
    
    if (className && className !== 'All') {
      filter.className = className;
    }
    
    if (feeStatus && feeStatus !== 'All') {
      filter.feeStatus = feeStatus;
    }

    const students = await Student.find(filter).sort({ createdAt: -1 });
    const credentials = await StudentCredentials.find({ role: 'Student' }).sort({ createdAt: -1 });

    const existingBadges = new Set(students.map(s => s.badgeId));
    const existingEmails = new Set(students.filter(s => s.email).map(s => s.email));

    const credentialStudents = credentials
      .filter(c => {
        const badge = c.studentIdNumber?.trim() || c.studentId;
        return !existingBadges.has(badge) && !existingEmails.has(c.email);
      })
      .map(doc => ({
        id: doc._id.toString(),
        name: doc.name,
        email: doc.email,
        badgeId: doc.studentIdNumber?.trim() || doc.studentId,
        class: 'Not Assigned',
        feeStatus: 'Pending',
        phone: doc.mobileNumber,
        photo: undefined,
        parentName: undefined,
        dob: undefined,
        age: undefined,
        bloodGroup: undefined,
        gender: undefined,
        school: undefined,
        college: undefined,
        occupation: undefined,
        fatherName: undefined,
        fatherMobile: undefined,
        motherName: undefined,
        motherMobile: undefined,
        address: undefined,
        currentCourse: undefined,
        batchDays: undefined,
        batchTime: undefined,
        courseDurationMonths: undefined,
        artTeacher: undefined,
        vanFacility: undefined,
        createdAt: doc.createdAt,
      }));

    // Fetch active course enrollments for all students in bulk
    const allStudentIds = [...students.map(s => s._id), ...credentialStudents.map(s => new mongoose.Types.ObjectId(s.id))];
    const activeEnrollments = await CourseEnrollment.find({
      studentId: { $in: allStudentIds },
      status: 'active'
    }).populate('courseId');

    // Create a map of studentId to their active course names
    const studentCourseMap = new Map<string, string[]>();
    activeEnrollments.forEach(enrollment => {
      const studentId = enrollment.studentId.toString();
      const courseName = (enrollment.courseId as any)?.courseTitle || 'Unknown Course';
      
      if (!studentCourseMap.has(studentId)) {
        studentCourseMap.set(studentId, []);
      }
      studentCourseMap.get(studentId)?.push(courseName);
    });

    const enrichedStudents = students.map(doc => {
      const studentId = doc._id.toString();
      const courses = studentCourseMap.get(studentId) || [];
      
      return {
        id: doc._id.toString(),
        name: doc.fullName,
        email: doc.email,
        badgeId: doc.badgeId,
        class: doc.className,
        feeStatus: doc.feeStatus,
        phone: doc.phone,
        photo: doc.photo,
        parentName: doc.parentName,
        dob: doc.dob,
        age: doc.age,
        bloodGroup: doc.bloodGroup,
        gender: doc.gender,
        school: doc.school,
        college: doc.college,
        occupation: doc.occupation,
        fatherName: doc.fatherName,
        fatherMobile: doc.fatherMobile,
        fatherOccupation: doc.fatherOccupation,
        motherName: doc.motherName,
        motherMobile: doc.motherMobile,
        motherOccupation: doc.motherOccupation,
        address: doc.address,
        howYouKnowUs: doc.howYouKnowUs ?? doc.howYouComeToKnow,
        howYouComeToKnow: doc.howYouComeToKnow,
        batchId: doc.batchId?.toString(),
        currentCourse: courses.length > 0 ? courses[0] : undefined,
        currentCourses: courses.length > 1 ? courses : undefined,
        createdAt: doc.createdAt,
      };
    });

    const enrichedCredentialStudents = credentialStudents.map(doc => {
      const courses = studentCourseMap.get(doc.id) || [];
      
      return {
        ...doc,
        currentCourse: courses.length > 0 ? courses[0] : undefined,
        currentCourses: courses.length > 1 ? courses : undefined,
      };
    });

    return NextResponse.json({
      students: [...enrichedStudents, ...enrichedCredentialStudents],
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      fullName,
      email,
      badgeId,
      className = 'Not Assigned',
      phone,
      photo,
      parentName,
      dob,
      age,
      bloodGroup,
      gender,
      school,
      college,
      occupation,
      fatherName,
      fatherMobile,
      fatherOccupation,
      motherName,
      motherMobile,
      motherOccupation,
      address,
      howYouKnowUs,
      howYouComeToKnow,
      batchId,
      feeStatus = 'Pending',
    } = body;

    if (!fullName || !badgeId) {
      return NextResponse.json(
        { error: 'Full name and badge ID are required' },
        { status: 400 }
      );
    }

    // Check if student with same badge ID already exists
    const existingStudent = await Student.findOne({ badgeId });
    if (existingStudent) {
      return NextResponse.json({ error: 'Badge ID already exists' }, { status: 409 });
    }

    // Handle batch assignment
    if (batchId) {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }
      
      // Check if batch has capacity
      if (batch.students.length >= batch.batchCapacity) {
        return NextResponse.json({ error: 'This batch is already full' }, { status: 400 });
      }
      
      // Check if student is already in the batch (by studentId or email)
      const alreadyInBatch = batch.students.some(
        s => s.studentId?.toString() === existingStudent?._id.toString() || 
             s.studentEmail?.toLowerCase() === email?.toLowerCase()
      );
      if (alreadyInBatch) {
        return NextResponse.json({ error: 'Student is already assigned to this batch' }, { status: 400 });
      }
    }

    const student = await Student.create({
      fullName,
      email,
      badgeId,
      className,
      phone,
      photo,
      parentName,
      dob,
      age,
      bloodGroup,
      gender,
      school,
      college,
      occupation,
      fatherName,
      fatherMobile,
      fatherOccupation,
      motherName,
      motherMobile,
      motherOccupation,
      address,
      howYouKnowUs,
      howYouComeToKnow,
      batchId,
      feeStatus,
    });

    // Add student to batch if batchId is provided
    if (batchId) {
      const batch = await Batch.findById(batchId);
      if (batch) {
        batch.students.push({
          _id: student._id,
          studentId: student._id,
          studentName: student.fullName,
          studentEmail: student.email || '',
          phone: student.phone || '',
          course: batch.courseName,
          batchDay: batch.batchDay,
          batchTime: batch.batchTime,
          startMonth: batch.startMonth,
          endMonth: batch.endMonth,
        });
        await batch.save();
      }
    }

    return NextResponse.json(
      {
        message: 'Student created successfully',
        student: {
          id: student._id.toString(),
          name: student.fullName,
          email: student.email,
          badgeId: student.badgeId,
          class: student.className,
          feeStatus: student.feeStatus,
          phone: student.phone,
          createdAt: student.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

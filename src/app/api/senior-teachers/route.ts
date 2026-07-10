import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SeniorTeacher from '@/lib/models/SeniorTeacher';

export const runtime = 'nodejs';

const generateBadgeId = () => {
  return `SRT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
};

async function getUniqueBadgeId() {
  let badgeId = generateBadgeId();
  while (await SeniorTeacher.findOne({ badgeId })) {
    badgeId = generateBadgeId();
  }
  return badgeId;
}

export async function GET() {
  try {
    await dbConnect();
    const teachers = await SeniorTeacher.find().sort({ createdAt: -1 });
    return NextResponse.json({
      teachers: teachers.map((t) => ({
        id: t._id.toString(),
        badgeId: t.badgeId,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone,
        dob: t.dob,
        age: t.age,
        gender: t.gender,
        bloodGroup: t.bloodGroup,
        schoolCollege: t.schoolCollege,
        parentGuardianDetails: t.parentGuardianDetails,
        address: t.address,
        className: t.className,
        currentSubjectCourse: t.currentSubjectCourse,
        specialization: t.specialization,
        yearsOfExperience: t.yearsOfExperience,
        role: t.role,
        qualification: t.qualification,
        joiningDate: t.joiningDate,
        salary: t.salary,
        bio: t.bio,
        profileImage: t.profileImage,
        status: t.status,
        assignedClasses: t.assignedClasses,
        teacherDocuments: t.teacherDocuments,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching senior teachers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      badgeId,
      fullName,
      email,
      phone,
      dob,
      age,
      gender,
      bloodGroup,
      schoolCollege,
      parentGuardianDetails,
      address,
      className,
      currentSubjectCourse,
      specialization,
      yearsOfExperience,
      qualification,
      joiningDate,
      bio,
      profileImage,
      teacherDocuments,
      status = 'Active',
      assignedClasses = 0,
    } = body;

    if (!fullName || !email || !phone || !specialization || yearsOfExperience === undefined || !qualification || !address || !joiningDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingEmail = await SeniorTeacher.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const finalBadgeId = badgeId?.trim() || await getUniqueBadgeId();
    const teacher = await SeniorTeacher.create({
      fullName,
      badgeId: finalBadgeId,
      email,
      phone,
      dob: dob ? new Date(dob) : undefined,
      age,
      gender,
      bloodGroup,
      schoolCollege,
      parentGuardianDetails,
      address,
      className,
      currentSubjectCourse,
      specialization,
      yearsOfExperience,
      qualification,
      joiningDate: new Date(joiningDate),
      bio,
      profileImage,
      teacherDocuments,
      status,
      assignedClasses,
    });

    return NextResponse.json({
      message: 'Senior teacher created successfully',
      teacher: {
        id: teacher._id.toString(),
        badgeId: teacher.badgeId,
        fullName: teacher.fullName,
        email: teacher.email,
        phone: teacher.phone,
        dob: teacher.dob,
        age: teacher.age,
        gender: teacher.gender,
        bloodGroup: teacher.bloodGroup,
        schoolCollege: teacher.schoolCollege,
        parentGuardianDetails: teacher.parentGuardianDetails,
        address: teacher.address,
        className: teacher.className,
        currentSubjectCourse: teacher.currentSubjectCourse,
        specialization: teacher.specialization,
        yearsOfExperience: teacher.yearsOfExperience,
        qualification: teacher.qualification,
        joiningDate: teacher.joiningDate,
        bio: teacher.bio,
        profileImage: teacher.profileImage,
        teacherDocuments: teacher.teacherDocuments,
        status: teacher.status,
        assignedClasses: teacher.assignedClasses,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating senior teacher:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

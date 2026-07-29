import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { findStudentById, toProfileDto, updateStudentProfile } from "@/lib/student-portal";
import { getStudentProfileEditAccess } from "@/lib/student/studentQueryAccess";
import { consumeProfileEditAccess } from "@/lib/queries/queryAccess";
import { findBatchesForStudent } from "@/lib/student/studentBatches";

export const runtime = "nodejs";

const updateSchema = z.object({
  howYouKnowUs: z.string().trim().max(100).optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  fatherMobile: z.string().optional(),
  motherMobile: z.string().optional(),
  school: z.string().optional(),
  college: z.string().optional(),
  occupation: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  courseName: z.string().trim().max(100).optional(),
  vanFacility: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const student = await findStudentById(auth.student.id);
    if (!student) {
      return apiError("Student not found in students collection", 404);
    }

    const access = await getStudentProfileEditAccess(auth.student.id);
    const classes = await findBatchesForStudent(student);
    const currentClass = classes[0] ?? null;

    const profile = toProfileDto(student);
    profile.classes = classes.map(c => ({
      id: c.id,
      batchName: c.batchName,
      batchTiming: c.batchTime,
      courseName: c.courseName,
      teacherName: c.teachers,
    }));

    if (currentClass) {
      profile.batchName = currentClass.batchName;
      profile.batchTiming = currentClass.batchTime;
      profile.courseName = currentClass.courseName;
      profile.teacherName = currentClass.teachers;
    }

    return apiSuccess({
      profile,
      canEditProfile: access.canEditProfile,
      latestQuery: access.latestQuery,
    });
  } catch (error) {
    console.error("[student/profile GET]", error);
    return apiError("Failed to load profile", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map(e => e.message).join("; "), 422);
    }

    await dbConnect();

    const student = await updateStudentProfile(auth.student.id, "", parsed.data);

    if (!student) {
      return apiError(
        "Student not found in students collection. Log in with the email on your student record.",
        404,
      );
    }

    // Set profileEditCompleted to true after first edit
    if (!student.profileEditCompleted) {
      student.profileEditCompleted = true;
      await student.save();
    }

    // Consume profile edit access if it was from an admin-approved request
    await consumeProfileEditAccess("student", auth.student.id);

    return apiSuccess(
      { profile: toProfileDto(student) },
      { message: "Profile saved successfully" },
    );
  } catch (error) {
    console.error("[student/profile PUT]", error);
    return apiError("Failed to update profile", 500);
  }
}

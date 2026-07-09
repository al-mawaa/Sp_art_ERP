import { NextRequest, NextResponse } from "next/server";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import Batch from "@/lib/models/Batch";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import Course from "@/lib/models/Course";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const studentObjectId = new mongoose.Types.ObjectId(auth.student.id);

    // Find all active batches for this student
    const batches = await Batch.find({
      "students.studentId": studentObjectId,
      batchStatus: { $ne: "Inactive" }
    })
      .populate("teacherIds", "fullName _id")
      .populate("seniorTeacherIds", "fullName _id")
      .lean();

    const courseIds = [...new Set(batches.map((b) => b.courseName))];
    const courses = await Course.find({ courseTitle: { $in: courseIds } }).lean();
    const courseMap = new Map(courses.map(c => [c.courseTitle, c._id.toString()]));

    const eligibleTeachers: Array<{
      teacherId: string;
      teacherName: string;
      courseId: string;
      courseName: string;
      batchId: string;
      batchName: string;
    }> = [];

    const addedKeys = new Set<string>();

    for (const batch of batches) {
      const courseId = courseMap.get(batch.courseName) || "";
      const batchId = batch._id.toString();

      type TeacherRef = { _id: string; fullName: string };
      const teachers = [
        ...((batch.teacherIds as unknown as TeacherRef[]) || []),
        ...((batch.seniorTeacherIds as unknown as TeacherRef[]) || [])
      ];

      for (const t of teachers) {
        if (!t._id || !t.fullName) continue;
        const teacherId = t._id.toString();
        const key = `${teacherId}-${courseId}-${batchId}`;
        
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          eligibleTeachers.push({
            teacherId,
            teacherName: t.fullName,
            courseId,
            courseName: batch.courseName,
            batchId,
            batchName: batch.batchName,
          });
        }
      }
    }

    return NextResponse.json({ success: true, eligibleTeachers });
  } catch (error) {
    console.error("Eligible teachers fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch eligible teachers" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudentFeedback from "@/lib/models/StudentFeedback";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET() {
  try {
    await dbConnect();
    const query: Record<string, unknown> = {};

    const allFeedbacks = await StudentFeedback.find(query).lean();
    
    const feedbacks = await StudentFeedback.find(query)
      .populate("studentId", "fullName email")
      .populate("courseId", "courseTitle")
      .populate("batchId", "batchName courseName")
      .sort({ createdAt: -1 })
      .lean();

    type TeacherDoc = { _id: { toString(): string }; fullName: string };
    const teacherIds = [...new Set(feedbacks.map(f => f.teacherId?.toString()).filter(id => id && mongoose.Types.ObjectId.isValid(id)))];
    const [teachers, seniorTeachers] = await Promise.all([
      Teacher.find({ _id: { $in: teacherIds } }, "fullName").lean(),
      SeniorTeacher.find({ _id: { $in: teacherIds } }, "fullName").lean()
    ]);

    const teacherMap = new Map();
    teachers.forEach((t: TeacherDoc) => teacherMap.set(t._id.toString(), t.fullName));
    seniorTeachers.forEach((t: TeacherDoc) => teacherMap.set(t._id.toString(), t.fullName));

    return NextResponse.json({ success: true, count: feedbacks.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.stack : "Unknown error", message: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

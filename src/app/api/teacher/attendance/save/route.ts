import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import TeacherStudentAttendanceModel from "@/lib/models/TeacherStudentAttendance";
import TeacherModel from "@/lib/models/Teacher";
import { TEACHER_SESSION_COOKIE } from "@/lib/auth/portal-session";
import { dateOnlyToUtcNoon, normalizeDateOnly } from "@/lib/dates/attendanceDate";

function mapStudents(students: Array<Record<string, unknown>>) {
  return students.map(student => ({
    studentId: new mongoose.Types.ObjectId(String(student.studentId)),
    studentName: String(student.studentName ?? ""),
    studentEmail: String(student.studentEmail ?? ""),
    phone: String(student.phone ?? ""),
    status: student.status as "Present" | "Absent",
    remark: String(student.remark ?? ""),
  }));
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const teacherId = req.cookies.get(TEACHER_SESSION_COOKIE)?.value;
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { batchId, batchName, courseName, date, students } = body;

    if (!batchId || !batchName || !courseName || !date || !students || !Array.isArray(students)) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 });
    }

    const attendanceDate = normalizeDateOnly(date);
    if (!attendanceDate) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
    }

    const legacyDate = dateOnlyToUtcNoon(attendanceDate);
    if (!legacyDate) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
    }

    const teacher = await TeacherModel.findById(teacherId).select("fullName");
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const objectBatchId = new mongoose.Types.ObjectId(batchId);
    const objectTeacherId = new mongoose.Types.ObjectId(teacherId);
    const mappedStudents = mapStudents(students);

    const payload = {
      batchName,
      courseName,
      teacherId: objectTeacherId,
      teacherName: teacher.fullName,
      attendanceDate,
      date: legacyDate,
      students: mappedStudents,
    };

    let existingAttendance = await TeacherStudentAttendanceModel.findOne({
      batchId: objectBatchId,
      attendanceDate,
    });

    if (!existingAttendance) {
      existingAttendance = await TeacherStudentAttendanceModel.findOne({
        batchId: objectBatchId,
        $or: [
          { attendanceDate: { $exists: false } },
          { attendanceDate: null },
          { attendanceDate: "" },
        ],
      });
    }

    if (existingAttendance) {
      Object.assign(existingAttendance, payload);
      await existingAttendance.save();
    } else {
      await TeacherStudentAttendanceModel.findOneAndUpdate(
        { batchId: objectBatchId, attendanceDate },
        { $set: { batchId: objectBatchId, ...payload } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    return NextResponse.json(
      { success: true, message: "Attendance submitted successfully", attendanceDate },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error saving attendance:", error);
    const code = (error as { code?: number })?.code;
    if (code === 11000) {
      return NextResponse.json(
        { error: "Attendance for this batch and date already exists. Refresh and try again." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}

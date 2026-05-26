import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Batch from "@/lib/models/Batch";
import Attendance from "@/lib/models/Attendance";
import TeacherStudentAttendanceModel, {
  type AttendanceStudent,
} from "@/lib/models/TeacherStudentAttendance";
import TeacherModel from "@/lib/models/Teacher";
import { TEACHER_SESSION_COOKIE } from "@/lib/auth/portal-session";
import {
  dateOnlyToUtcDate,
  legacyDateDayRange,
  normalizeDateOnly,
} from "@/lib/dates/attendanceDate";
import { recomputeBatchAttendanceSummary } from "@/lib/attendance/recomputeBatchSummary";

type IncomingStudent = {
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  phone?: string;
  status?: string;
  remark?: string;
  remarks?: string;
};

function normalizeStudents(
  students: IncomingStudent[],
  validStudentIds: Set<string>,
): AttendanceStudent[] {
  const rows: AttendanceStudent[] = [];

  for (const raw of students) {
    const id = String(raw.studentId ?? "").trim();
    if (!mongoose.Types.ObjectId.isValid(id) || !validStudentIds.has(id)) continue;

    const status = raw.status === "Absent" ? "Absent" : "Present";
    rows.push({
      studentId: new mongoose.Types.ObjectId(id),
      studentName: String(raw.studentName ?? "").trim() || "Student",
      studentEmail: String(raw.studentEmail ?? "").trim(),
      phone: String(raw.phone ?? "").trim(),
      status,
      remark: String(raw.remark ?? raw.remarks ?? "").trim(),
    });
  }

  return rows;
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

    const batch = await Batch.findById(batchId).select("students").lean();
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const validStudentIds = new Set(batch.students.map(s => s._id.toString()));
    const normalizedStudents = normalizeStudents(students as IncomingStudent[], validStudentIds);

    if (normalizedStudents.length === 0) {
      return NextResponse.json(
        { error: "No valid student attendance entries to save" },
        { status: 400 },
      );
    }

    const teacher = await TeacherModel.findById(teacherId).select("fullName");
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const objectBatchId = new mongoose.Types.ObjectId(batchId);
    const objectTeacherId = new mongoose.Types.ObjectId(teacherId);
    const legacyDate = dateOnlyToUtcDate(attendanceDate);
    const { start: legacyStart, end: legacyEnd } = legacyDateDayRange(attendanceDate);

    const existingAttendance = await TeacherStudentAttendanceModel.findOne({
      batchId: objectBatchId,
      $or: [
        { attendanceDate },
        { date: { $gte: legacyStart, $lt: legacyEnd } },
      ],
    });

    if (existingAttendance) {
      existingAttendance.students = normalizedStudents;
      existingAttendance.teacherName = teacher.fullName;
      existingAttendance.teacherId = objectTeacherId;
      existingAttendance.attendanceDate = attendanceDate;
      existingAttendance.date = legacyDate;
      await existingAttendance.save();
    } else {
      await TeacherStudentAttendanceModel.create({
        batchId: objectBatchId,
        batchName,
        courseName,
        teacherId: objectTeacherId,
        teacherName: teacher.fullName,
        attendanceDate,
        date: legacyDate,
        students: normalizedStudents,
      });
    }

    for (const entry of normalizedStudents) {
      await Attendance.findOneAndUpdate(
        {
          batchId: objectBatchId,
          studentId: entry.studentId,
          attendanceDate,
        },
        {
          $set: {
            status: entry.status,
            remarks: entry.remark ?? "",
            teacherId: objectTeacherId,
            markedBy: objectTeacherId,
          },
        },
        { upsert: true, new: true },
      );
    }

    await recomputeBatchAttendanceSummary(batchId);

    return NextResponse.json(
      {
        success: true,
        message: "Attendance submitted successfully",
        attendanceDate,
        savedCount: normalizedStudents.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error saving attendance:", error);
    const message =
      error instanceof Error && (error as { code?: number }).code === 11000
        ? "Attendance for this batch and date already exists. Try again or refresh the page."
        : "Failed to save attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import BatchModel from "@/lib/models/Batch";
import TeacherStudentAttendanceModel from "@/lib/models/TeacherStudentAttendance";
import StudentModel from "@/lib/models/Student";
import { STUDENT_SESSION_COOKIE } from "@/lib/auth/portal-session";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const studentId = req.cookies.get(STUDENT_SESSION_COOKIE)?.value;
    if (!studentId) {
      return NextResponse.json({ error: "No student session" }, { status: 401 });
    }

    const objectStudentId = mongoose.Types.ObjectId.isValid(studentId) 
      ? new mongoose.Types.ObjectId(studentId)
      : null;

    // Get student info
    const student = await StudentModel.findById(objectStudentId)
      .select("_id email fullName")
      .lean();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get batches for this student
    const batches = await BatchModel.find({
      $or: [
        { "students.studentId": objectStudentId },
        { "students.studentEmail": student.email?.toLowerCase() }
      ]
    }).lean();

    // For each batch, get attendance records
    const attendanceByBatch: Record<string, unknown> = {};
    for (const batch of batches) {
      const records = await TeacherStudentAttendanceModel.find({
        batchId: batch._id
      })
        .select("date batchId batchName students")
        .lean();

      // Filter for this student in the records
      const studentRecords = records
        .map((record) => {
          const studentInRecord = ((record.students as unknown[]) || []).find((s: unknown) => {
            const sRecord = s as Record<string, unknown>;
            const sIdStr = (sRecord.studentId as { toString(): string })?.toString?.() || String(sRecord.studentId);
            return sIdStr === objectStudentId.toString();
          });
          const found = studentInRecord as Record<string, unknown>;
          return found ? {
            date: record.date,
            status: found.status,
            batchId: (record.batchId as { toString(): string }).toString(),
            batchName: record.batchName
          } : null;
        })
        .filter(Boolean);

      attendanceByBatch[batch._id.toString()] = {
        batchName: batch.batchName,
        batchId: batch._id.toString(),
        courseName: batch.courseName,
        totalRecords: records.length,
        studentRecords: studentRecords
      };
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student._id.toString(),
        email: student.email,
        fullName: student.fullName
      },
      batches: batches.map(b => ({
        id: b._id.toString(),
        name: b.batchName,
        course: b.courseName,
        students: (b.students || []).length
      })),
      attendanceByBatch,
      debug: {
        studentId: objectStudentId?.toString(),
        studentEmail: student.email,
        batchesCount: batches.length
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

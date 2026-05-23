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

    // Get batches for this student
    const batches = await BatchModel.find({
      $or: [
        { "students.studentId": objectStudentId },
        { "students.studentEmail": student.email?.toLowerCase() }
      ]
    }).lean();

    const debugInfo = [];

    // For the first batch, show all raw attendance records
    if (batches.length > 0) {
      const batch = batches[0];
      const records = await TeacherStudentAttendanceModel.find({
        batchId: batch._id
      }).lean();

      debugInfo.push({
        batch: batch.batchName,
        batchId: batch._id.toString(),
        totalRecordsInBatch: records.length,
        rawRecords: records.map((r) => ({
          date: r.date,
          batchId: (r.batchId as { toString(): string }).toString(),
          students: ((r.students as unknown[]) || []).map((s) => {
            const sRec = s as Record<string, unknown>;
            return {
              studentId: (sRec.studentId as { toString(): string })?.toString?.() || String(sRec.studentId) || "null",
              studentName: sRec.studentName,
              studentEmail: sRec.studentEmail,
              status: sRec.status
            };
          })
        }))
      });
    }

    return NextResponse.json({
      success: true,
      loggedInStudent: {
        id: objectStudentId?.toString(),
        email: student?.email,
        name: student?.fullName
      },
      debugInfo
    });
  } catch (error) {
    console.error("Debug attendance error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import BatchModel from "@/lib/models/Batch";
import TeacherStudentAttendanceModel from "@/lib/models/TeacherStudentAttendance";
import StudentModel from "@/lib/models/Student";
import { AttendanceStudent } from "@/lib/models/TeacherStudentAttendance";
import type { BatchDocument } from "@/lib/models/Batch";
import { STUDENT_SESSION_COOKIE } from "@/lib/auth/portal-session";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const studentId = req.cookies.get(STUDENT_SESSION_COOKIE)?.value;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const month = searchParams.get("month");

    const now = new Date();
    const useMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, monthNumber] = useMonth.split("-").map(Number);
    if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }

    const startDate = new Date(year, monthNumber - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, monthNumber, 1);
    endDate.setHours(0, 0, 0, 0);

    let objectStudentId: mongoose.Types.ObjectId | null = null;
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      objectStudentId = new mongoose.Types.ObjectId(studentId);
      console.log(`[ATTENDANCE] Fetching data for student (from cookie): ${studentId}`);
    }

    // If no session cookie present (common in dev), allow fallback by email when provided
    const emailParam = searchParams.get("email")?.toLowerCase().trim() || null;

    if (!objectStudentId) {
      if (emailParam && process.env.NODE_ENV !== "production") {
        // Try to find student by email (dev fallback)
        const found = await StudentModel.findOne({ email: emailParam }).select("_id email fullName").lean();
        if (found && found._id) {
          objectStudentId = new mongoose.Types.ObjectId(found._id.toString());
          console.log(`[ATTENDANCE] Using dev email fallback. Found student ${found._id} for email ${emailParam}`);
        } else {
          console.log(`[ATTENDANCE] Dev email fallback provided but no student found for ${emailParam}`);
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Fetch student to get email and other details
    const student = await StudentModel.findById(objectStudentId).select("email fullName").lean();
    const studentEmail = student?.email?.toLowerCase() || emailParam || "";
    console.log(`[ATTENDANCE] Student email: ${studentEmail}`);

    // Fetch attendance records for logged-in student in this month
    // Fetch all records first, then filter in application to handle both ObjectId and string formats
    const allAttendanceRecords = await TeacherStudentAttendanceModel.find({
      date: { $gte: startDate, $lt: endDate },
    })
      .select("date batchId batchName courseName students")
      .lean();

    // Filter for this student - use EMAIL as primary match (more reliable than ID)
    const studentEmailLower = studentEmail.toLowerCase();
    const attendanceRecords = allAttendanceRecords.filter((record) =>
      ((record.students as AttendanceStudent[]) || []).some(
        (s: AttendanceStudent) =>
          s.studentEmail?.toLowerCase?.() === studentEmailLower
      )
    );

    // Extract only logged-in student attendance from each record
    const studentAttendance = attendanceRecords
      .map((record) => {
        // Find student in the students array - use EMAIL to match
        const found = ((record.students as AttendanceStudent[]) || []).find((s: AttendanceStudent) => {
          return s.studentEmail?.toLowerCase?.() === studentEmailLower;
        });
        
        return {
          date: record.date instanceof Date ? record.date.toISOString().slice(0, 10) : String(record.date),
          batchId: record.batchId?.toString?.() ?? null,
          batchName: record.batchName,
          courseName: record.courseName,
          studentName: found?.studentName || "Student",
          status: found?.status || "Absent",
          remark: found?.remark || "",
        };
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Fetch batches allocated to student (from batches collection)
    // Try multiple queries to find batches. Use case-insensitive email match as fallback.
    const orClauses: Record<string, unknown>[] = [
      // Query by studentId (most reliable)
      { "students.studentId": objectStudentId },
    ];

    // Helper to escape regex special chars in email
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

    if (studentEmail) {
      // Use case-insensitive regex match for email to handle different casing/storage
      orClauses.push({ "students.studentEmail": { $regex: `^${escapeRegex(studentEmail)}$`, $options: "i" } });
    }

    // Batch lookup: also include string-stored studentId values to be robust
    const batchOrClauses = [...orClauses, { "students.studentId": objectStudentId.toString() }];

    let allocatedBatches = await BatchModel.find({ $or: batchOrClauses })
      .select("batchName courseName batchTiming batchDay batchTime _id students")
      .lean();

    // Remove duplicates by batchId
    const seenIds = new Set<string>();
    allocatedBatches = allocatedBatches.filter((batch: BatchDocument) => {
      const batchId = (batch._id as mongoose.Types.ObjectId).toString();
      if (seenIds.has(batchId)) return false;
      seenIds.add(batchId);
      return true;
    });

    const studentIdCountStr = allocatedBatches.filter((b: BatchDocument) => (b.students || []).some((s) => (s.studentId as mongoose.Types.ObjectId)?.toString() === objectStudentId.toString())).length;
    const emailCountStr = studentEmail ? allocatedBatches.filter((b: BatchDocument) => (b.students || []).some((s) => (s.studentEmail as string)?.toLowerCase() === studentEmail)).length : 0;
    console.log(`[BATCHES] Total batches found: ${allocatedBatches.length} (studentId: ${studentIdCountStr}, email: ${emailCountStr})`);

    // If no batches found, log for debugging
    if (allocatedBatches.length === 0 && studentEmail) {
      console.log(`[BATCHES] No batches found. Debugging info:`);
      console.log(`  - Student ID: ${objectStudentId}`);
      console.log(`  - Student Email: ${studentEmail}`);
      
      // Debug: Check what's in database
      const allBatches = await BatchModel.find({})
        .select("batchName students")
        .lean()
        .limit(5);
      
      console.log(`[BATCHES] Sample batches in database:`);
      allBatches.forEach((batch: BatchDocument) => {
        const studentIds = (batch.students || []).map((s) => ({
          studentId: (s.studentId as mongoose.Types.ObjectId)?.toString() || "null",
          studentName: s.studentName,
          studentEmail: s.studentEmail,
        }));
        console.log(`  - ${batch.batchName}: ${JSON.stringify(studentIds)}`);
      });
    }

    const allocatedBatchRecords = allocatedBatches.map(batch => ({
      batchId: batch._id?.toString?.() ?? null,
      batchName: batch.batchName,
      courseName: batch.courseName,
      batchTiming: batch.batchTiming || "",
      batchDay: batch.batchDay,
      batchTime: batch.batchTime,
    }));

    console.log(`[ATTENDANCE] Student ${studentId} (${studentEmail}): Found ${allocatedBatchRecords.length} allocated batches for month ${useMonth}`);

    // Calculate overall summary
    const present = studentAttendance.filter(r => r.status === "Present").length;
    const absent = studentAttendance.filter(r => r.status === "Absent").length;
    const total = studentAttendance.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return NextResponse.json(
      {
        success: true,
        records: studentAttendance,
        summary: { present, absent, total, percentage },
        allocatedBatches: allocatedBatchRecords,
        month: useMonth,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching student attendance report:", error);
    return NextResponse.json({ error: "Failed to fetch student attendance" }, { status: 500 });
  }
}

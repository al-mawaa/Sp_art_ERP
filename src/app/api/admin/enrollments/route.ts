import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import Student from "@/lib/models/Student";
import Batch from "@/lib/models/Batch";
import Course from "@/lib/models/Course";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const rows = await CourseEnrollment.find().sort({ updatedAt: -1 }).limit(200).lean();
    const studentIds = [...new Set(rows.map(r => r.studentId.toString()))];
    const batchIds = [...new Set(rows.map(r => r.batchId.toString()))];
    const courseIds = [...new Set(rows.map(r => r.courseId.toString()))];

    const [students, batches, courses] = await Promise.all([
      Student.find({ _id: { $in: studentIds } }).select("fullName email badgeId").lean(),
      Batch.find({ _id: { $in: batchIds } }).select("batchName batchCapacity students").lean(),
      Course.find({ _id: { $in: courseIds } }).select("courseTitle courseCode").lean(),
    ]);

    const studentMap = new Map(students.map(s => [s._id.toString(), s]));
    const batchMap = new Map(batches.map(b => [b._id.toString(), b]));
    const courseMap = new Map(courses.map(c => [c._id.toString(), c]));

    const enrollments = rows.map(r => {
      const batch = batchMap.get(r.batchId.toString());
      const student = studentMap.get(r.studentId.toString());
      const course = courseMap.get(r.courseId.toString());
      const capacity = batch?.batchCapacity ?? 0;
      const used = batch?.students?.length ?? 0;
      return {
        id: r._id.toString(),
        studentName: student?.fullName ?? "—",
        studentEmail: student?.email ?? "",
        badgeId: student?.badgeId ?? "",
        courseName: course?.courseTitle ?? "—",
        batchName: batch?.batchName ?? "—",
        paymentStatus: r.paymentStatus,
        status: r.status,
        totalAmount: r.totalAmount,
        paidAmount: r.paidAmount,
        remainingAmount: Math.max(0, r.totalAmount - r.paidAmount),
        installmentType: r.installmentType,
        enrollmentDate: r.enrollmentDate,
        nextDueDate: r.nextDueDate,
        seatsUsed: used,
        seatsTotal: capacity,
      };
    });

    return apiSuccess({ enrollments, total: enrollments.length });
  } catch (e) {
    console.error("[admin/enrollments GET]", e);
    return apiError("Failed to load enrollments", 500);
  }
}

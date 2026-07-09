import { NextRequest, NextResponse } from "next/server";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import StudentFeedback from "@/lib/models/StudentFeedback";
import Student from "@/lib/models/Student";
import Teacher from "@/lib/models/Teacher";
import Course from "@/lib/models/Course";
import Batch from "@/lib/models/Batch";
import { sendFeedbackNotificationToAdmin } from "@/lib/email/feedbackEmail";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const feedbacks = await StudentFeedback.find({ studentId: auth.student.id })
      .populate("courseId", "courseTitle")
      .populate("batchId", "batchName courseName")
      .sort({ createdAt: -1 })
      .lean();

    type TeacherDoc = { _id: { toString(): string }; fullName: string };
    const teacherIds = [...new Set(feedbacks.map(f => f.teacherId?.toString()).filter(Boolean))];
    const [teachers, seniorTeachers] = await Promise.all([
      Teacher.find({ _id: { $in: teacherIds } }, "fullName").lean(),
      import("@/lib/models/SeniorTeacher").then(m => m.default.find({ _id: { $in: teacherIds } }, "fullName").lean())
    ]);

    const teacherMap = new Map<string, string>();
    teachers.forEach((t: TeacherDoc) => teacherMap.set(t._id.toString(), t.fullName));
    seniorTeachers.forEach((t: TeacherDoc) => teacherMap.set(t._id.toString(), t.fullName));

    const history = feedbacks.map(f => {
      const courseId = f.courseId as { courseTitle?: string } | undefined;
      const batchId = f.batchId as { batchName?: string; courseName?: string } | undefined;
      const teacherIdStr = f.teacherId?.toString() || "";
      
      const teacherName = teacherMap.get(teacherIdStr) || (f.originalTeacherName as string) || "Unknown";
      
      return {
        id: (f._id as { toString(): string }).toString(),
        teacherName,
        courseName: courseId?.courseTitle || batchId?.courseName || "Unknown",
        batchName: batchId?.batchName || "Unknown",
        category: f.category,
        overallRating: f.overallRating,
        status: f.status,
        submittedDate: f.createdAt,
      };
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("Student feedback GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load feedback history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const {
      teacherId,
      courseId,
      batchId,
      category,
      teachingRating,
      communicationRating,
      behaviourRating,
      knowledgeRating,
      practicalRating,
      overallRating,
      subject,
      message,
      originalTeacherName,
      anonymous,
    } = body;

    if (!teacherId || !batchId || !category || !subject || !message) {
      return NextResponse.json({ error: `Missing required fields. Data received: teacherId=${teacherId}, batchId=${batchId}` }, { status: 400 });
    }

    await dbConnect();

    // Verify 30-day cooldown
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query: Record<string, unknown> = {
      studentId: auth.student.id,
      teacherId,
      createdAt: { $gte: thirtyDaysAgo },
    };
    if (courseId) {
      query.courseId = courseId;
    }

    const recentFeedback = await StudentFeedback.findOne(query);

    if (recentFeedback) {
      return NextResponse.json(
        { error: "You have already submitted feedback for this teacher and course within the last 30 days." },
        { status: 400 }
      );
    }

    const studentObjectId = new mongoose.Types.ObjectId(auth.student.id);

    // Verify student is actually in this batch
    const batch = await Batch.findOne({ _id: batchId, "students.studentId": studentObjectId });
    if (!batch) {
      return NextResponse.json(
        { error: "You are not enrolled in this batch." },
        { status: 400 }
      );
    }

    const feedbackData: Record<string, unknown> = {
      studentId: auth.student.id,
      teacherId,
      batchId,
      category,
      teachingRating: Number(teachingRating),
      communicationRating: Number(communicationRating),
      behaviourRating: Number(behaviourRating),
      knowledgeRating: Number(knowledgeRating),
      practicalRating: Number(practicalRating),
      overallRating: Number(overallRating),
      subject,
      message,
      originalTeacherName,
      anonymous: Boolean(anonymous),
      status: "Submitted",
    };
    if (courseId) {
      feedbackData.courseId = courseId;
    }

    const feedback = await StudentFeedback.create(feedbackData);

    // Send email notification to Admin
    const student = await Student.findById(auth.student.id);
    const teacher = await Teacher.findById(teacherId);
    const course = courseId ? await Course.findById(courseId) : null;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER;

    if (adminEmail && student && teacher) {
      try {
        await sendFeedbackNotificationToAdmin({
          adminEmail,
          studentName: anonymous ? "Anonymous Student" : student.fullName,
          teacherName: teacher?.fullName || originalTeacherName || "Unknown Teacher",
          course: course?.courseTitle || "Unknown Course",
          category,
          rating: Number(overallRating),
          message,
        });
      } catch (err) {
        console.error("Failed to send feedback email to admin:", err);
      }
    }

    return NextResponse.json({ success: true, feedbackId: feedback._id });
  } catch (error) {
    console.error("Student feedback POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

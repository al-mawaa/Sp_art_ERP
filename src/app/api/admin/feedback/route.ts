import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import dbConnect from "@/lib/mongodb";
import StudentFeedback from "@/lib/models/StudentFeedback";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    const courseId = searchParams.get("courseId");
    const batchId = searchParams.get("batchId");
    const rating = searchParams.get("rating");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Create query
    const query: Record<string, unknown> = {};
    if (teacherId) query.teacherId = teacherId;
    if (courseId) query.courseId = courseId;
    if (batchId) query.batchId = batchId;
    if (rating) query.overallRating = Number(rating);
    if (category) query.category = category;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      const createdAtQuery: { $gte?: Date; $lte?: Date } = {};
      if (startDate) createdAtQuery.$gte = new Date(startDate);
      if (endDate) createdAtQuery.$lte = new Date(endDate);
      query.createdAt = createdAtQuery;
    }

    await dbConnect();

    // Get stats first
    const allFeedbacks = await StudentFeedback.find(query).lean();
    
    const totalFeedback = allFeedbacks.length;
    let averageRating = 0;
    let positiveFeedback = 0; // rating >= 4
    let negativeFeedback = 0; // rating <= 2
    let pendingReview = 0; // status == 'Submitted'
    let closedFeedback = 0; // status == 'Closed'

    if (totalFeedback > 0) {
      let sum = 0;
      allFeedbacks.forEach(f => {
        sum += f.overallRating || 0;
        if (f.overallRating >= 4) positiveFeedback++;
        if (f.overallRating <= 2) negativeFeedback++;
        if (f.status === "Submitted") pendingReview++;
        if (f.status === "Closed") closedFeedback++;
      });
      averageRating = sum / totalFeedback;
    }

    // Get paginated/populated list without teacherId populate
    const feedbacks = await StudentFeedback.find(query)
      .populate("studentId", "fullName email")
      .populate("courseId", "courseTitle")
      .populate("batchId", "batchName courseName")
      .sort({ createdAt: -1 })
      .lean();

    // Manually populate teacherId from both Teacher and SeniorTeacher models
    type TeacherDoc = { _id: { toString(): string }; fullName: string };
    const teacherIds = [...new Set(feedbacks.map(f => f.teacherId?.toString()).filter(Boolean))];
    const [teachers, seniorTeachers] = await Promise.all([
      Teacher.find({ _id: { $in: teacherIds } }, "fullName").lean(),
      SeniorTeacher.find({ _id: { $in: teacherIds } }, "fullName").lean()
    ]);

    const teacherMap = new Map();
    teachers.forEach((t: TeacherDoc) => teacherMap.set(t._id.toString(), t.fullName));
    seniorTeachers.forEach((t: TeacherDoc) => teacherMap.set(t._id.toString(), t.fullName));

    type PopulatedFeedback = {
      _id: { toString(): string };
      teacherId?: { toString(): string };
      studentId?: { fullName?: string; _id?: { toString(): string } };
      courseId?: { courseTitle?: string };
      batchId?: { courseName?: string; batchName?: string };
      anonymous?: boolean;
      category?: string;
      teachingRating?: number;
      communicationRating?: number;
      behaviourRating?: number;
      knowledgeRating?: number;
      practicalRating?: number;
      overallRating?: number;
      subject?: string;
      message?: string;
      originalTeacherName?: string;
      status?: string;
      adminRemark?: string;
      createdAt?: string;
    };

    const formattedFeedbacks = feedbacks.map((f: unknown) => {
      const fb = f as PopulatedFeedback;
      const teacherIdStr = fb.teacherId?.toString();
      const studentName = fb.studentId?.fullName || "Unknown";
      
      return {
        id: fb._id.toString(),
        studentName: fb.anonymous ? `${studentName} (Anonymous)` : studentName,
        studentId: fb.studentId?._id?.toString() || null,
        teacherName: teacherMap.get(teacherIdStr) || fb.originalTeacherName || "Unknown",
        teacherId: teacherIdStr || null,
        courseName: fb.courseId?.courseTitle || fb.batchId?.courseName || "Unknown",
        batchName: fb.batchId?.batchName || "Unknown",
        category: fb.category,
        teachingRating: fb.teachingRating,
        communicationRating: fb.communicationRating,
        behaviourRating: fb.behaviourRating,
        knowledgeRating: fb.knowledgeRating,
        practicalRating: fb.practicalRating,
        overallRating: fb.overallRating,
        subject: fb.subject,
        message: fb.message,
        status: fb.status,
        adminRemark: fb.adminRemark,
        submittedDate: fb.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalFeedback,
        averageRating: parseFloat(averageRating.toFixed(1)),
        positiveFeedback,
        negativeFeedback,
        pendingReview,
        closedFeedback
      },
      feedbacks: formattedFeedbacks
    });
  } catch (error) {
    console.error("Admin feedback GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load feedbacks" },
      { status: 500 }
    );
  }
}

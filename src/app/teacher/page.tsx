import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import Teacher from "@/lib/models/Teacher";
import Batch from "@/lib/models/Batch";
import Student from "@/lib/models/Student";
import TeacherStudentAttendance from "@/lib/models/TeacherStudentAttendance";
import Leave from "@/lib/models/Leave";
import DrawingTask from "@/lib/models/DrawingTask";
import StudentEvaluation from "@/lib/models/StudentEvaluation";
import StudentFeedback from "@/lib/models/StudentFeedback";
import Notification from "@/lib/models/Notification";
import Certificate from "@/lib/models/Certificate";
import TeacherLeaveBalance from "@/lib/models/TeacherLeaveBalance";
import TeacherPerformance from "@/lib/models/TeacherPerformance";
import Query from "@/lib/models/Query";
import { TEACHER_SESSION_COOKIE } from "@/lib/auth/portal-session";
import { TeacherDashboardClient } from "@/components/teacher/TeacherDashboardClient";

export default async function TeacherDashboardPage() {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get(TEACHER_SESSION_COOKIE)?.value;

  if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
    redirect("/login/teacher");
  }

  await dbConnect();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch teacher
  const teacher = await Teacher.findById(teacherId).lean();
  if (!teacher) redirect("/login/teacher");

  // Fetch related data concurrently
  const [
    batches,
    attendanceList,
    leaves,
    drawingTasks,
    evaluations,
    feedbacks,
    notifications,
    certificates,
    leaveBalance,
    performance,
    queries,
  ] = await Promise.all([
    Batch.find({ teacherIds: teacherId }).lean(),
    TeacherStudentAttendance.find({ teacherId: teacherId }).lean(),
    Leave.find({ teacherId: teacherId }).lean(),
    DrawingTask.find({ createdBy: teacherId }).lean(),
    StudentEvaluation.find({ teacherId: teacherId }).lean(),
    StudentFeedback.find({ teacherId: teacherId }).lean(),
    Notification.find({ "recipients.userId": teacherId }).lean(),
    Certificate.find({ issuedBy: teacherId }).lean(),
    TeacherLeaveBalance.findOne({ teacherId: teacherId }).lean(),
    TeacherPerformance.findOne({ teacherId: teacherId }).lean(),
    Query.find({ userId: teacherId }).lean(),
  ]);

  const batchIds = batches.map(b => b._id);
  const students = await Student.find({ batchId: { $in: batchIds } }).lean();

  const data = JSON.parse(JSON.stringify({
    teacher,
    batches,
    students,
    attendanceList,
    leaves,
    drawingTasks,
    evaluations,
    feedbacks,
    notifications,
    certificates,
    leaveBalance,
    performance,
    queries
  }));

  return <TeacherDashboardClient data={data} />;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import Teacher from "@/lib/models/Teacher";
import Batch from "@/lib/models/Batch";
import Student from "@/lib/models/Student";
import TeacherStudentAttendance from "@/lib/models/TeacherStudentAttendance";
import Leave from "@/lib/models/Leave";
import DrawingTask from "@/lib/models/DrawingTask";
import StudentEvaluation from "@/lib/models/StudentEvaluation";
import Notification from "@/lib/models/Notification";
import Certificate from "@/lib/models/Certificate";
import Query from "@/lib/models/Query";
import TeacherLeaveBalance from "@/lib/models/TeacherLeaveBalance";
import TeacherPerformance from "@/lib/models/TeacherPerformance";
import SeniorTeacherLeave from "@/lib/models/SeniorTeacherLeave";
import TeacherAttendance from "@/lib/models/TeacherAttendance";
import { SENIOR_TEACHER_SESSION_COOKIE } from "@/lib/auth/portal-session";
import { SeniorTeacherDashboardClient } from "@/components/senior-teacher/SeniorTeacherDashboardClient";

export default async function SeniorTeacherDashboardPage() {
  const cookieStore = await cookies();
  const seniorTeacherId = cookieStore.get(SENIOR_TEACHER_SESSION_COOKIE)?.value;

  if (!seniorTeacherId || !mongoose.Types.ObjectId.isValid(seniorTeacherId)) {
    redirect("/login/senior-teacher");
  }

  await dbConnect();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch Senior Teacher
  const seniorTeacher = await SeniorTeacher.findById(seniorTeacherId).lean();
  if (!seniorTeacher) redirect("/login/senior-teacher");

  // Fetch related data concurrently
  const [
    teachers,
    batches,
    students,
    attendanceList,
    leaves,
    drawingTasks,
    evaluations,
    notifications,
    certificates,
    queries,
    performances,
    leaveBalances,
    seniorTeacherLeaves,
    myAttendances
  ] = await Promise.all([
    Teacher.find({ createdBy: seniorTeacherId }).lean(),
    Batch.find({ createdBy: seniorTeacherId }).lean(),
    Student.find({ createdBy: seniorTeacherId }).lean(),
    TeacherStudentAttendance.find({ seniorTeacherId: seniorTeacherId }).lean(),
    Leave.find().lean(), // Ideally filtered by seniorTeacher's teachers, we'll filter in JS
    DrawingTask.find({ createdBy: seniorTeacherId }).lean(),
    StudentEvaluation.find({ seniorTeacherId: seniorTeacherId }).lean(),
    Notification.find({ "recipients.userId": seniorTeacherId }).lean(),
    Certificate.find({ issuedBy: seniorTeacherId }).lean(),
    Query.find().lean(),
    TeacherPerformance.find().lean(),
    TeacherLeaveBalance.find().lean(),
    SeniorTeacherLeave.find({ seniorTeacherId }).lean(),
    TeacherAttendance.find({ teacherId: seniorTeacherId }).lean(),
  ]);

  const teacherIds = teachers.map(t => t._id.toString());
  
  // Filter leaves, queries, etc., by the teachers this senior teacher manages
  const filteredLeaves = leaves.filter(l => l.teacherId && teacherIds.includes(l.teacherId.toString()));
  const filteredPerformances = performances.filter(p => p.teacherId && teacherIds.includes(p.teacherId.toString()));
  const filteredLeaveBalances = leaveBalances.filter(l => l.teacherId && teacherIds.includes(l.teacherId.toString()));
  const pendingQueries = queries.filter(q => q.status === "pending" || q.category === "switch_batch");

  const data = JSON.parse(JSON.stringify({
    seniorTeacher,
    teachers,
    batches,
    students,
    attendanceList,
    leaves: filteredLeaves,
    drawingTasks,
    evaluations,
    notifications,
    certificates,
    queries: pendingQueries,
    performances: filteredPerformances,
    leaveBalances: filteredLeaveBalances,
    seniorTeacherLeaves,
    myAttendances
  }));

  return <SeniorTeacherDashboardClient data={data} />;
}

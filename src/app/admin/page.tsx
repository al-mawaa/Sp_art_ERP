import dbConnect from "@/lib/mongodb";
import Student from "@/lib/models/Student";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import Course from "@/lib/models/Course";
import Batch from "@/lib/models/Batch";
import TeacherStudentAttendance from "@/lib/models/TeacherStudentAttendance";
import TeacherAttendance from "@/lib/models/TeacherAttendance";
import EnrollmentPaymentRecord from "@/lib/models/EnrollmentPaymentRecord";
import OfflinePayment from "@/lib/models/OfflinePayment";
import PayrollRun from "@/lib/models/PayrollRun";
import Notification from "@/lib/models/Notification";
import StudentFeedback from "@/lib/models/StudentFeedback";
import Query from "@/lib/models/Query";
import Certificate from "@/lib/models/Certificate";
import Leave from "@/lib/models/Leave";
import SeniorTeacherLeave from "@/lib/models/SeniorTeacherLeave";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    students,
    teachers,
    seniorTeachers,
    enrollments,
    courses,
    batches,
    studentAttendance,
    teacherAttendance,
    onlinePayments,
    offlinePayments,
    payrollRuns,
    notifications,
    feedbacks,
    queries,
    certificates,
    leaves,
    stLeaves,
  ] = await Promise.all([
    Student.find().lean(),
    Teacher.find().lean(),
    SeniorTeacher.find().lean(),
    CourseEnrollment.find().lean(),
    Course.find().lean(),
    Batch.find().lean(),
    TeacherStudentAttendance.find({ attendanceDate: { $gte: today.toISOString().split('T')[0] } }).lean(),
    TeacherAttendance.find({ attendanceDate: { $gte: today.toISOString().split('T')[0] } }).lean(),
    EnrollmentPaymentRecord.find().lean(),
    OfflinePayment.find().lean(),
    PayrollRun.find().lean(),
    Notification.find().sort({ createdAt: -1 }).limit(20).lean(),
    StudentFeedback.find().sort({ createdAt: -1 }).limit(10).lean(),
    Query.find().lean(),
    Certificate.find().lean(),
    Leave.find().lean(),
    SeniorTeacherLeave.find().lean(),
  ]);

  const data = JSON.parse(
    JSON.stringify({
      students,
      teachers,
      seniorTeachers,
      enrollments,
      courses,
      batches,
      studentAttendance,
      teacherAttendance,
      onlinePayments,
      offlinePayments,
      payrollRuns,
      notifications,
      feedbacks,
      queries,
      certificates,
      leaves,
      stLeaves,
    })
  );

  return <AdminDashboardClient data={data} />;
}

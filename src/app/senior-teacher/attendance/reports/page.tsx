import { AttendanceReportsPage } from "@/components/attendance/AttendanceReportsPage";

export default function SeniorTeacherStudentAttendanceReportsPage() {
  return (
    <AttendanceReportsPage
      portal="senior"
      title="Student attendance reports"
      subtitle="View batch and student attendance marked by your teachers."
    />
  );
}

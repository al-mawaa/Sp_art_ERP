import { AttendanceReportsPage } from "@/components/attendance/AttendanceReportsPage";

export default function AdminStudentAttendanceAnalyticsPage() {
  return (
    <AttendanceReportsPage
      portal="admin"
      title="Attendance analytics"
      subtitle="Global attendance reports across all batches and teachers."
    />
  );
}

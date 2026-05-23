import { AdminStaffAttendanceReportPage } from "@/components/attendance/AdminStaffAttendanceReportPage";

export default function AdminTeacherAttendanceReportPage() {
  return (
    <AdminStaffAttendanceReportPage
      role="teacher"
      title="Teacher Attendance Report"
      staffColumnLabel="Teacher"
    />
  );
}

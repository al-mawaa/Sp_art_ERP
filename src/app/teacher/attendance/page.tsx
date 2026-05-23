"use client";

import { StaffSelfAttendancePage } from "@/components/attendance/StaffSelfAttendancePage";

export default function TeacherSelfAttendancePage() {
  return (
    <StaffSelfAttendancePage
      apiPath="/api/teacher/self-attendance"
      roleLabel="teacher"
      title="My Attendance"
      subtitle="Mark your attendance for assigned batches (today or future dates only)."
      studentAttendanceHref="/teacher/student-attendance"
    />
  );
}

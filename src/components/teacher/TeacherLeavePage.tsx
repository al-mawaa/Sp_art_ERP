"use client";

import { LeaveApplyPage } from "@/components/leave/LeaveApplyPage";

export function TeacherLeavePage() {
  return (
    <LeaveApplyPage
      apiPath="/api/teacher/leaves"
      loginRoleLabel="Teacher"
    />
  );
}

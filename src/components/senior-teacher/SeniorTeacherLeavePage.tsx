"use client";

import { LeaveApplyPage } from "@/components/leave/LeaveApplyPage";

export function SeniorTeacherLeavePage() {
  return (
    <LeaveApplyPage
      apiPath="/api/senior-teacher/leaves"
      loginRoleLabel="Senior Teacher"
    />
  );
}

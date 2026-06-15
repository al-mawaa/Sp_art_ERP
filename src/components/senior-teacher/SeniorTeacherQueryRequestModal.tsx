"use client";

import { QueryRequestModal } from "@/components/queries/QueryRequestModal";

export function SeniorTeacherQueryRequestModal({
  open,
  onOpenChange,
  defaultName,
  defaultEmail,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  defaultEmail: string;
  onSubmitted: () => void;
}) {
  return (
    <QueryRequestModal
      open={open}
      onOpenChange={onOpenChange}
      defaultName={defaultName}
      defaultEmail={defaultEmail}
      nameField="seniorTeacherName"
      emailField="seniorTeacherEmail"
      apiUrl="/api/senior-teacher/queries"
      onSubmitted={onSubmitted}
    />
  );
}

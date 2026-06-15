"use client";

import { QueryRequestModal } from "@/components/queries/QueryRequestModal";

export function TeacherQueryRequestModal({
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
      nameField="teacherName"
      emailField="teacherEmail"
      apiUrl="/api/teacher/queries"
      onSubmitted={onSubmitted}
    />
  );
}

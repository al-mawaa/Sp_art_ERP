"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Attendance is marked from Batches (same flow as teachers). */
export default function SeniorTeacherAttendanceRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/senior-teacher/batches");
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Redirecting to batches…
    </div>
  );
}

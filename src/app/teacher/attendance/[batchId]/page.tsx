import { redirect } from "next/navigation";

type Props = { params: Promise<{ batchId: string }> };

/** Legacy URL — student attendance moved under /teacher/student-attendance */
export default async function LegacyTeacherAttendanceBatchPage({ params }: Props) {
  const { batchId } = await params;
  redirect(`/teacher/student-attendance/${batchId}`);
}

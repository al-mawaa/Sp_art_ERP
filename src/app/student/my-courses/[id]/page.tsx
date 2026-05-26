import { StudentCourseDetailPage } from "@/components/student/StudentCourseDetailPage";

export default async function StudentMyCourseDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentCourseDetailPage batchId={id} backHref="/student/my-courses" backLabel="My Courses" />;
}

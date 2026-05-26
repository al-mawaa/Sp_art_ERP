import { redirect } from "next/navigation";

export default async function StudentCourseDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/student/my-courses/${id}`);
}

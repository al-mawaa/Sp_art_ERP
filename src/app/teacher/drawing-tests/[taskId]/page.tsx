import { TeacherDrawingTests } from '@/pages/shared/DrawingTests';

type Props = { params: Promise<{ taskId: string }> };

export default async function TaskDetailsPage({ params }: Props) {
  const { taskId } = await params;
  return <TeacherDrawingTests taskId={taskId} />;
}

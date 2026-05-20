import { AdminBatchEditPage } from "@/components/senior-teacher/batches/AdminBatchEditPage";

type Props = { params: Promise<{ id: string }> };

export default async function BatchEditRoute({ params }: Props) {
  const { id } = await params;
  return <AdminBatchEditPage id={id} />;
}

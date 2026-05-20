"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BatchForm } from "@/components/senior-teacher/batches/BatchForm";
import type { SerializedBatch } from "@/lib/batch/types";
import { batchFetch } from "@/lib/batch/batchFetch";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminBatchEditPage({ id }: { id: string }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const [batch, setBatch] = useState<SerializedBatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (user && user.role !== "admin") {
      toast.error("Only an admin can edit batches");
      router.replace("/senior-teacher/batches");
    }
  }, [user, hydrated, router]);

  useEffect(() => {
    if (!hydrated || user?.role !== "admin") return;
    (async () => {
      try {
        const res = await batchFetch(`/api/senior-teacher/batches/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setBatch(json.data.batch);
      } catch (e) {
        toast.error((e as Error).message);
        router.push("/senior-teacher/batches");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, hydrated, user, router]);

  if (!hydrated || user?.role !== "admin") return null;
  if (loading || !batch) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full max-w-lg rounded-xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  return <BatchForm mode="edit" batchId={id} initial={batch} />;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BatchForm } from "@/components/senior-teacher/batches/BatchForm";

export function AdminBatchCreatePage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user && user.role !== "admin") {
      toast.error("Only an admin can create batches");
      router.replace("/senior-teacher/batches");
    }
  }, [user, hydrated, router]);

  if (!hydrated || user?.role !== "admin") return null;

  return <BatchForm mode="create" />;
}

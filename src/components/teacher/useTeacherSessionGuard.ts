"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/** Ensures teacher_session cookie exists (not just localStorage). */
export function useTeacherSessionGuard() {
  const router = useRouter();
  const { user, logout, hydrated } = useAuth();
  const [sessionOk, setSessionOk] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "teacher") {
      setChecking(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/teacher/session", { credentials: "include" });
        if (cancelled) return;
        if (res.status === 401) {
          logout();
          toast.error("Session expired. Please sign in again as Teacher.");
          router.replace("/login");
          return;
        }
        // Allow portal if session check fails for transient/server errors
        setSessionOk(res.ok || res.status >= 500);
      } catch {
        if (!cancelled) setSessionOk(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, user?.role, logout, router]);

  return { sessionOk, checking };
}

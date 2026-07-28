"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/** Ensures student session cookie exists (not just localStorage). */
export function useStudentSessionGuard() {
  const router = useRouter();
  const { user, logout, hydrated } = useAuth();
  const [sessionOk, setSessionOk] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "student") {
      setChecking(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/student/session", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 401) {
            logout();
            toast.error("Session expired. Please sign in again as Student.");
            router.replace("/student/login");
          } else {
            toast.error("Could not verify student session. Try again or sign in.");
          }
          setSessionOk(false);
          return;
        }
        setSessionOk(true);
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

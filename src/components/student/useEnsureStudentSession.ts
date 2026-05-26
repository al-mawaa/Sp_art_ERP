"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Student APIs require the httpOnly `student_session` cookie (set by POST /api/student/login).
 * AuthContext localStorage alone is not enough.
 */
export function useEnsureStudentSession() {
  const router = useRouter();
  const { user, logout, hydrated } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "student") {
      setReady(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/student/profile", { credentials: "include" });
        if (cancelled) return;

        if (res.ok) {
          setReady(true);
          return;
        }

        if (res.status === 401) {
          logout();
          toast.error("Session expired. Please sign in again as Student.");
          router.replace("/login");
          return;
        }

        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, user?.role, logout, router]);

  return { ready: user?.role !== "student" || ready };
}

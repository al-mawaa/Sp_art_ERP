"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminSessionAuthHeaders,
  clearAdminSessionToken,
  setAdminSessionToken,
} from "@/lib/auth/admin-session-client";
import { toast } from "sonner";

/** Sync admin API session (cookie + sessionStorage token) before admin pages call batchFetch. */
export function useEnsureAdminSession() {
  const router = useRouter();
  const { user, logout, hydrated } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "admin") {
      setReady(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
          headers: adminSessionAuthHeaders(),
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: { authenticated?: boolean; token?: string };
        };

        if (cancelled) return;

        if (json.data?.authenticated) {
          if (json.data.token) setAdminSessionToken(json.data.token);
          setReady(true);
          return;
        }

        clearAdminSessionToken();
        logout();
        toast.error("Admin session expired. Please sign in again.");
        router.replace("/login");
      } catch {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, user?.role, logout, router]);

  return { ready: user?.role !== "admin" || ready };
}

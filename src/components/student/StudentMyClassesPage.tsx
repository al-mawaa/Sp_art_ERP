"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { messageFromUnknown } from "@/lib/errors/messageFromUnknown";
import { toast } from "sonner";

type StudentClassCard = {
  id: string;
  batchTime: string;
  batchName: string;
  courseName: string;
  batchDays: string;
  teachers: string;
  seniorTeachers: string;
  branch: string;
};

function parseTeachers(teachers: string): string[] {
  return teachers
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
}

export function StudentMyClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<StudentClassCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState<StudentClassCard | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/student/classes", {
          credentials: "include",
          signal: controller.signal,
        });

        if (cancelled) return;

        if (res.status === 401) {
          toast.error("Please sign in again as Student.");
          router.push("/login");
          return;
        }

        const json = await parseJsonResponse<{
          error?: string;
          data?: { classes: StudentClassCard[] };
        }>(res);

        if (!res.ok) throw new Error(json.error || "Failed to load classes");

        setClasses(json.data?.classes ?? []);
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === "AbortError")) return;
        toast.error(messageFromUnknown(e, "Failed to load classes"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Classes" subtitle="Your weekly schedule" />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-soft p-4 space-y-3">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1 rounded-xl" />
                <Skeleton className="h-9 flex-1 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="card-soft p-8 text-center">
          <p className="text-sm text-muted-foreground">No classes assigned yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => {
            const teacherList = parseTeachers(c.teachers);
            return (
              <div
                key={c.id}
                className="card-soft p-4 flex flex-col gap-3 h-full"
              >
                <div className="rounded-lg gradient-mint text-white px-3 py-1.5 font-bold text-sm w-fit">
                  {c.batchTime || "—"}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <h3 className="font-display font-bold text-base leading-tight">{c.batchName}</h3>
                  {c.courseName ? (
                    <p className="text-xs text-muted-foreground">{c.courseName}</p>
                  ) : null}
                  {c.batchDays ? (
                    <p className="text-xs text-muted-foreground">{c.batchDays}</p>
                  ) : null}
                  {c.branch ? (
                    <p className="text-xs text-muted-foreground">Branch: {c.branch}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Teachers</span>
                  {teacherList.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {teacherList.map(name => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-1 text-xs font-medium w-fit max-w-full"
                        >
                          <Avatar name={name} size={20} />
                          <span className="truncate">{name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No teacher assigned</p>
                  )}
                </div>

                {c.seniorTeachers && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Senior Teacher</span>
                    <div className="flex flex-col gap-1.5">
                      {parseTeachers(c.seniorTeachers).map(name => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs font-medium w-fit max-w-full"
                        >
                          <Avatar name={name} size={20} />
                          <span className="truncate">{name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1 mt-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl flex-1"
                    onClick={() => setDetailOpen(c)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Show
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl gradient-primary text-white border-0 flex-1"
                    onClick={() => router.push("/student/dashboard")}
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Home
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(detailOpen)} onOpenChange={open => !open && setDetailOpen(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{detailOpen?.batchName}</DialogTitle>
          </DialogHeader>
          {detailOpen ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{detailOpen.batchTime || "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium text-right">{detailOpen.courseName || "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Days</span>
                <span className="font-medium text-right">{detailOpen.batchDays || "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Branch</span>
                <span className="font-medium">{detailOpen.branch || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-2">Teachers</span>
                <div className="flex flex-wrap gap-2">
                  {parseTeachers(detailOpen.teachers).length > 0 ? (
                    parseTeachers(detailOpen.teachers).map(name => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium"
                      >
                        <Avatar name={name} size={22} />
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>

              {detailOpen.seniorTeachers && (
                <div>
                  <span className="text-muted-foreground block mb-2">Senior Teacher</span>
                  <div className="flex flex-wrap gap-2">
                    {parseTeachers(detailOpen.seniorTeachers).map(name => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-medium"
                      >
                        <Avatar name={name} size={22} />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

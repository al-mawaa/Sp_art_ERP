"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Download, Users, Calendar, MapPin, BookOpen, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import type { SerializedBatch } from "@/lib/batch/types";
import { openBatchPrintExport } from "@/lib/batch/printBatchExport";
import { batchFetch } from "@/lib/batch/batchFetch";
import { useBatchRoutes } from "@/lib/batch/useBatchRoutes";
import { canManageBatches } from "@/lib/batch/permissions";
import { messageFromUnknown } from "@/lib/errors/messageFromUnknown";
import { BatchTeacherAttendancePanel } from "@/components/attendance/BatchTeacherAttendancePanel";

type BatchDetailPageProps = {
  id: string;
  /** Teacher portal: read-only, uses /api/teacher/batches */
  readOnly?: boolean;
  listHref?: string;
};

export function BatchDetailPage({ id, readOnly = false, listHref }: BatchDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const routes = useBatchRoutes();
  const backList = listHref ?? routes.list;
  const canWrite = !readOnly && canManageBatches(user?.role);
  const [batch, setBatch] = useState<SerializedBatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const url = readOnly ? `/api/teacher/batches/${id}` : `/api/senior-teacher/batches/${id}`;
        const res = readOnly
          ? await fetch(url, { credentials: "include" })
          : await batchFetch(url);
        const json = await res.json();
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error(json.error || "Not found");
        setBatch(json.data.batch);
      } catch (e) {
        toast.error(messageFromUnknown(e, "Failed to load batch"));
        router.push(backList);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router, readOnly, backList]);

  if (loading || !batch) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const timing = batch.batchTiming || `${batch.batchDay} · ${batch.batchTime}`;

  return (
    <div className="space-y-6 w-full px-4">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl shrink-0" asChild>
            <Link href={backList}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">
                {batch.batchName}
              </h1>
              <Badge
                className={`text-xs font-medium ${
                  (batch.batchStatus || "Active") === "Active"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                    : (batch.batchStatus || "") === "Completed"
                      ? "bg-blue-50 text-blue-800 border border-blue-100"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {batch.batchStatus || "Active"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{batch.courseName} · {timing}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            type="button"
            onClick={() => {
              if (!openBatchPrintExport(batch)) toast.error("Allow pop-ups to export");
              else toast.message("Choose “Save as PDF” in the print dialog");
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          {canWrite && (
            <Button asChild className="rounded-xl gradient-primary text-white border-0">
              <Link href={routes.edit(batch.id)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid w-full gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Course"
              value={batch.courseName}
              icon={BookOpen}
              tone="primary"
            />
            <StatCard
              label="Schedule"
              value={timing}
              icon={Calendar}
              tone="secondary"
            />
            {(batch.startMonth || batch.endMonth) && (
              <StatCard
                label="Run period"
                value={`${batch.startMonth || "Not set"} → ${batch.endMonth || "Not set"}`}
                icon={Calendar}
                tone="info"
              />
            )}
            <StatCard
              label="Branch"
              value={batch.branch || "Not set"}
              icon={MapPin}
              tone="accent"
            />
            <StatCard
              label="Capacity"
              value={batch.batchCapacity}
              icon={Users}
              tone="success"
            />
            <StatCard
              label="Students"
              value={batch.totalStudents}
              icon={Users}
              tone="primary"
            />
          </div>
          {batch.description && (
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{batch.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="min-h-full rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Teacher attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BatchTeacherAttendancePanel batchId={batch.id} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Teachers ({(batch.teachers || []).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(batch.teachers || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers assigned.</p>
          ) : (
            <div className="space-y-3">
              {(batch.teachers || []).map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {t.fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(batch.seniorTeachers || []).length > 0 && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Senior Teachers ({(batch.seniorTeachers || []).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(batch.seniorTeachers || []).map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-amber-100 text-amber-800 text-sm font-medium">
                      {t.fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-x-auto">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Students ({batch.totalStudents})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-muted-foreground">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2">Name</th>
                <th className="pb-2 pr-2">Email</th>
                <th className="pb-2 pr-2">Phone</th>
                <th className="pb-2">Course</th>
              </tr>
            </thead>
            <tbody>
              {batch.students.map((s, i) => (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="py-2 pr-2">{i + 1}</td>
                  <td className="py-2 pr-2 font-medium">{s.studentName}</td>
                  <td className="py-2 pr-2 text-muted-foreground">{s.studentEmail || "—"}</td>
                  <td className="py-2 pr-2">{s.phone || "—"}</td>
                  <td className="py-2">{s.course || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

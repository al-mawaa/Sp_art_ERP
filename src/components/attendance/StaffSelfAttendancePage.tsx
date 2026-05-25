"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, ClipboardCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { messageFromUnknown } from "@/lib/errors/messageFromUnknown";
import { isDateBeforeToday, PAST_DATE_MESSAGE, todayDateString } from "@/lib/leave/dateValidation";

type BatchOption = {
  id: string;
  batchName: string;
  courseName: string;
  batchTiming: string;
  totalStudents: number;
};

type AttendanceRecord = {
  id: string;
  attendanceStatus: string;
  remarks: string;
  attendanceDate: string;
};

export type StaffSelfAttendanceConfig = {
  apiPath: string;
  roleLabel: string;
  title: string;
  subtitle: string;
  /** Optional link to mark student attendance (teachers only) */
  studentAttendanceHref?: string;
};

const STATUS_OPTIONS = ["Present", "Absent", "Half Day"] as const;

function statusPillClass(status: string) {
  if (status === "Present") return "bg-success-soft text-success";
  if (status === "Half Day") return "bg-warning-soft text-warning";
  if (status === "Absent") return "bg-destructive-soft text-destructive";
  return "bg-muted text-muted-foreground";
}

export function StaffSelfAttendancePage({
  apiPath,
  roleLabel,
  title,
  subtitle,
  studentAttendanceHref,
}: StaffSelfAttendanceConfig) {
  const minDate = todayDateString();
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [batchId, setBatchId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(minDate);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("Present");
  const [remarks, setRemarks] = useState("");
  const [existing, setExisting] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const loadBatches = useCallback(async () => {
    const res = await fetch(apiPath, { credentials: "include" });
    const json = await parseJsonResponse<{
      success?: boolean;
      error?: string;
      data?: { batches: BatchOption[] };
    }>(res);
    if (!res.ok) throw new Error(json.error || "Failed to load batches");
    const list = json.data?.batches ?? [];
    setBatches(list);
    setBatchId(prev => prev || list[0]?.id || "");
  }, [apiPath]);

  const loadRecord = useCallback(async () => {
    if (!batchId || !attendanceDate) return;
    setLoadingRecord(true);
    try {
      const params = new URLSearchParams({ batchId, date: attendanceDate });
      const res = await fetch(`${apiPath}?${params}`, { credentials: "include" });
      const json = await parseJsonResponse<{
        error?: string;
        data?: { record: AttendanceRecord | null };
      }>(res);
      if (!res.ok) throw new Error(json.error || "Failed to load record");
      const rec = json.data?.record ?? null;
      setExisting(rec);
      if (rec) {
        setStatus(rec.attendanceStatus as (typeof STATUS_OPTIONS)[number]);
        setRemarks(rec.remarks ?? "");
      }
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to load attendance"));
    } finally {
      setLoadingRecord(false);
    }
  }, [apiPath, batchId, attendanceDate]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadBatches();
      } catch (e) {
        toast.error(messageFromUnknown(e, "Failed to load batches"));
      } finally {
        setLoading(false);
      }
    })();
  }, [loadBatches]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const onDateChange = (value: string) => {
    if (isDateBeforeToday(value)) {
      toast.error(PAST_DATE_MESSAGE);
      return;
    }
    setAttendanceDate(value);
    if (!existing) {
      setStatus("Present");
      setRemarks("");
    }
  };

  const handleSubmit = async () => {
    if (submitLockRef.current || submitting) return;
    if (!batchId) {
      toast.error("Please select a batch");
      return;
    }
    if (isDateBeforeToday(attendanceDate)) {
      toast.error(PAST_DATE_MESSAGE);
      return;
    }
    if (existing) {
      toast.error("Attendance already submitted for this batch and date");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, attendanceDate, status, remarks }),
      });
      const json = await parseJsonResponse<{ error?: string; message?: string }>(res);
      if (res.status === 409) {
        toast.error(json.error || "Attendance already submitted");
        await loadRecord();
        return;
      }
      if (!res.ok) throw new Error(json.error || "Failed to save attendance");
      toast.success(json.message || "Attendance saved");
      await loadRecord();
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to save attendance"));
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const selectedBatch = batches.find(b => b.id === batchId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          studentAttendanceHref ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={studentAttendanceHref}>
                <Users className="mr-2 h-4 w-4" />
                Student attendance
              </Link>
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      ) : batches.length === 0 ? (
        <Card className="rounded-3xl border border-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No batches assigned to your {roleLabel} account.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Assigned batches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{batches.length}</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Selected batch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold truncate">{selectedBatch?.batchName ?? "—"}</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                {existing ? (
                  <StatusPill status={existing.attendanceStatus} className={statusPillClass(existing.attendanceStatus)} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not marked yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Mark my attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Batch</Label>
                  <Select value={batchId} onValueChange={setBatchId} disabled={!!existing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.batchName} · {b.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-date">Attendance date</Label>
                  <Input
                    id="attendance-date"
                    type="date"
                    min={minDate}
                    value={attendanceDate}
                    onChange={e => onDateChange(e.target.value)}
                    disabled={!!existing}
                  />
                  <p className="text-xs text-muted-foreground">Today or future dates only</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={v => setStatus(v as (typeof STATUS_OPTIONS)[number])}
                    disabled={!!existing || loadingRecord}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Optional notes"
                    rows={3}
                    disabled={!!existing || loadingRecord}
                  />
                </div>
              </div>

              {loadingRecord ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking existing record…
                </div>
              ) : existing ? (
                <p className="text-sm text-muted-foreground rounded-xl bg-muted/40 px-4 py-3">
                  Attendance already submitted for this batch on {existing.attendanceDate}.
                </p>
              ) : null}

              <Button
                onClick={handleSubmit}
                disabled={submitting || !!existing || loadingRecord || !batchId}
                className="rounded-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Submit attendance"
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

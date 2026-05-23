"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BatchReportStudent {
  _id: string;
  studentName: string;
  studentEmail: string;
  presentCount: number;
  absentCount: number;
}

interface BatchReportData {
  _id: string;
  batchName: string;
  courseName: string;
  batchDay: string;
  batchTime: string;
  students: BatchReportStudent[];
}

export default function AttendanceReportPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const batchId = Array.isArray(params?.batchId) ? params?.batchId[0] : params?.batchId;
  const [batch, setBatch] = useState<BatchReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teacher/attendance-report/${batchId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Unable to load attendance report.");
        }

        const data = await response.json();
        setBatch(data.batch || null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load attendance report.";
        console.error(message);
        toast({
          title: "Unable to load report",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [batchId, toast]);

  const summary = useMemo(() => {
    if (!batch) return { totalStudents: 0, totalPresent: 0, totalAbsent: 0, attendanceRate: 0 };

    const totalPresent = batch.students.reduce((acc, student) => acc + student.presentCount, 0);
    const totalAbsent = batch.students.reduce((acc, student) => acc + student.absentCount, 0);
    const totalSessions = totalPresent + totalAbsent;
    const attendanceRate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    return {
      totalStudents: batch.students.length,
      totalPresent,
      totalAbsent,
      attendanceRate,
    };
  }, [batch]);

  if (!batchId) {
    return <div className="p-4">Batch ID is missing.</div>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading attendance report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Attendance Report</p>
          <h1 className="text-3xl font-semibold tracking-tight">{batch?.batchName}</h1>
        </div>
        <Button variant="ghost" onClick={() => router.push("/teacher/attendance") }>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Attendance
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-[28px] border border-border bg-white shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="text-2xl font-semibold">Batch Details</h2>
              <p className="mt-2 text-sm text-muted-foreground">Review student attendance summary for this batch.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Course</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{batch?.courseName}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Schedule</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{batch?.batchDay} · {batch?.batchTime}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total students</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{summary.totalStudents}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Attendance rate</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{summary.attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[28px] border border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Report Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-emerald-50 p-4 text-center min-h-[110px]">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground whitespace-normal break-words">Present</p>
                  <p className="mt-3 text-3xl font-semibold text-emerald-700">{summary.totalPresent}</p>
                </div>
                <div className="rounded-3xl bg-rose-50 p-4 text-center min-h-[110px]">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground whitespace-normal break-words">Absent</p>
                  <p className="mt-3 text-3xl font-semibold text-rose-700">{summary.totalAbsent}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-center min-h-[110px]">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground whitespace-normal break-words">Students</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[28px] border border-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Student Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-[30%] px-6 py-4 text-left font-semibold tracking-[0.02em] text-slate-500">Student Name</th>
                  <th className="w-[50%] px-6 py-4 text-left font-semibold tracking-[0.02em] text-slate-500">Email</th>
                  <th className="w-[20%] px-6 py-4 text-right font-semibold tracking-[0.02em] text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {batch?.students.length ? (
                  batch.students.map((student) => (
                    <tr key={student._id} className="border-b border-slate-200 bg-white transition hover:bg-slate-50">
                      <td className="px-6 py-4 align-middle">
                        <div className="font-medium text-slate-900">{student.studentName}</div>
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-slate-600">{student.studentEmail || "—"}</td>
                      <td className="px-6 py-4 align-middle text-right">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/teacher/attendance/student/${student._id}?batchId=${batchId}`)}
                          className="rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-2 text-white shadow-md hover:scale-[1.01] transition-transform"
                        >
                          Preview Report
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No students found for this batch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

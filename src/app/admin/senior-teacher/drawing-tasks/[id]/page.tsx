"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@/components/shared/StatusPill";
import { ArrowLeft, Users, CheckCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Student {
  submissionId: string;
  studentId: string;
  studentName: string;
  teacherName: string;
  submissionDate: string;
  status: "Evaluated" | "Pending";
}

interface TaskDetail {
  id: string;
  taskName: string;
  taskDate: string;
  batch: {
    id: string;
    name: string;
    course: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
  };
}

interface Summary {
  totalStudents: number;
  evaluatedStudents: number;
  pendingStudents: number;
}

interface TeacherPerformance {
  averagePerformance: number;
  totalStudentsEvaluated: number;
  incentiveEligible: boolean;
  incentivePercentage: number;
  lastEvaluatedAt: string | null;
  lastUpdatedAt: string | null;
}

const PAGE_SIZE = 10;

export default function TaskDetailPage({ basePath = "/admin/senior-teacher" }: { basePath?: string }) {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const loadTaskDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/senior-teacher/drawing-tasks/${taskId}`, {
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json.data) {
        setTask(json.data.task);
        setStudents(json.data.students);
        setSummary(json.data.summary);
        setTeacherPerformance(json.data.teacherPerformance ?? null);
      }
    } catch (e) {
      console.error("Failed to load task details", e);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    loadTaskDetails();
  }, [taskId, loadTaskDetails]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter(student => {
      const matchesQuery =
        !query ||
        student.studentName.toLowerCase().includes(query) ||
        student.teacherName.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const avgStudentPerformance = useMemo(() => {
    const vals = students
      .map(s => s.performancePercentage)
      .filter((v): v is number => v !== null && v !== undefined);
    if (!vals.length) return null;
    const sum = vals.reduce((a, b) => a + Number(b), 0);
    return sum / vals.length;
  }, [students]);

  function downloadCSV() {
    const header = ["Student Name", "Teacher Name", "Batch", "Submission Date", "Status"];
    const rows = filteredStudents.map(student => [
      student.studentName,
      student.teacherName,
      task?.batch.name ?? "",
      new Date(student.submissionDate).toLocaleDateString(),
      student.status,
    ]);
    const csv = [header, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${task?.taskName ?? "drawing-task"}-students.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`Drawing Task: ${task?.taskName ?? "Task"}`, 14, 16);
    doc.setFontSize(10);
    const headers = ["Student Name", "Teacher Name", "Batch", "Submission", "Status"];
    const rows = filteredStudents.slice(0, 20).map(student => [
      student.studentName,
      student.teacherName,
      task?.batch.name ?? "",
      new Date(student.submissionDate).toLocaleDateString(),
      student.status,
    ]);
    const startY = 24;
    const colWidths = [60, 50, 50, 40, 30];
    let y = startY;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 6, colWidths.reduce((sum, w) => sum + w, 0), 8, "F");
    headers.forEach((header, index) => {
      doc.text(header, 16 + colWidths.slice(0, index).reduce((sum, w) => sum + w, 0), y);
    });
    rows.forEach(row => {
      y += 7;
      if (y > 190) return;
      row.forEach((cell, index) => {
        doc.text(String(cell), 16 + colWidths.slice(0, index).reduce((sum, w) => sum + w, 0), y);
      });
    });
    doc.save(`${task?.taskName ?? "drawing-task"}-students.pdf`);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." subtitle="Fetching task details..." />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <PageHeader title="Task Not Found" subtitle="The task you're looking for doesn't exist." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`${basePath}/drawing-tasks`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title={task.taskName}
        subtitle={`${task.batch.name} · ${task.batch.course} · ${task.teacher.name}`}
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">Task Name</div>
            <div className="font-semibold">{task.taskName}</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">Task Date</div>
            <div className="font-semibold">{new Date(task.taskDate).toLocaleDateString()}</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">Student Performance</div>
            <div className="font-semibold">{avgStudentPerformance !== null ? `${avgStudentPerformance.toFixed(1)}%` : '—'}</div>
            <div className="text-xs text-muted-foreground mt-1">{students.filter(s => s.performancePercentage !== null && s.performancePercentage !== undefined).length} evaluations</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">Teacher Name</div>
            <div className="font-semibold">{task.teacher.name}</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">Teacher Performance</div>
            <div className="font-semibold">
              {teacherPerformance ? `${teacherPerformance.averagePerformance}%` : '0%'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {teacherPerformance ? `${teacherPerformance.totalStudentsEvaluated} evaluations` : 'No evaluations yet'}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search student"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="min-w-[240px]"
            />
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <select
                className="bg-transparent outline-none text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Evaluated">Evaluated</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
            <Button size="sm" variant="outline" onClick={downloadCSV}>
              Export Excel
            </Button>
            <Button size="sm" variant="outline" onClick={downloadPDF}>
              Export PDF
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Teacher Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No students match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map(student => (
                  <TableRow key={student.submissionId} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{student.studentName}</TableCell>
                    <TableCell>{student.teacherName}</TableCell>
                    <TableCell>{task.batch.name}</TableCell>
                    <TableCell>{new Date(student.submissionDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <StatusPill status={student.status} />
                    </TableCell>
                    <TableCell>
                      <Link href={`${basePath}/drawing-tasks/${taskId}/evaluate/${student.submissionId}`}>
                        <Button size="sm" variant="outline">Open Student Task</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedStudents.length} of {filteredStudents.length} students
          </p>
          <div className="inline-flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">Page {page} of {totalPages || 1}</span>
            <Button size="sm" variant="outline" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

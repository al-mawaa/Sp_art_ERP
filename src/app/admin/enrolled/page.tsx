"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Eye,
  Loader2,
  AlertCircle,
  Download,
  Bell,
  Filter,
  Search,
  IndianRupee,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  PaymentStatusBadge,
  PaymentModeBadge,
} from "@/components/student/PaymentStatusBadge";
import {
  getEnrollmentPaymentMode,
  filterCoursesByPaymentMode,
  type StudentPaymentMode,
} from "@/components/student/payment-status-utils";
import { PaymentProgressBar } from "@/components/student/PaymentProgressBar";

interface InstallmentRow {
  installmentId: string;
  termNo: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  paymentStatus: string;
}

interface PaymentHistoryRow {
  transactionId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  status: string;
  orderId: string;
  termNo: number;
}

interface Enrollment {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentBadgeId?: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  courseDuration?: number;
  courseFee?: number;
  batchName?: string;
  enrollmentDate: string;
  status: "active" | "completed" | "dropped";
  completionPercentage: number;
  paymentType?: string;
  baseAmount?: number;
  gstAmount?: number;
  installmentCharge?: number;
  referralDiscount?: number;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  amount?: number;
  paymentStatus?: string;
  paymentPlanStatus?: string;
  totalInstallments?: number;
  paidInstallments?: number;
  pendingInstallments?: number;
  installments?: InstallmentRow[];
  paymentHistory?: PaymentHistoryRow[];
}

interface StudentEnrollments {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentBadgeId: string;
  courseCount: number;
  courses: Enrollment[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalInstallments: number;
  pendingInstallments: number;
  earliestEnrollmentDate: string;
  overallStatus: string;
}

interface EnrollmentRow {
  student: StudentEnrollments;
  enrollment: Enrollment;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getOverallPaymentStatus(courses: Enrollment[]): string {
  const statuses = courses.map(
    (c) => (c.paymentPlanStatus ?? c.paymentStatus ?? "pending").toLowerCase(),
  );
  if (statuses.every((s) => s === "paid")) return "paid";
  if (statuses.some((s) => s === "overdue")) return "overdue";
  if (statuses.some((s) => s === "partially_paid")) return "partially_paid";
  return "pending";
}

export default function EnrolledPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollments[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "overdue">("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState<"all" | StudentPaymentMode>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const query = filter === "all" ? "" : `?filter=${filter}`;
      const res = await fetch(`/api/admin/enrollments${query}`, { credentials: "include" });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        const errorMsg = data?.details || data?.error || "Failed to fetch enrollments";
        console.error("API Error:", { status: res.status, error: errorMsg, data });
        throw new Error(errorMsg);
      }
      setEnrollments(data.enrollments);

      // Group enrollments by student
      const grouped = new Map<string, StudentEnrollments>();
      data.enrollments.forEach((enrollment: Enrollment) => {
        if (!grouped.has(enrollment.studentId)) {
          grouped.set(enrollment.studentId, {
            studentId: enrollment.studentId,
            studentName: enrollment.studentName,
            studentEmail: enrollment.studentEmail,
            studentBadgeId: enrollment.studentBadgeId ?? "",
            courseCount: 0,
            courses: [],
            totalAmount: 0,
            paidAmount: 0,
            remainingAmount: 0,
            totalInstallments: 0,
            pendingInstallments: 0,
            earliestEnrollmentDate: enrollment.enrollmentDate,
            overallStatus: "pending",
          });
        }
        const student = grouped.get(enrollment.studentId)!;
        student.courses.push(enrollment);
        student.courseCount = student.courses.length;
        student.totalAmount += enrollment.totalAmount ?? 0;
        student.paidAmount += enrollment.paidAmount ?? 0;
        student.remainingAmount += enrollment.remainingAmount ?? 0;
        student.totalInstallments += enrollment.totalInstallments ?? 0;
        student.pendingInstallments += enrollment.pendingInstallments ?? 0;
        // Track earliest enrollment date
        if (
          !student.earliestEnrollmentDate ||
          new Date(enrollment.enrollmentDate) < new Date(student.earliestEnrollmentDate)
        ) {
          student.earliestEnrollmentDate = enrollment.enrollmentDate;
        }
      });

      // Compute overall status for each student
      grouped.forEach((student) => {
        student.overallStatus = getOverallPaymentStatus(student.courses);
      });

      setStudentEnrollments(
        Array.from(grouped.values()).sort((a, b) =>
          a.studentName.localeCompare(b.studentName),
        ),
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load enrollments";
      console.error("Error fetching enrollments:", errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchEnrollments();
  }, [fetchEnrollments]);

  const handleViewCourses = (studentId: string) => {
    router.push(`/admin/enrolled/${studentId}`);
  };

  const handleDownloadReport = async () => {
    try {
      const res = await fetch("/api/admin/enrollments?action=report", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Report download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "enrollment-report.csv";
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Report downloaded" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const pendingCount = enrollments.filter((e) =>
    ["pending", "partially_paid", "overdue"].includes(e.paymentPlanStatus ?? e.paymentStatus ?? ""),
  ).length;
  const overdueCount = enrollments.filter(
    (e) => (e.paymentPlanStatus ?? "") === "overdue",
  ).length;

  // Compute aggregates for stats
  const totalRevenue = useMemo(
    () => enrollments.reduce((sum, e) => sum + (e.totalAmount ?? 0), 0),
    [enrollments],
  );
  const totalPaidAmount = useMemo(
    () => enrollments.reduce((sum, e) => sum + (e.paidAmount ?? 0), 0),
    [enrollments],
  );

  const filteredStudentEnrollments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return studentEnrollments.filter((student) => {
      if (!query) return true;
      return (
        student.studentName.toLowerCase().includes(query) ||
        student.studentEmail.toLowerCase().includes(query) ||
        student.studentBadgeId.toLowerCase().includes(query) ||
        student.courses.some(
          (c) =>
            c.courseTitle.toLowerCase().includes(query) ||
            c.courseCode.toLowerCase().includes(query),
        )
      );
    });
  }, [studentEnrollments, searchQuery]);

  const filteredEnrollmentRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const rows: EnrollmentRow[] = [];

    for (const student of studentEnrollments) {
      for (const enrollment of student.courses) {
        const mode = getEnrollmentPaymentMode(enrollment);
        if (paymentModeFilter !== "all" && mode !== paymentModeFilter) continue;

        if (query) {
          const matches =
            student.studentName.toLowerCase().includes(query) ||
            student.studentEmail.toLowerCase().includes(query) ||
            student.studentBadgeId.toLowerCase().includes(query) ||
            enrollment.courseTitle.toLowerCase().includes(query) ||
            enrollment.courseCode.toLowerCase().includes(query);
          if (!matches) continue;
        }

        rows.push({ student, enrollment });
      }
    }

    return rows.sort((a, b) => {
      const byName = a.student.studentName.localeCompare(b.student.studentName);
      if (byName !== 0) return byName;
      return a.enrollment.courseTitle.localeCompare(b.enrollment.courseTitle);
    });
  }, [studentEnrollments, searchQuery, paymentModeFilter]);

  const isCourseLevelView = paymentModeFilter !== "all";
  const visibleRowCount = isCourseLevelView
    ? filteredEnrollmentRows.length
    : filteredStudentEnrollments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrolled Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage enrollments, installments, and payment reminders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadReport} className="gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, ID, or course..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "overdue"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="gap-1"
            >
              <Filter className="h-3 w-3" />
              {f === "all" ? "All" : f === "pending" ? "Pending" : "Overdue"}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium text-muted-foreground self-center mr-1">
          Payment:
        </span>
        {(["all", "full", "partial"] as const).map((f) => (
          <Button
            key={f}
            type="button"
            size="sm"
            variant={paymentModeFilter === f ? "default" : "outline"}
            onClick={() => setPaymentModeFilter(f)}
            aria-pressed={paymentModeFilter === f}
          >
            {f === "all" ? "All Payments" : f === "full" ? "Full Payment" : "Partial Payment"}
          </Button>
        ))}
      </div>

      {paymentModeFilter !== "all" && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredEnrollmentRows.length}{" "}
          {paymentModeFilter === "full" ? "full payment" : "partial payment"} enrollment
          {filteredEnrollmentRows.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{studentEnrollments.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
              <p className="text-2xl font-bold">{enrollments.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">{formatInr(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-xl font-bold">{formatInr(totalPaidAmount)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading enrollments...</p>
            </div>
          </div>
        ) : visibleRowCount === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">
              {searchQuery || paymentModeFilter !== "all"
                ? "No enrollments match your search or filters"
                : "No enrollments found"}
            </p>
          </div>
        ) : isCourseLevelView ? (
          /* ─── Course-Level View ─── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Student Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Student ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Course</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Payment Mode</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Paid</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Remaining</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollmentRows.map(({ student, enrollment }, index) => (
                  <tr
                    key={enrollment.enrollmentId}
                    className={`border-b border-border ${
                      index % 2 === 0 ? "bg-muted/30" : ""
                    } hover:bg-muted/50 transition-colors`}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{student.studentName}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground font-mono">{student.studentBadgeId}</td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      <div className="font-medium">{enrollment.courseTitle}</div>
                      <div className="text-xs text-muted-foreground">{enrollment.courseCode}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <PaymentModeBadge mode={getEnrollmentPaymentMode(enrollment)} />
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold">{formatInr(enrollment.totalAmount ?? 0)}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-emerald-600">{formatInr(enrollment.paidAmount ?? 0)}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-red-600">{formatInr(enrollment.remainingAmount ?? 0)}</td>
                    <td className="px-4 py-4 text-center">
                      <PaymentStatusBadge status={enrollment.paymentPlanStatus ?? enrollment.paymentStatus} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCourses(student.studentId)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── Student-Grouped View ─── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Student Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Student ID</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Courses</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Total Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Paid Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Remaining</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Enrollment Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-foreground min-w-[260px]">Payment Breakdown</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudentEnrollments.map((student, index) => (
                  <tr
                    key={student.studentId}
                    className={`border-b border-border ${
                      index % 2 === 0 ? "bg-muted/30" : ""
                    } hover:bg-muted/50 transition-colors`}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-foreground align-top">
                      {student.studentName}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground font-mono align-top">
                      {student.studentBadgeId}
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                        {student.courseCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold align-top">
                      {formatInr(student.totalAmount)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-emerald-600 align-top">
                      {formatInr(student.paidAmount)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-red-600 align-top">
                      {formatInr(student.remainingAmount)}
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      <PaymentStatusBadge status={student.overallStatus} />
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground align-top">
                      {student.earliestEnrollmentDate
                        ? new Date(student.earliestEnrollmentDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {/* Payment Breakdown per course */}
                      <div className="space-y-2 min-w-[260px]">
                        {student.courses.map((course) => (
                          <div
                            key={course.enrollmentId}
                            className="rounded-md border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-left"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-foreground truncate">
                                {course.courseTitle}
                              </span>
                              <PaymentModeBadge
                                mode={getEnrollmentPaymentMode(course)}
                                compact
                                className="shrink-0 px-2 py-0 text-[10px]"
                              />
                            </div>
                            <div className="text-[10px] text-muted-foreground space-y-0.5">
                              <div>Code: <span className="font-medium text-foreground">{course.courseCode}</span></div>
                              <div>
                                Mode:{" "}
                                <span className="font-medium text-foreground">
                                  {course.paymentType === "installment" ? "Partial Payment" : "Full Payment"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span>
                                  Total: <span className="font-semibold">{formatInr(course.totalAmount ?? 0)}</span>
                                </span>
                                <span>
                                  Paid: <span className="font-semibold text-emerald-600">{formatInr(course.paidAmount ?? 0)}</span>
                                </span>
                              </div>
                              <div>
                                Remaining:{" "}
                                <span className="font-semibold text-red-600">
                                  {formatInr(course.remainingAmount ?? 0)}
                                </span>
                              </div>
                              {course.paymentType === "installment" && course.installments && course.installments.some((i) => i.paymentStatus !== "paid") && (
                                <div className="mt-1 pt-1 border-t border-slate-200">
                                  <span className="font-semibold text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Next Due: {(() => {
                                      const nextInst = [...course.installments]
                                        .filter((i) => i.paymentStatus !== "paid")
                                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
                                      return nextInst ? new Date(nextInst.dueDate).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      }) : "N/A";
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="mt-1">
                              <PaymentProgressBar
                                paid={course.paidAmount ?? 0}
                                total={course.totalAmount ?? 0}
                                showLabel={false}
                                size="sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCourses(student.studentId)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Courses
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

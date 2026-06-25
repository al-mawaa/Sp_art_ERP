"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Download,
  Bell,
  Eye,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CreditCard,
  Calendar,
  User,
  IndianRupee,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentStatusBadge, PaymentModeBadge } from "@/components/student/PaymentStatusBadge";
import { getEnrollmentPaymentMode } from "@/components/student/payment-status-utils";
import { PaymentProgressBar } from "@/components/student/PaymentProgressBar";
import { InstallmentTracker } from "@/components/student/InstallmentTracker";

/* ─── Types ─── */

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
  invoiceId?: string;
}

interface Enrollment {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  courseDuration: number;
  courseFee: number;
  batchName: string;
  teacherName: string;
  enrollmentDate: string;
  status: "active" | "completed" | "dropped";
  completionPercentage: number;
  paymentType: string;
  baseAmount: number;
  gstAmount: number;
  referralDiscount: number;
  installmentCharge: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  paymentPlanStatus: string;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  installments: InstallmentRow[];
  paymentHistory: PaymentHistoryRow[];
}

interface StudentInfo {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentBadgeId: string;
  phone: string;
}

interface Summary {
  totalCourses: number;
  activeCourses: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  completedPayments: number;
  pendingInstallments: number;
}

/* ─── Helpers ─── */

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ─── Summary Card Item ─── */

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page Component ─── */

export default function StudentEnrollmentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/enrollments/${studentId}`, {
        credentials: "include",
      });
      const _st = await res.text();
      const data = _st ? JSON.parse(_st) : {};
      if (!res.ok) throw new Error(data?.error || "Failed to fetch student data");

      setStudent(data.student);
      setSummary(data.summary);
      setEnrollments(data.enrollments);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void fetchStudentData();
  }, [fetchStudentData]);

  const toggleCard = (enrollmentId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(enrollmentId)) next.delete(enrollmentId);
      else next.add(enrollmentId);
      return next;
    });
  };

  const handleSendReminder = async (installmentId: string) => {
    setRemindingId(installmentId);
    try {
      const res = await fetch("/api/admin/enrollments/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ installmentId }),
      });
      const _rt = await res.text();
      const data = _rt ? JSON.parse(_rt) : {};
      if (!res.ok) throw new Error(data.error || "Failed to send reminder");
      toast({
        title: "Reminder sent",
        description: "Email reminder delivered to student.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send reminder",
        variant: "destructive",
      });
    } finally {
      setRemindingId(null);
    }
  };

  const handleDownloadInvoice = async (enrollmentId: string) => {
    setDownloadingInvoice(enrollmentId);
    try {
      const res = await fetch(
        `/api/admin/enrollments/${studentId}/invoice/${enrollmentId}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Failed to download invoice");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${enrollmentId}.pdf`;
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Invoice downloaded" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoice(null);
    }
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

  const handleDownloadInstallmentSchedule = (enrollment: Enrollment) => {
    if (!enrollment.installments?.length) return;

    const rows = [
      ["Term No", "Due Date", "Amount", "Status", "Paid Date"].join(","),
      ...enrollment.installments.map((inst) =>
        [
          inst.termNo,
          formatDate(inst.dueDate),
          inst.amount,
          inst.paymentStatus,
          inst.paidDate ? formatDate(inst.paidDate) : "-",
        ].join(","),
      ),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `installment-schedule-${enrollment.courseCode}.csv`;
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast({ title: "Schedule downloaded" });
  };

  /* ─── Loading / Error ─── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student || !summary) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.push("/admin/enrolled")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Enrolled Students
        </Button>
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground">Student not found</p>
        </div>
      </div>
    );
  }

  /* ─── Render ─── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/enrolled")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{student.studentName}</h1>
            <p className="text-sm text-muted-foreground">
              {student.studentBadgeId} · {student.studentEmail}
              {student.phone ? ` · ${student.phone}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadReport} className="gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* ─── Section 1: Student Summary Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard
          icon={BookOpen}
          label="Total Courses"
          value={summary.totalCourses}
          color="bg-blue-100 text-blue-700"
        />
        <SummaryCard
          icon={CheckCircle}
          label="Active Courses"
          value={summary.activeCourses}
          color="bg-emerald-100 text-emerald-700"
        />
        <SummaryCard
          icon={IndianRupee}
          label="Total Paid"
          value={formatInr(summary.totalPaid)}
          color="bg-green-100 text-green-700"
        />
        <SummaryCard
          icon={Clock}
          label="Total Pending"
          value={formatInr(summary.totalPending)}
          color="bg-amber-100 text-amber-700"
        />
        <SummaryCard
          icon={CreditCard}
          label="Completed Payments"
          value={summary.completedPayments}
          color="bg-violet-100 text-violet-700"
        />
        <SummaryCard
          icon={Calendar}
          label="Pending Installments"
          value={summary.pendingInstallments}
          color="bg-red-100 text-red-700"
        />
      </div>

      {/* Overall Payment Progress */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Overall Payment Progress</h3>
          <span className="text-xs text-muted-foreground">
            {formatInr(summary.totalPaid)} of {formatInr(summary.totalAmount)}
          </span>
        </div>
        <PaymentProgressBar paid={summary.totalPaid} total={summary.totalAmount} showLabel={false} />
      </div>

      {/* ─── Tabs ─── */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            Courses ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        {/* ─── Section 2: Course List Table + Expandable Cards ─── */}
        <TabsContent value="courses" className="space-y-4">
          {/* Course List Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Course Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Enrollment Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Payment Mode</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Total</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Paid</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Remaining</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment, idx) => (
                    <tr
                      key={enrollment.enrollmentId}
                      className={`border-b border-border ${idx % 2 === 0 ? "bg-muted/30" : ""} hover:bg-muted/50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">{enrollment.courseTitle}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{enrollment.courseCode}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(enrollment.enrollmentDate)}</td>
                      <td className="px-4 py-3 text-center">
                        <PaymentModeBadge mode={getEnrollmentPaymentMode(enrollment)} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PaymentStatusBadge status={enrollment.paymentPlanStatus} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">{formatInr(enrollment.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">{formatInr(enrollment.paidAmount)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">{formatInr(enrollment.remainingAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleCard(enrollment.enrollmentId)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          {expandedCards.has(enrollment.enrollmentId) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Section 3: Expandable Course Cards ─── */}
          {enrollments.map((enrollment) => {
            if (!expandedCards.has(enrollment.enrollmentId)) return null;

            return (
              <div
                key={enrollment.enrollmentId}
                className="rounded-lg border border-border bg-card p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{enrollment.courseTitle}</h3>
                    <p className="text-sm text-muted-foreground">{enrollment.courseCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadInvoice(enrollment.enrollmentId)}
                      disabled={downloadingInvoice === enrollment.enrollmentId}
                      className="gap-2"
                    >
                      {downloadingInvoice === enrollment.enrollmentId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      Download Invoice
                    </Button>
                    {enrollment.installments.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInstallmentSchedule(enrollment)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Schedule CSV
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleCard(enrollment.enrollmentId)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* A. Course Information */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Course Information
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <InfoField label="Course Name" value={enrollment.courseTitle} />
                    <InfoField label="Course Code" value={enrollment.courseCode} />
                    <InfoField label="Batch Name" value={enrollment.batchName} />
                    <InfoField label="Teacher Name" value={enrollment.teacherName} />
                    <InfoField label="Enrollment Date" value={formatDate(enrollment.enrollmentDate)} />
                    <InfoField
                      label="Course Duration"
                      value={`${enrollment.courseDuration} month${enrollment.courseDuration !== 1 ? "s" : ""}`}
                    />
                    <InfoField label="Course Fee" value={formatInr(enrollment.courseFee)} />
                    <InfoField
                      label="Enrollment Status"
                      value={enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                      valueClassName={
                        enrollment.status === "active"
                          ? "text-emerald-600"
                          : enrollment.status === "completed"
                            ? "text-blue-600"
                            : "text-red-600"
                      }
                    />
                  </div>
                </div>

                {/* B. Payment Information */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Information
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Mode</p>
                      <PaymentModeBadge mode={getEnrollmentPaymentMode(enrollment)} className="mt-1" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Status</p>
                      <PaymentStatusBadge status={enrollment.paymentPlanStatus} className="mt-1" />
                    </div>
                    <InfoField label="Total Amount" value={formatInr(enrollment.totalAmount)} />
                    <InfoField label="GST Amount" value={formatInr(enrollment.gstAmount)} />
                    <InfoField label="Referral Discount" value={formatInr(enrollment.referralDiscount)} />
                    <InfoField
                      label="Installment Charges"
                      value={formatInr(enrollment.installmentCharge)}
                    />
                    <InfoField
                      label="Final Amount"
                      value={formatInr(enrollment.totalAmount)}
                      valueClassName="text-foreground font-bold"
                    />
                    <InfoField
                      label="Paid Amount"
                      value={formatInr(enrollment.paidAmount)}
                      valueClassName="text-emerald-600 font-bold"
                    />
                  </div>
                  <div className="mt-4">
                    <PaymentProgressBar
                      paid={enrollment.paidAmount}
                      total={enrollment.totalAmount}
                    />
                  </div>
                </div>

                {/* C. Installment Details */}
                {enrollment.installments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Installment Details ({enrollment.paidInstallments}/{enrollment.totalInstallments} paid)
                    </h4>

                    {/* Visual Tracker */}
                    <div className="mb-4 p-4 rounded-lg bg-muted/30 border border-border">
                      <InstallmentTracker installments={enrollment.installments} />
                    </div>

                    {/* Installment Table */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full">
                        <thead className="border-b border-border bg-muted/50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Term No</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Due Date</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground">Amount</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-foreground">Status</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Paid Date</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Transaction ID</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-foreground">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollment.installments.map((inst) => {
                            // Find matching payment record
                            const paymentRecord = enrollment.paymentHistory.find(
                              (p) => p.termNo === inst.termNo && p.status === "paid",
                            );

                            return (
                              <tr
                                key={inst.installmentId}
                                className="border-b border-border hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm font-medium">Term {inst.termNo}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(inst.dueDate)}</td>
                                <td className="px-4 py-3 text-sm text-right font-semibold">{formatInr(inst.amount)}</td>
                                <td className="px-4 py-3 text-center">
                                  <PaymentStatusBadge status={inst.paymentStatus} />
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {inst.paidDate ? formatDate(inst.paidDate) : "—"}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                                  {paymentRecord?.transactionId ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {inst.paymentStatus !== "paid" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs gap-1"
                                      disabled={remindingId === inst.installmentId}
                                      onClick={() => handleSendReminder(inst.installmentId)}
                                    >
                                      {remindingId === inst.installmentId ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Bell className="h-3 w-3" />
                                          Remind
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Per-course Payment History */}
                {enrollment.paymentHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Payment History for {enrollment.courseTitle}
                    </h4>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full">
                        <thead className="border-b border-border bg-muted/50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Transaction ID</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Payment Date</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground">Amount</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Method</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollment.paymentHistory.map((p, idx) => (
                            <tr
                              key={`${p.transactionId}-${idx}`}
                              className="border-b border-border hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{p.transactionId}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(p.paymentDate)}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold">{formatInr(p.amount)}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{p.paymentMethod}</td>
                              <td className="px-4 py-3 text-center">
                                <PaymentStatusBadge status={p.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* ─── Section 4: All Payment History ─── */}
        <TabsContent value="payments" className="space-y-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <h3 className="text-sm font-semibold">All Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Transaction ID</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Course</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Payment Date</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Method</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const allPayments = enrollments.flatMap((enrollment) =>
                      enrollment.paymentHistory.map((p, idx) => ({
                        key: `all-${enrollment.enrollmentId}-${p.transactionId}-${idx}`,
                        courseTitle: enrollment.courseTitle,
                        courseCode: enrollment.courseCode,
                        ...p,
                      })),
                    );

                    if (allPayments.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No payment transactions found
                          </td>
                        </tr>
                      );
                    }

                    return allPayments.map((p) => (
                      <tr
                        key={p.key}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{p.transactionId}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">{p.courseTitle}</div>
                          <div className="text-xs text-muted-foreground">{p.courseCode}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(p.paymentDate)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{formatInr(p.amount)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{p.paymentMethod}</td>
                        <td className="px-4 py-3 text-center">
                          <PaymentStatusBadge status={p.status} />
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Info Field Helper ─── */

function InfoField({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${valueClassName ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

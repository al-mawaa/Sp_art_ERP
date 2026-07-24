"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

type StudentOption = {
  id: string;
  name: string;
  badgeId?: string;
  email?: string;
};

type CourseOption = {
  id: string;
  courseTitle: string;
  courseCode?: string;
  discountFees?: number;
};

type OfflinePaymentRow = {
  payment_id: string;
  reference_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  expected_payment_date: string;
  verified_at: string;
  hours_pending: number;
  is_overdue: boolean;
  notes: string;
  payment_type: "full" | "installment";
  total_amount?: number;
  installment_charge?: number;
  paid_amount?: number;
  remaining_amount?: number;
  next_due_date?: string;
  installment_status?: string;
  installments?: {
    id: string;
    termNo: number;
    amount: number;
    paidAmount?: number;
    dueDate: string | null;
    paymentStatus: string;
    paidDate: string | null;
  }[];
};

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
];

function StatusBadge({ status, overdue }: { status: string; overdue?: boolean }) {
  const normalized = status.toLowerCase();
  const statusClass = normalized === "pending"
    ? "bg-amber-100 text-amber-800"
    : normalized === "verified"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "rejected"
        ? "bg-rose-100 text-rose-800"
        : "bg-slate-100 text-slate-800";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${statusClass}`}>
      <span>{status}</span>
      {overdue && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-white text-[10px]">Overdue</span>}
    </div>
  );
}

export default function AdminOfflinePaymentsPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [payments, setPayments] = useState<OfflinePaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState({ total: 0, pending_count: 0, verified_count: 0, rejected_count: 0 });
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [expectedDate, setExpectedDate] = useState("");
  const [upfrontPayment, setUpfrontPayment] = useState("");
  const [notes, setNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "installment">("full");
  const [installmentTerms, setInstallmentTerms] = useState<number>(2);
  const [dueDates, setDueDates] = useState<string[]>(["", ""]);
  
  const [viewInstallmentsRow, setViewInstallmentsRow] = useState<OfflinePaymentRow | null>(null);

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students", { credentials: "include" });
      const _text = await res.text();
      const data = (_text ? JSON.parse(_text) : {}) as { students?: StudentOption[] };
      if (data.students) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load student list");
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses", { credentials: "include" });
      const _txt2 = await res.text();
      const data = (_txt2 ? JSON.parse(_txt2) : {}) as { courses?: CourseOption[] };
      if (data.courses) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load course list");
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/offline-payments?${params.toString()}`, { credentials: "include" });
      const _txt3 = await res.text();
      console.log("[DEBUG] res.status:", res.status, "res.ok:", res.ok, "body length:", _txt3.length, "body:", _txt3);
      const data = (_txt3 ? JSON.parse(_txt3) : {}) as {
        success?: boolean;
        payments?: Partial<OfflinePaymentRow>[];
        total?: number;
        pending_count?: number;
        verified_count?: number;
        rejected_count?: number;
        error?: string;
      };
      if (data?.success) {
        setPayments((data.payments ?? []).map(payment => ({
          payment_id: payment.payment_id || "",
          reference_id: payment.reference_id || "",
          student_id: payment.student_id || "",
          student_name: payment.student_name || "",
          student_email: payment.student_email || "",
          course_id: payment.course_id || "",
          course_name: payment.course_name || "",
          amount: payment.amount ?? 0,
          currency: payment.currency || "INR",
          payment_method: payment.payment_method || "",
          payment_status: payment.payment_status || "",
          created_at: payment.created_at || "",
          expected_payment_date: payment.expected_payment_date || "",
          verified_at: payment.verified_at || "",
          hours_pending: payment.hours_pending ?? 0,
          is_overdue: payment.is_overdue ?? false,
          notes: payment.notes || "",
          payment_type: payment.payment_type || "full",
          total_amount: payment.total_amount,
          installment_charge: payment.installment_charge,
          paid_amount: payment.paid_amount,
          remaining_amount: payment.remaining_amount,
          next_due_date: payment.next_due_date,
          installment_status: payment.installment_status,
          installments: payment.installments,
        })));
        setSummary({
          total: data.total ?? 0,
          pending_count: data.pending_count ?? 0,
          verified_count: data.verified_count ?? 0,
          rejected_count: data.rejected_count ?? 0,
        });
      } else {
        toast.error(data?.error || "Failed to load offline payments");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch offline payments");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    loadStudents();
    loadCourses();
  }, [loadStudents, loadCourses]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const refresh = async () => {
    await loadPayments();
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!studentId || !courseId) {
      toast.error("Select a student and course before creating a request");
      return;
    }

    const amountNumber = Number(amount);
    if (paymentType === "full" && (!amountNumber || amountNumber <= 0)) {
      toast.error("Enter a valid amount");
      return;
    }

    if (paymentType === "installment") {
      if (dueDates.slice(0, installmentTerms).some(d => !d)) {
        toast.error("Please fill all due dates for the installment plan");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/offline-payments/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          course_id: courseId,
          amount: paymentType === "full" ? amountNumber : 0, // In installment, amount is calculated on server
          payment_method: paymentMethod,
          expected_payment_date: expectedDate || undefined,
          notes: notes || undefined,
          paymentType,
          upfrontPayment: paymentType === "installment" ? Number(upfrontPayment) || 0 : undefined,
          installmentTerms: paymentType === "installment" ? installmentTerms : undefined,
          dueDates: paymentType === "installment" ? dueDates.slice(0, installmentTerms) : undefined,
        }),
      });
      const _t1 = await res.text();
      const data = _t1 ? JSON.parse(_t1) : {};
      if (res.ok && data?.success) {
        toast.success("Offline payment request created");
        setAmount("");
        setExpectedDate("");
        setNotes("");
        await loadPayments();
      } else {
        toast.error(data?.error || "Unable to create request");
      }
    } catch (error) {
      console.error(error);
      toast.error("Create request failed");
    } finally {
      setSaving(false);
    }
  };

  const verifyPayment = useCallback(async (paymentId: string) => {
    const confirmed = window.confirm("Verify this offline payment and grant course access?");
    if (!confirmed) return;

    try {
      const formData = new FormData();
      formData.append("verification_status", "verified");
      formData.append("verification_notes", "Verified by admin via offline payments page");
      const res = await fetch(`/api/admin/offline-payments/${paymentId}/verify`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const _t2 = await res.text();
      const data = _t2 ? JSON.parse(_t2) : {};
      if (res.ok && data?.success) {
        toast.success("Payment verified successfully");
        await loadPayments();
      } else {
        toast.error(data?.error || "Verification failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to verify payment");
    }
  }, [loadPayments]);

  const verifyInstallment = useCallback(async (installmentId: string) => {
    const confirmed = window.confirm("Verify this installment payment as paid?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/installments/${installmentId}/verify`, {
        method: "POST",
        credentials: "include",
      });
      const _t3 = await res.text();
      const data = _t3 ? JSON.parse(_t3) : {};
      if (res.ok && data?.success) {
        toast.success("Installment verified successfully");
        await loadPayments();
        setViewInstallmentsRow(null); // Close modal to refresh data properly
      } else {
        toast.error(data?.error || "Verification failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to verify installment");
    }
  }, [loadPayments]);

  const rejectPayment = useCallback(async (paymentId: string) => {
    const reason = window.prompt("Enter rejection reason for this payment:");
    if (!reason || !reason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      const res = await fetch(`/api/admin/offline-payments/${paymentId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: reason.trim() }),
      });
      const _t4 = await res.text();
      const data = _t4 ? JSON.parse(_t4) : {};
      if (res.ok && data?.success) {
        toast.success("Payment rejected successfully");
        await loadPayments();
      } else {
        toast.error(data?.error || "Rejection failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to reject payment");
    }
  }, [loadPayments]);

  const deletePayment = useCallback(async (paymentId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this payment record? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/offline-payments/${paymentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const _t5 = await res.text();
      const data = _t5 ? JSON.parse(_t5) : {};
      if (res.ok && data?.success) {
        toast.success("Payment deleted successfully");
        await loadPayments();
      } else {
        toast.error(data?.error || "Deletion failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete payment");
    }
  }, [loadPayments]);

  const tableColumns = useMemo(
    () => [
      { key: "reference_id", header: "Reference" },
      { key: "student_name", header: "Student" },
      { key: "course_name", header: "Course" },
      { 
        key: "payment_type", 
        header: "Type", 
        render: (row: OfflinePaymentRow) => (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${row.payment_type === "installment" ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20" : "bg-blue-50 text-blue-700 ring-blue-600/20"}`}>
            {row.payment_type === "installment" ? "Installment" : "Full"}
          </span>
        )
      },
      { 
        key: "amount", 
        header: "Amount Details", 
        render: (row: OfflinePaymentRow) => row.payment_type === "installment" 
          ? <div className="text-xs space-y-1">
              <div>Total: ₹{(row.total_amount || 0).toLocaleString()}</div>
              <div className="text-emerald-600">Paid: ₹{(row.paid_amount || 0).toLocaleString()}</div>
              <div className="text-rose-600">Rem: ₹{(row.remaining_amount || 0).toLocaleString()}</div>
            </div>
          : `₹${row.amount.toLocaleString()}`
      },
      { 
        key: "next_due_date", 
        header: "Next Due / Expected", 
        render: (row: OfflinePaymentRow) => {
          if (row.payment_type === "installment") {
            if (!row.next_due_date) return <span className="text-slate-400">—</span>;
            const date = new Date(row.next_due_date);
            const isOverdue = date < new Date();
            return (
              <div className={`flex items-center gap-1.5 ${isOverdue ? "text-rose-600 font-semibold" : "text-amber-600 font-medium"}`}>
                <AlertCircle className="h-4 w-4" />
                <span>{format(date, "dd MMM yyyy")}</span>
              </div>
            );
          }
          return row.expected_payment_date ? (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(row.expected_payment_date), "dd MMM yyyy")}</span>
            </div>
          ) : <span className="text-slate-400">—</span>;
        }
      },
      { key: "payment_method", header: "Method", render: (row: OfflinePaymentRow) => row.payment_method.replace("_", " ") },
      { key: "payment_status", header: "Status", render: (row: OfflinePaymentRow) => <StatusBadge status={row.payment_type === 'installment' ? (row.installment_status || 'Pending') : row.payment_status} overdue={row.is_overdue} /> },
      { key: "created_at", header: "Created", render: (row: OfflinePaymentRow) => row.created_at ? format(new Date(row.created_at), "dd MMM yyyy") : "—" },
      {
        key: "actions",
        header: "Actions",
        render: (row: OfflinePaymentRow) => {
          if (row.payment_status === "pending" && row.payment_type === "full") {
            return (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => verifyPayment(row.payment_id)}>
                  Verify
                </Button>
                <Button size="sm" variant="destructive" onClick={() => rejectPayment(row.payment_id)}>
                  Reject
                </Button>
                <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700" onClick={() => deletePayment(row.payment_id)}>
                  Delete
                </Button>
              </div>
            );
          }
          if (row.payment_type === "installment") {
            return (
              <div className="flex flex-wrap gap-2">
                {row.payment_status === "pending" && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => verifyPayment(row.payment_id)}>
                      Verify
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectPayment(row.payment_id)}>
                      Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => setViewInstallmentsRow(row)}>
                  View Installments
                </Button>
                <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700" onClick={() => deletePayment(row.payment_id)}>
                  Delete
                </Button>
              </div>
            );
          }
          return (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center rounded-full border border-border/80 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {row.payment_status === "verified" ? "Verified" : "Rejected"}
              </span>
              <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700" onClick={() => deletePayment(row.payment_id)}>
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [rejectPayment, verifyPayment, deletePayment],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Offline Payments" subtitle="Create and review offline payment requests" action={
        <Button variant="secondary" onClick={refresh} disabled={loading}>Refresh</Button>
      } />

      <section className="card-soft p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Create offline payment request</h2>
          <p className="text-sm text-muted-foreground">Submit a pending offline payment for a student and course.</p>
        </div>

        <form className="space-y-6" onSubmit={handleCreate}>
          {/* Row 1: Student and Course */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">Student</label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="h-12 rounded-2xl border border-border/70 bg-white shadow-sm">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} {student.badgeId ? `(${student.badgeId})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[220px] flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">Course</label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="h-12 rounded-2xl border border-border/70 bg-white shadow-sm">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.courseTitle} {course.courseCode ? `(${course.courseCode})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Payment Type Selection & Installment Details */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-[220px] flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">Payment Type</label>
              <Select value={paymentType} onValueChange={(val: "full" | "installment") => setPaymentType(val)}>
                <SelectTrigger className="h-12 rounded-2xl border border-border/70 bg-white shadow-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="installment">Installment Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentType === "installment" && (() => {
              const selectedCourse = courses.find((c) => c.id === courseId);
              const baseFee = selectedCourse?.discountFees || 0;
              const charge = baseFee * 0.20;
              const totalAmount = baseFee + charge;
              const amountPerTerm = totalAmount / installmentTerms;
              return (
                <div className="flex-1 min-w-[300px] bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-slate-500 block">Course Fee</span>
                      <span className="font-semibold text-slate-800">₹{baseFee.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Installment Charge (20%)</span>
                      <span className="font-semibold text-slate-800">₹{charge.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Total Payable Amount</span>
                      <span className="font-semibold text-emerald-600 text-base">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Number of Terms</label>
                    <Select value={installmentTerms.toString()} onValueChange={(val) => {
                      const t = parseInt(val);
                      setInstallmentTerms(t);
                      const newDates = [...dueDates];
                      while(newDates.length < t) newDates.push("");
                      setDueDates(newDates);
                    }}>
                      <SelectTrigger className="h-10 rounded-xl border border-border/70 bg-white">
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Terms (₹{Math.round(totalAmount/2).toLocaleString()}/term)</SelectItem>
                        <SelectItem value="3">3 Terms (₹{Math.round(totalAmount/3).toLocaleString()}/term)</SelectItem>
                        <SelectItem value="4">4 Terms (₹{Math.round(totalAmount/4).toLocaleString()}/term)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: installmentTerms }).map((_, i) => (
                      <div key={i}>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Term {i + 1} Due Date</label>
                        <Input
                          type="date"
                          className="h-10 rounded-xl"
                          value={dueDates[i] || ""}
                          onChange={(e) => {
                            const newDates = [...dueDates];
                            newDates[i] = e.target.value;
                            setDueDates(newDates);
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Upfront Payment (₹) - First Installment</label>
                    <Input
                      type="number"
                      min="0"
                      max={amountPerTerm}
                      placeholder={`Amount paid now (Min: ₹${amountPerTerm})`}
                      className="h-10 rounded-xl bg-white"
                      value={upfrontPayment}
                      onChange={(e) => setUpfrontPayment(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-slate-500">Amount paid immediately towards the first installment.</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Row 3: Method & Action */}
          {paymentType === "full" && (
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[160px] flex-1 sm:flex-none sm:w-32">
              <label className="mb-2 block text-sm font-medium text-slate-700">Amount (₹)</label>
              <Input className="h-12 rounded-2xl border border-border/70 bg-white shadow-sm" value={amount} onChange={e => setAmount(e.target.value)} type="number" min="1" placeholder="Amount" />
            </div>

            <div className="min-w-[180px] flex-1 sm:flex-none sm:w-44">
              <label className="mb-2 block text-sm font-medium text-slate-700">Payment method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 rounded-2xl border border-border/70 bg-white shadow-sm">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px] flex-1 sm:flex-none sm:w-44">
              <label className="mb-2 block text-sm font-medium text-slate-700">Expected payment date</label>
              <Input className="h-12 rounded-2xl border border-border/70 bg-white shadow-sm" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} type="date" />
            </div>
            </div>
          )}

          <div className="flex items-end justify-between">
            <div className="min-w-[180px] flex-none">
              <Button type="submit" className="h-12 rounded-2xl px-6" disabled={saving}>
                {saving ? "Saving..." : paymentType === "installment" ? "Create Installment Plan" : "Create request"}
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea className="min-h-[120px] rounded-2xl border border-border/70 bg-white p-4 shadow-sm" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Details, branch, reference, or other instructions" />
          </div>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="mt-2 text-3xl font-semibold">{summary.pending_count}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-sm text-muted-foreground">Verified</p>
          <p className="mt-2 text-3xl font-semibold">{summary.verified_count}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-sm text-muted-foreground">Rejected</p>
          <p className="mt-2 text-3xl font-semibold">{summary.rejected_count}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="mt-2 text-3xl font-semibold">{summary.total}</p>
        </div>
      </section>

      <section className="card-soft p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Recent offline payments</h3>
            <p className="text-sm text-muted-foreground">Filter and audit pending activity.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-12 rounded-2xl border border-border/70 bg-white shadow-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="h-12 rounded-2xl border border-border/70 bg-white shadow-sm"
              placeholder="Search reference, student, course"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          columns={tableColumns}
          rows={payments}
          searchKeys={['reference_id', 'student_name', 'course_name', 'payment_method', 'payment_status', 'notes']}
          emptyMessage={loading ? "Loading payments..." : "No offline payments found"}
        />
      </section>

      {viewInstallmentsRow && (
        <Dialog open={!!viewInstallmentsRow} onOpenChange={(open) => !open && setViewInstallmentsRow(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Installment Plan Details</DialogTitle>
              <DialogDescription>
                Review installment schedule for {viewInstallmentsRow.student_name} ({viewInstallmentsRow.course_name})
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-sm text-slate-500">Total Amount</p>
                <p className="font-semibold">₹{(viewInstallmentsRow.total_amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Installment Charge</p>
                <p className="font-semibold">₹{(viewInstallmentsRow.installment_charge || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Paid Amount</p>
                <p className="font-semibold text-emerald-600">₹{(viewInstallmentsRow.paid_amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Remaining Amount</p>
                <p className="font-semibold text-rose-600">₹{(viewInstallmentsRow.remaining_amount || 0).toLocaleString()}</p>
              </div>
            </div>

            <h3 className="font-semibold mt-4 mb-2">Installment Schedule</h3>
            <div className="rounded-xl border border-border/70 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-border/70">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">Term No</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Due Date</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Amount</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Paid Date</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {(viewInstallmentsRow.installments || []).map((term) => (
                    <tr key={term.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">Term {term.termNo}</td>
                      <td className="px-4 py-3">{term.dueDate ? format(new Date(term.dueDate), "dd MMM yyyy") : "—"}</td>
                      <td className="px-4 py-3">
                        <div>
                          ₹{term.amount.toLocaleString()}
                          {term.paymentStatus === 'partially_paid' && term.paidAmount && (
                            <span className="block text-[10px] text-blue-600">(Paid: ₹{term.paidAmount.toLocaleString()})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                          term.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          term.paymentStatus === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                          term.paymentStatus === 'pending' && new Date(term.dueDate || '') < new Date() ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {term.paymentStatus === 'paid' ? 'Paid' : 
                           term.paymentStatus === 'partially_paid' ? 'Partial' :
                           term.paymentStatus === 'pending' && new Date(term.dueDate || '') < new Date() ? 'Overdue' : 
                           term.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">{term.paidDate ? format(new Date(term.paidDate), "dd MMM yyyy") : "—"}</td>
                      <td className="px-4 py-3">
                        {['pending', 'partially_paid'].includes(term.paymentStatus) && (
                          <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => verifyInstallment(term.id)}>
                            Mark Paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

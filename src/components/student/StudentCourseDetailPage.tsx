"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CourseStatusBadge } from "@/components/student/CourseStatusBadge";
import { EnrollmentPaymentModal } from "@/components/student/EnrollmentPaymentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { downloadPaymentReceiptPdf } from "@/lib/payments/receiptPdf";
import type { StudentCourseCard } from "@/lib/student/studentCourses";
import { toast } from "sonner";

type DetailPayload = {
  course: StudentCourseCard;
  enrollment: {
    paymentStatus: string;
    paidAmount: number;
    totalAmount: number;
    remainingAmount?: number;
    nextDueDate?: string;
    installmentType: string;
  } | null;
  payments: {
    receiptNumber: string;
    razorpayPaymentId?: string;
    amount: number;
    paidAt: string | null;
    installmentNumber: number;
  }[];
  schedule: Record<string, string>;
  assignments: { id: string; title: string; due?: string }[];
  exams: { id: string; title: string; date?: string }[];
  tasks: { id: string; title: string; status: string }[];
  razorpayKeyId: string;
};

export function StudentCourseDetailPage({
  batchId,
  backHref = "/student/my-courses",
  backLabel = "My Courses",
}: {
  batchId: string;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/courses/${batchId}`, { credentials: "include" });
      const json = await parseJsonResponse<{ error?: string; data?: DetailPayload }>(res);
      if (!res.ok) throw new Error(json.error || "Failed to load course");
      setData(json.data ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
      router.push(backHref);
    } finally {
      setLoading(false);
    }
  }, [batchId, router, backHref]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  const { course, enrollment, payments, schedule, tasks } = data;
  const remaining =
    enrollment ? Math.max(0, enrollment.totalAmount - enrollment.paidAmount) : course.courseFees;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={course.courseName}
        subtitle={course.batchName}
        action={
          <Button variant="outline" size="sm" className="rounded-xl" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {backLabel}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl lg:col-span-2 border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CourseStatusBadge status={course.displayStatus} />
              {course.enrollmentStatus === "enrolled" && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Enrolled
                </span>
              )}
            </div>
            <CardTitle className="font-display text-xl mt-2">Course information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Info label="Teacher" value={course.teacherName} icon={User} />
              <Info label="Branch" value={course.branch} icon={BookOpen} />
              <Info label="Schedule" value={schedule.batchTiming || course.batchTiming} icon={Calendar} />
              <Info label="Duration" value={`${course.durationMonths} months`} icon={Calendar} />
              <Info label="Fees" value={`₹${course.courseFees.toLocaleString("en-IN")}`} icon={BookOpen} />
              <Info
                label="Dates"
                value={`${course.startDate || "—"} → ${course.endDate || "—"}`}
                icon={Calendar}
              />
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Artwork / task progress</span>
                <span>{course.progressPercent}%</span>
              </div>
              <Progress value={course.progressPercent} className="h-2.5" />
              <p className="text-xs text-muted-foreground">
                {course.completedTasks} completed · {course.remainingTasks} remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base font-display">Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {enrollment ? (
                <>
                  <p>
                    Status: <strong className="capitalize">{enrollment.paymentStatus}</strong>
                  </p>
                  <p>Paid: ₹{enrollment.paidAmount.toLocaleString("en-IN")}</p>
                  <p>Remaining: ₹{remaining.toLocaleString("en-IN")}</p>
                  {enrollment.nextDueDate && (
                    <p className="text-amber-700">Due: {enrollment.nextDueDate}</p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Not enrolled yet</p>
              )}
              {course.enrollmentStatus !== "enrolled" && (
                <Button
                  className="w-full rounded-xl gradient-primary text-white border-0 mt-2"
                  onClick={() => setModalOpen(true)}
                >
                  {course.enrollmentStatus === "payment_pending"
                    ? "Complete Payment"
                    : "Enroll Now"}
                </Button>
              )}
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card className="rounded-3xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base font-display">Receipts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {payments.map(p => (
                  <Button
                    key={p.receiptNumber}
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl justify-start"
                    onClick={() =>
                      downloadPaymentReceiptPdf({
                        studentName: "Student",
                        courseName: course.courseName,
                        batchName: course.batchName,
                        amountPaid: p.amount,
                        paymentId: p.razorpayPaymentId || p.receiptNumber,
                        receiptNumber: p.receiptNumber,
                        paymentDate: p.paidAt
                          ? new Date(p.paidAt).toLocaleDateString("en-IN")
                          : new Date().toLocaleDateString("en-IN"),
                      })
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ₹{p.amount.toLocaleString("en-IN")} — {p.receiptNumber}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Tasks & assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
              >
                <span>{t.title}</span>
                {t.status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span className="text-xs text-muted-foreground">Pending</span>
                )}
              </div>
            ))}
            {data.assignments.length === 0 && (
              <p className="text-xs text-muted-foreground">No extra assignments yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.exams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exams scheduled</p>
            ) : (
              data.exams.map(e => (
                <p key={e.id} className="text-sm">
                  {e.title} — {e.date}
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <EnrollmentPaymentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        course={course}
        razorpayKeyId={data.razorpayKeyId}
        onSuccess={() => void load()}
      />
    </div>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof User;
}) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  );
}

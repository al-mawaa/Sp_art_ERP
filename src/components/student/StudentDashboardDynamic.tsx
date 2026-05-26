"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CreditCard, GraduationCap, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import type { StudentCourseCard } from "@/lib/student/studentCourses";

type HistorySummary = {
  enrolledCourses: number;
  activeCourses: number;
  upcomingPayments: {
    remainingAmount: number;
    nextDueDate?: string;
    paymentStatus: string;
  }[];
  totalPaid: number;
};

export function StudentDashboardDynamic() {
  const [profileName, setProfileName] = useState("Student");
  const [courses, setCourses] = useState<StudentCourseCard[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, coursesRes, payRes] = await Promise.all([
          fetch("/api/student/profile", { credentials: "include" }),
          fetch("/api/student/my-courses", { credentials: "include" }),
          fetch("/api/student/payments/history", { credentials: "include" }),
        ]);

        const profileJson = await parseJsonResponse<{
          data?: { fullName?: string };
        }>(profileRes);
        if (profileRes.ok && profileJson.data?.fullName) {
          setProfileName(profileJson.data.fullName);
        }

        const coursesJson = await parseJsonResponse<{
          data?: { courses: StudentCourseCard[] };
        }>(coursesRes);
        if (coursesRes.ok) {
          setCourses(coursesJson.data?.courses ?? []);
        }

        const payJson = await parseJsonResponse<{ data?: { summary: HistorySummary } }>(payRes);
        if (payRes.ok) setSummary(payJson.data?.summary ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const enrolled = courses.filter(c => c.enrollmentStatus === "enrolled");
  const active = enrolled.filter(c => c.displayStatus === "Active");
  const avgProgress =
    enrolled.length > 0
      ? Math.round(
          enrolled.reduce((s, c) => s + c.progressPercent, 0) / enrolled.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="card-pop overflow-hidden">
        <div className="gradient-mint text-white p-6 sm:p-8">
          <div className="text-xs uppercase tracking-widest font-bold opacity-90">Welcome back</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">{profileName} 🎨</h1>
          <p className="opacity-90 mt-1">Track courses, payments, and studio progress</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Enrolled courses"
            value={summary?.enrolledCourses ?? enrolled.length}
            icon={GraduationCap}
            tone="accent"
          />
          <StatCard
            label="Active courses"
            value={summary?.activeCourses ?? active.length}
            icon={BookOpen}
            tone="success"
          />
          <StatCard
            label="Total paid"
            value={`₹${(summary?.totalPaid ?? 0).toLocaleString("en-IN")}`}
            icon={Wallet}
            tone="info"
          />
          <StatCard label="Avg. progress" value={`${avgProgress}%`} icon={CreditCard} tone="accent" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="rounded-3xl border-border/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Enrolled courses</CardTitle>
            <Button size="sm" variant="outline" className="rounded-xl" asChild>
              <Link href="/student/my-courses">View My Courses</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : enrolled.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrolled courses yet.</p>
            ) : (
              enrolled.slice(0, 4).map(c => (
                <Link
                  key={c.id}
                  href={`/student/my-courses/${c.batchId}`}
                  className="block rounded-2xl border border-border/60 p-3 hover:bg-primary/5 transition-colors"
                >
                  <p className="font-semibold text-sm">{c.courseName}</p>
                  <p className="text-xs text-muted-foreground">{c.batchName}</p>
                  <Progress value={c.progressPercent} className="h-1.5 mt-2" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-lg">Upcoming payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : !summary?.upcomingPayments?.length ? (
              <p className="text-sm text-muted-foreground">No pending installments.</p>
            ) : (
              summary.upcomingPayments.map((p, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm"
                >
                  <p className="font-medium text-amber-900">
                    ₹{p.remainingAmount.toLocaleString("en-IN")} due
                  </p>
                  {p.nextDueDate && (
                    <p className="text-xs text-amber-800">Due {p.nextDueDate}</p>
                  )}
                </div>
              ))
            )}
            <Button className="rounded-xl w-full" variant="outline" asChild>
              <Link href="/student/my-courses">Manage payments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-lg">Progress summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Overall studio progress across enrolled programs
          </p>
          <Progress value={avgProgress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">{avgProgress}% average completion</p>
        </CardContent>
      </Card>
    </div>
  );
}

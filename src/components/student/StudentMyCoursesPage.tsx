"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StudentCourseCardItem } from "@/components/student/StudentCourseCard";
import { EnrollmentPaymentModal } from "@/components/student/EnrollmentPaymentModal";
import { CourseFiltersBar } from "@/components/student/CourseFiltersBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { messageFromUnknown } from "@/lib/errors/messageFromUnknown";
import type { StudentCourseCard } from "@/lib/student/studentCourses";
import { toast } from "sonner";

type Payload = {
  courses: StudentCourseCard[];
  filters: { teachers: string[]; batches: string[] };
};

export function StudentMyCoursesPage() {
  const [courses, setCourses] = useState<StudentCourseCard[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [enrollCourse, setEnrollCourse] = useState<StudentCourseCard | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (teacherFilter !== "all") params.set("teacher", teacherFilter);
      if (batchFilter !== "all") params.set("batch", batchFilter);
      if (paymentFilter !== "all") params.set("paymentStatus", paymentFilter);

      const [myRes, catalogRes] = await Promise.all([
        fetch(`/api/student/my-courses?${params}`, { credentials: "include" }),
        fetch("/api/student/courses", { credentials: "include" }),
      ]);
      const myJson = await parseJsonResponse<{ error?: string; data?: Payload }>(myRes);
      if (!myRes.ok) throw new Error(myJson.error || "Failed to load my courses");
      const data = myJson.data!;
      setCourses(data.courses ?? []);
      setTeachers(data.filters?.teachers ?? []);
      setBatches(data.filters?.batches ?? []);

      const catalogJson = await parseJsonResponse<{
        data?: { razorpayKeyId?: string };
      }>(catalogRes);
      if (catalogRes.ok) setRazorpayKeyId(catalogJson.data?.razorpayKeyId ?? "");
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to load my courses"));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, teacherFilter, batchFilter, paymentFilter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="min-h-0 w-full space-y-8 pb-10">
      <PageHeader
        title="My Courses"
        subtitle="Your enrolled programs — track progress and continue learning"
      />

      <CourseFiltersBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        teacherFilter={teacherFilter}
        onTeacherChange={setTeacherFilter}
        teacherOptions={teachers}
        batchFilter={batchFilter}
        onBatchChange={setBatchFilter}
        batchOptions={batches}
        paymentFilter={paymentFilter}
        onPaymentChange={setPaymentFilter}
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[460px] rounded-3xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card-soft relative overflow-hidden flex flex-col items-center justify-center py-20 px-6 text-center">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.15), transparent 50%), radial-gradient(circle at 70% 80%, hsl(var(--accent) / 0.12), transparent 45%)",
            }}
          />
          <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-amber-100 flex items-center justify-center mb-5 shadow-sm">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <p className="relative font-display text-xl font-semibold">No enrolled courses yet</p>
          <p className="relative text-sm text-muted-foreground mt-2 max-w-md">
            Enroll from the Courses page. After successful payment, your program appears here
            automatically.
          </p>
          <Button className="relative mt-6 rounded-xl gradient-primary text-white border-0" asChild>
            <Link href="/student/courses">
              <Sparkles className="h-4 w-4 mr-2" />
              Browse courses
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(c => (
            <StudentCourseCardItem
              key={c.id}
              course={c}
              variant="enrolled"
              onEnroll={course => {
                setEnrollCourse(course);
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <EnrollmentPaymentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        course={enrollCourse}
        razorpayKeyId={razorpayKeyId}
        onSuccess={() => void load()}
      />
    </div>
  );
}

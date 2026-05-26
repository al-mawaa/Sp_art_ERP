"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StudentCourseCardItem } from "@/components/student/StudentCourseCard";
import { EnrollmentPaymentModal } from "@/components/student/EnrollmentPaymentModal";
import { CourseFiltersBar } from "@/components/student/CourseFiltersBar";
import { Skeleton } from "@/components/ui/skeleton";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { messageFromUnknown } from "@/lib/errors/messageFromUnknown";
import type { StudentCourseCard } from "@/lib/student/studentCourses";
import { toast } from "sonner";

type Payload = {
  courses: StudentCourseCard[];
  filters: { teachers: string[]; batches: string[] };
  razorpayKeyId: string;
};

export function StudentBrowseCoursesPage() {
  const [courses, setCourses] = useState<StudentCourseCard[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [enrollCourse, setEnrollCourse] = useState<StudentCourseCard | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (teacherFilter !== "all") params.set("teacher", teacherFilter);
      if (batchFilter !== "all") params.set("batch", batchFilter);
      if (paymentFilter !== "all") params.set("paymentStatus", paymentFilter);

      const res = await fetch(`/api/student/courses?${params}`, { credentials: "include" });
      const json = await parseJsonResponse<{ error?: string; data?: Payload }>(res);
      if (res.status === 401) {
        throw new Error("Not signed in. Log out, then sign in again using Student role on the login page.");
      }
      if (!res.ok) throw new Error(json.error || "Failed to load courses");
      const data = json.data!;
      setCourses(data.courses ?? []);
      setTeachers(data.filters?.teachers ?? []);
      setBatches(data.filters?.batches ?? []);
      setRazorpayKeyId(data.razorpayKeyId ?? "");
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to load courses"));
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
        title="Courses"
        subtitle="Browse programs, enroll online, and pay securely with Razorpay"
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
        showPaymentFilter={false}
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[440px] rounded-3xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card-soft flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-primary/60" />
          </div>
          <p className="font-display text-lg font-semibold">No courses available</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            New batches will appear here when your academy opens enrollment.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(c => (
            <StudentCourseCardItem
              key={c.id}
              course={c}
              variant="catalog"
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
        onSuccess={() => {
          toast.success("Course added to My Courses!");
          void load();
        }}
      />
    </div>
  );
}

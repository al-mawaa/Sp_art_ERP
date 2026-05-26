import mongoose from "mongoose";
import Batch, { type BatchDocument, type BatchStatus } from "@/lib/models/Batch";
import Course, { type CourseDocument } from "@/lib/models/Course";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import StudentPayment from "@/lib/models/StudentPayment";
import "@/lib/models/Teacher";
import type { StudentDocument } from "@/lib/models/Student";
import { buildStudentBatchFilter } from "@/lib/student/studentBatches";
import { todayDateString } from "@/lib/dates/attendanceDate";

export type CourseDisplayStatus = "Active" | "Completed" | "Upcoming" | "Payment Pending";

export type StudentCourseCard = {
  id: string;
  batchId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  description: string;
  thumbnailUrl: string;
  teacherName: string;
  batchName: string;
  batchDays: string;
  batchTiming: string;
  branch: string;
  durationMonths: number;
  startDate: string;
  endDate: string;
  availableSeats: number;
  courseFees: number;
  progressPercent: number;
  displayStatus: CourseDisplayStatus;
  enrollmentStatus: "enrolled" | "not_enrolled" | "payment_pending";
  paymentStatus: string | null;
  enrollmentDate: string | null;
  lastPaymentId: string | null;
  isEnrolledInBatch: boolean;
  completedTasks: number;
  remainingTasks: number;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatTeacherNames(teacherIds: BatchDocument["teacherIds"], populated: boolean): string {
  if (!populated || !teacherIds?.length) return "—";
  return (teacherIds as unknown as { fullName?: string }[])
    .map(t => (t.fullName || "").trim())
    .filter(Boolean)
    .join(", ");
}

function matchCourseForBatch(
  batch: BatchDocument,
  courses: CourseDocument[],
): CourseDocument | null {
  const name = (batch.courseName || "").trim().toLowerCase();
  if (!name) return null;
  return (
    courses.find(c => (c.courseTitle || "").trim().toLowerCase() === name) ||
    courses.find(c => (c.courseCode || "").trim().toLowerCase() === name) ||
    null
  );
}

function resolveDisplayStatus(
  batchStatus: BatchStatus,
  startDate: string,
  enrollmentPayment: string | null,
  isInRoster: boolean,
): CourseDisplayStatus {
  if (enrollmentPayment === "pending" || enrollmentPayment === "partial") {
    return "Payment Pending";
  }
  const today = todayDateString();
  if (startDate && startDate > today) return "Upcoming";
  if (batchStatus === "Completed") return "Completed";
  if (batchStatus === "Active" || isInRoster) return "Active";
  return "Upcoming";
}

function progressFromBatch(batch: BatchDocument) {
  const summary = batch.attendanceSummary;
  const total = summary?.totalSessions ?? 0;
  const completed = summary?.completedSessions ?? 0;
  if (total > 0) return Math.min(100, Math.round((completed / total) * 100));
  if (summary?.averageAttendancePercent) {
    return Math.min(100, Math.round(summary.averageAttendancePercent));
  }
  return 0;
}

export type StudentCourseLists = {
  assignedByAdmin: StudentCourseCard[];
  myCourses: StudentCourseCard[];
  exploreCourses: StudentCourseCard[];
};

function isMyCourse(card: StudentCourseCard): boolean {
  if (card.paymentStatus === "paid") return true;
  if (card.paymentStatus === "partial") return true;
  if (card.isEnrolledInBatch && card.enrollmentStatus === "enrolled") return true;
  return false;
}

export async function findStudentCourseLists(
  student: StudentDocument,
): Promise<StudentCourseLists> {
  const all = await buildAllCourseCards(student);
  return {
    assignedByAdmin: all
      .filter(c => c.isEnrolledInBatch)
      .sort((a, b) => a.courseName.localeCompare(b.courseName)),
    myCourses: all.filter(isMyCourse).sort((a, b) => a.courseName.localeCompare(b.courseName)),
    exploreCourses: all
      .filter(c => !c.isEnrolledInBatch)
      .sort((a, b) => a.courseName.localeCompare(b.courseName)),
  };
}

export async function findCatalogCoursesForStudent(
  student: StudentDocument,
): Promise<StudentCourseCard[]> {
  const lists = await findStudentCourseLists(student);
  const myIds = new Set(lists.myCourses.map(c => c.batchId));
  const catalog = [
    ...lists.assignedByAdmin.filter(c => !myIds.has(c.batchId)),
    ...lists.exploreCourses,
    ...lists.myCourses,
  ];
  const seen = new Set<string>();
  const merged: StudentCourseCard[] = [];
  for (const c of catalog) {
    if (seen.has(c.batchId)) continue;
    seen.add(c.batchId);
    merged.push(c);
  }
  return merged.sort((a, b) => a.courseName.localeCompare(b.courseName));
}

export async function findMyCoursesForStudent(
  student: StudentDocument,
): Promise<StudentCourseCard[]> {
  const lists = await findStudentCourseLists(student);
  return lists.myCourses;
}

export type CourseListFilters = {
  search: string;
  status: string;
  teacher: string;
  batch: string;
  paymentStatus: string;
};

export function applyCourseFilters(
  courses: StudentCourseCard[],
  filters: CourseListFilters,
): StudentCourseCard[] {
  return courses.filter(c => {
    if (filters.search) {
      const q = filters.search;
      if (
        !c.courseName.toLowerCase().includes(q) &&
        !c.batchName.toLowerCase().includes(q) &&
        !c.description.toLowerCase().includes(q) &&
        !c.teacherName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filters.status && filters.status !== "all") {
      if (c.displayStatus.toLowerCase() !== filters.status.toLowerCase()) return false;
    }
    if (filters.teacher && !c.teacherName.toLowerCase().includes(filters.teacher)) return false;
    if (filters.batch && !c.batchName.toLowerCase().includes(filters.batch)) return false;
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      const ps = (c.paymentStatus || "pending").toLowerCase();
      if (ps !== filters.paymentStatus) return false;
    }
    return true;
  });
}

export function courseFilterMeta(courses: StudentCourseCard[]) {
  const teachers = [...new Set(courses.map(c => c.teacherName).filter(t => t && t !== "—"))];
  const batches = [...new Set(courses.map(c => c.batchName))];
  return { teachers, batches };
}

async function buildAllCourseCards(student: StudentDocument): Promise<StudentCourseCard[]> {
  const studentOid = student._id;
  const studentIdStr = studentOid.toString();
  const studentEmail = (student.email || "").toLowerCase();

  const enrolledFilter = buildStudentBatchFilter(student);
  const catalogFilter: Record<string, unknown> = {
    batchStatus: { $in: ["Active", "Completed"] },
  };

  const [enrolledBatches, catalogBatches, allCourses, enrollments, paidPayments] = await Promise.all([
    Batch.find(enrolledFilter).populate("teacherIds", "fullName").lean(),
    Batch.find(catalogFilter).populate("teacherIds", "fullName").sort({ batchName: 1 }).lean(),
    Course.find({ status: "active" }).lean(),
    CourseEnrollment.find({ studentId: studentOid }).lean(),
    StudentPayment.find({ studentId: studentOid, status: "paid" })
      .sort({ paidAt: -1 })
      .select("batchId razorpayPaymentId receiptNumber")
      .lean(),
  ]);

  const lastPaymentByBatch = new Map<string, string>();
  for (const p of paidPayments) {
    const bid = p.batchId.toString();
    if (!lastPaymentByBatch.has(bid)) {
      lastPaymentByBatch.set(
        bid,
        p.razorpayPaymentId?.trim() || p.receiptNumber || "",
      );
    }
  }

  const enrollmentByBatch = new Map(
    enrollments.map(e => [e.batchId.toString(), e]),
  );

  const batchMap = new Map<string, BatchDocument>();
  for (const b of [...enrolledBatches, ...catalogBatches] as BatchDocument[]) {
    batchMap.set(b._id.toString(), b);
  }

  const cards: StudentCourseCard[] = [];

  for (const batch of batchMap.values()) {
    const batchId = batch._id.toString();
    const course = matchCourseForBatch(batch, allCourses as CourseDocument[]);
    const courseId = course?._id?.toString() ?? batchId;
    const enrollment = enrollmentByBatch.get(batchId);

    const isInRoster = (batch.students || []).some(s => {
      const sid = (s.studentId as mongoose.Types.ObjectId | undefined)?.toString?.() ?? s._id?.toString();
      return (
        sid === studentIdStr ||
        (studentEmail && (s.studentEmail || "").toLowerCase() === studentEmail)
      );
    });

    const capacity = batch.batchCapacity ?? batch.maxStudents ?? 30;
    const enrolledCount = batch.students?.length ?? 0;
    const fees = course?.discountFees ?? course?.totalFees ?? 0;
    const durationMonths = course?.duration ?? 3;
    const startDate =
      batch.startDate?.trim() ||
      batch.startMonth?.trim() ||
      (course?.startDate ? new Date(course.startDate).toISOString().slice(0, 10) : "");
    const endDate =
      batch.endDate?.trim() ||
      batch.endMonth?.trim() ||
      (course?.endDate ? new Date(course.endDate).toISOString().slice(0, 10) : "");

    const progress = progressFromBatch(batch);
    const completedTasks = Math.round((progress / 100) * 10);
    const remainingTasks = Math.max(0, 10 - completedTasks);

    let enrollmentStatus: StudentCourseCard["enrollmentStatus"] = "not_enrolled";
    if (enrollment?.paymentStatus === "paid" && enrollment.status === "enrolled") {
      enrollmentStatus = "enrolled";
    } else if (
      enrollment?.paymentStatus === "pending" ||
      enrollment?.paymentStatus === "partial"
    ) {
      enrollmentStatus = "payment_pending";
    } else if (isInRoster && fees > 0) {
      // Assigned to batch by admin but fee not paid via portal yet
      enrollmentStatus = "payment_pending";
    } else if (isInRoster) {
      enrollmentStatus = "enrolled";
    } else if (enrollment) {
      enrollmentStatus = "payment_pending";
    }

    const paymentStatus = enrollment?.paymentStatus ?? null;
    const enrollmentDate = enrollment?.enrollmentDate
      ? new Date(enrollment.enrollmentDate).toISOString().slice(0, 10)
      : null;

    cards.push({
      id: batchId,
      batchId,
      courseId,
      courseName: course?.courseTitle ?? batch.courseName,
      courseCode: course?.courseCode ?? "",
      description:
        course?.description?.trim() ||
        course?.notes?.trim() ||
        batch.description?.trim() ||
        "Structured art program with guided sessions and studio practice.",
      thumbnailUrl: course?.thumbnailUrl?.trim() || "",
      teacherName: formatTeacherNames(
        batch.teacherIds,
        Array.isArray(batch.teacherIds) &&
          batch.teacherIds.length > 0 &&
          typeof batch.teacherIds[0] === "object" &&
          batch.teacherIds[0] !== null &&
          "fullName" in (batch.teacherIds[0] as object),
      ),
      batchName: batch.batchName,
      batchDays: batch.batchDay || "",
      batchTiming: batch.batchTiming || `${batch.batchDay} · ${batch.batchTime}`,
      branch: batch.branch || "",
      durationMonths,
      startDate,
      endDate,
      availableSeats: Math.max(0, capacity - enrolledCount),
      courseFees: fees,
      progressPercent: isInRoster || enrollment?.status === "enrolled" ? progress : 0,
      displayStatus: resolveDisplayStatus(
        batch.batchStatus,
        startDate,
        paymentStatus,
        isInRoster,
      ),
      enrollmentStatus,
      paymentStatus,
      enrollmentDate,
      lastPaymentId: lastPaymentByBatch.get(batchId) || null,
      isEnrolledInBatch: isInRoster,
      completedTasks,
      remainingTasks,
    });
  }

  return cards.sort((a, b) => a.courseName.localeCompare(b.courseName));
}

export async function findCourseDetailForStudent(
  student: StudentDocument,
  batchId: string,
): Promise<StudentCourseCard | null> {
  const lists = await findStudentCourseLists(student);
  const all = [...lists.assignedByAdmin, ...lists.myCourses, ...lists.exploreCourses];
  return all.find(c => c.batchId === batchId) ?? null;
}

export async function addStudentToBatchRoster(
  batchId: string,
  student: StudentDocument,
): Promise<void> {
  const batch = await Batch.findById(batchId);
  if (!batch) throw new Error("NOT_FOUND");

  const email = (student.email || "").toLowerCase();
  const exists = batch.students.some(s => {
    const sid = (s.studentId as mongoose.Types.ObjectId | undefined)?.toString?.();
    return sid === student._id.toString() || (email && s.studentEmail?.toLowerCase() === email);
  });

  if (exists) return;

  if (batch.students.length >= (batch.batchCapacity ?? 30)) {
    throw new Error("BATCH_FULL");
  }

  batch.students.push({
    _id: new mongoose.Types.ObjectId(),
    studentId: student._id,
    studentName: student.fullName,
    studentEmail: student.email || "",
    phone: student.phone || "",
    course: batch.courseName,
    batchDay: batch.batchDay,
    batchTime: batch.batchTime,
    startMonth: batch.startMonth || "",
    endMonth: batch.endMonth || "",
  });
  await batch.save();
}

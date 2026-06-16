export type StudentPaymentMode = "full" | "partial";

export function getStudentPaymentMode(
  courses: Array<{
    paymentType?: string;
    paymentPlanStatus?: string;
    paymentStatus?: string;
    remainingAmount?: number;
    paidAmount?: number;
    totalAmount?: number;
  }>,
): StudentPaymentMode {
  const isPartial = courses.some(c => {
    if (c.paymentType === "installment") return true;

    const status = (c.paymentPlanStatus ?? c.paymentStatus ?? "").toLowerCase();
    const remaining = c.remainingAmount ?? 0;
    const total = c.totalAmount ?? 0;
    const paid = c.paidAmount ?? 0;

    if (c.paymentType === "full" && (status === "paid" || (total > 0 && paid >= total - 0.01))) {
      return false;
    }

    if (!c.paymentType && (status === "paid" || (total > 0 && paid >= total - 0.01))) {
      return false;
    }

    if (remaining > 0.01) return true;
    return ["partially_paid", "pending", "overdue"].includes(status);
  });
  return isPartial ? "partial" : "full";
}

export function getEnrollmentPaymentMode(
  course: {
    paymentType?: string;
    paymentPlanStatus?: string;
    paymentStatus?: string;
    remainingAmount?: number;
    paidAmount?: number;
    totalAmount?: number;
    installments?: Array<{ paymentStatus?: string }>;
  },
): StudentPaymentMode {
  if (course.installments && course.installments.length > 0) {
    return "partial";
  }
  return getStudentPaymentMode([course]);
}

export function getPaymentModeBreakdown(
  courses: Array<{
    courseTitle?: string;
    paymentType?: string;
    paymentPlanStatus?: string;
    paymentStatus?: string;
    remainingAmount?: number;
    paidAmount?: number;
    totalAmount?: number;
    installments?: Array<{ paymentStatus?: string }>;
  }>,
) {
  const items = courses.map(c => ({
    courseTitle: c.courseTitle ?? "Course",
    mode: getEnrollmentPaymentMode(c),
  }));
  const fullCourses = items.filter(i => i.mode === "full");
  const partialCourses = items.filter(i => i.mode === "partial");
  return {
    fullCount: fullCourses.length,
    partialCount: partialCourses.length,
    fullCourses: fullCourses.map(i => i.courseTitle),
    partialCourses: partialCourses.map(i => i.courseTitle),
    items,
  };
}

export function filterCoursesByPaymentMode<
  T extends {
    paymentType?: string;
    paymentPlanStatus?: string;
    paymentStatus?: string;
    remainingAmount?: number;
    paidAmount?: number;
    totalAmount?: number;
    installments?: Array<{ paymentStatus?: string }>;
  },
>(courses: T[], mode: "all" | StudentPaymentMode): T[] {
  if (mode === "all") return courses;
  return courses.filter(c => getEnrollmentPaymentMode(c) === mode);
}

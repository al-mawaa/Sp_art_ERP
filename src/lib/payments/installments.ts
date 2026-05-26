import type { InstallmentType } from "@/lib/models/CourseEnrollment";

export function installmentCount(type: InstallmentType, courseDurationMonths: number): number {
  if (type === "full") return 1;
  if (type === "two_installments") return 2;
  return Math.max(1, courseDurationMonths || 3);
}

export function installmentAmount(total: number, type: InstallmentType, durationMonths: number): number {
  const count = installmentCount(type, durationMonths);
  return Math.round(total / count);
}

export function nextDueDateString(monthsAhead = 1): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toISOString().slice(0, 10);
}

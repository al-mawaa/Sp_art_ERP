import { z } from "zod";

export const QUERY_CATEGORIES = [
  "profile_correction",
  "switch_batch",
  "course_change",
  "fee_related",
  "attendance_correction",
  "other",
] as const;

export type QueryCategory = (typeof QUERY_CATEGORIES)[number];

export const QUERY_CATEGORY_LABELS: Record<QueryCategory, string> = {
  profile_correction: "Profile Correction",
  switch_batch: "Switch Batch Request",
  course_change: "Course Change Request",
  fee_related: "Fee Related Query",
  attendance_correction: "Attendance Correction",
  other: "Other",
};

export const QUERY_CATEGORY_BADGE_LABELS: Record<QueryCategory, string> = {
  profile_correction: "PROFILE CORRECTION",
  switch_batch: "SWITCH BATCH",
  course_change: "COURSE CHANGE",
  fee_related: "FEE QUERY",
  attendance_correction: "ATTENDANCE",
  other: "OTHER",
};

export const QUERY_CATEGORY_COLORS: Record<QueryCategory, string> = {
  profile_correction: "bg-sky-50 text-sky-800 border-sky-200",
  switch_batch: "bg-violet-50 text-violet-800 border-violet-200",
  course_change: "bg-indigo-50 text-indigo-800 border-indigo-200",
  fee_related: "bg-amber-50 text-amber-900 border-amber-200",
  attendance_correction: "bg-teal-50 text-teal-800 border-teal-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

export function isQueryCategory(value: string): value is QueryCategory {
  return (QUERY_CATEGORIES as readonly string[]).includes(value);
}

export function getCategoryLabel(category: string): string {
  return isQueryCategory(category)
    ? QUERY_CATEGORY_LABELS[category]
    : QUERY_CATEGORY_LABELS.other;
}

export function getCategoryBadgeLabel(category: string): string {
  return isQueryCategory(category)
    ? QUERY_CATEGORY_BADGE_LABELS[category]
    : QUERY_CATEGORY_BADGE_LABELS.other;
}

export function getCategoryBadgeClass(category: string): string {
  return isQueryCategory(category)
    ? QUERY_CATEGORY_COLORS[category]
    : QUERY_CATEGORY_COLORS.other;
}

export const queryCategoryFieldsSchema = z.object({
  requestedChanges: z.string().trim().optional(),
  currentBatchId: z.string().trim().optional(),
  requestedBatchId: z.string().trim().optional(),
  currentBatchName: z.string().trim().optional(),
  requestedBatchName: z.string().trim().optional(),
  currentCourseId: z.string().trim().optional(),
  requestedCourseId: z.string().trim().optional(),
  currentCourseName: z.string().trim().optional(),
  requestedCourseName: z.string().trim().optional(),
  attendanceDate: z.string().trim().optional(),
  currentAttendanceStatus: z.string().trim().optional(),
  requestedAttendanceStatus: z.string().trim().optional(),
});

export type QueryCategoryFields = z.infer<typeof queryCategoryFieldsSchema>;

export type CreateQueryFormFields = QueryCategoryFields & {
  category: QueryCategory;
  remarks: string;
};

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function buildCreateQuerySchema(nameKey: string, emailKey: string) {
  return z
    .object({
      [nameKey]: z.string().trim().min(2, "Name must be at least 2 characters"),
      [emailKey]: z.string().trim().email("Enter a valid email"),
      category: z.enum(QUERY_CATEGORIES, { required_error: "Category is required" }),
      remarks: z.string().trim().min(10, "Remarks must be at least 10 characters"),
    })
    .merge(queryCategoryFieldsSchema)
    .superRefine((raw, ctx) => {
      const data = raw as CreateQueryFormFields;
      const category = data.category;
      if (category === "profile_correction" && !trimmed(data.requestedChanges)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["requestedChanges"],
          message: "Describe the profile changes you need",
        });
      }
      if (category === "switch_batch") {
        if (!trimmed(data.currentBatchName) && !trimmed(data.currentBatchId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["currentBatchName"],
            message: "Current batch is required",
          });
        }
        if (!trimmed(data.requestedBatchName) && !trimmed(data.requestedBatchId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["requestedBatchName"],
            message: "Requested batch is required",
          });
        }
      }
      if (category === "course_change") {
        if (!trimmed(data.currentCourseName) && !trimmed(data.currentCourseId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["currentCourseName"],
            message: "Current course is required",
          });
        }
        if (!trimmed(data.requestedCourseName) && !trimmed(data.requestedCourseId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["requestedCourseName"],
            message: "Requested course is required",
          });
        }
      }
      if (category === "attendance_correction") {
        if (!trimmed(data.attendanceDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["attendanceDate"],
            message: "Attendance date is required",
          });
        }
        if (!trimmed(data.requestedAttendanceStatus)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["requestedAttendanceStatus"],
            message: "Requested status is required",
          });
        }
      }
    });
}

export function extractCategoryPayload(data: QueryCategoryFields & { category: QueryCategory }) {
  const payload: Record<string, string | undefined> = {};
  if (data.category === "profile_correction" && data.requestedChanges) {
    payload.requestedChanges = data.requestedChanges.trim();
  }
  if (data.category === "switch_batch") {
    if (data.currentBatchId) payload.currentBatchId = data.currentBatchId.trim();
    if (data.requestedBatchId) payload.requestedBatchId = data.requestedBatchId.trim();
    if (data.currentBatchName) payload.currentBatchName = data.currentBatchName.trim();
    if (data.requestedBatchName) payload.requestedBatchName = data.requestedBatchName.trim();
  }
  if (data.category === "course_change") {
    if (data.currentCourseId) payload.currentCourseId = data.currentCourseId.trim();
    if (data.requestedCourseId) payload.requestedCourseId = data.requestedCourseId.trim();
    if (data.currentCourseName) payload.currentCourseName = data.currentCourseName.trim();
    if (data.requestedCourseName) payload.requestedCourseName = data.requestedCourseName.trim();
  }
  if (data.category === "attendance_correction") {
    if (data.attendanceDate) payload.attendanceDate = data.attendanceDate.trim();
    if (data.currentAttendanceStatus) payload.currentAttendanceStatus = data.currentAttendanceStatus.trim();
    if (data.requestedAttendanceStatus) payload.requestedAttendanceStatus = data.requestedAttendanceStatus.trim();
  }
  return payload;
}

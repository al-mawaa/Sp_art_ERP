import { z } from "zod";
import { isDateBeforeToday, PAST_DATE_MESSAGE } from "@/lib/leave/dateValidation";

export const staffAttendanceStatusSchema = z.enum(["Present", "Absent", "Half Day"]);

export const staffAttendanceMarkSchema = z.object({
  attendanceDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .refine(d => !isDateBeforeToday(d), PAST_DATE_MESSAGE),
  status: staffAttendanceStatusSchema,
  remarks: z.string().trim().max(500).optional().default(""),
});

/** Legacy batch detail mark (today only). */
export const teacherAttendanceMarkSchema = z.object({
  status: staffAttendanceStatusSchema,
  remarks: z.string().trim().max(500).optional().default(""),
});

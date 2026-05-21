import { z } from "zod";

export const BATCH_DAY_OPTIONS = [
  "Mon-Wed-Fri",
  "Tue-Thu",
  "Weekend (Sat-Sun)",
  "Monday only",
  "Daily",
  "Custom / Other",
] as const;

export const COURSE_OPTIONS = [
  "Foundation Art",
  "Drawing & Sketching",
  "Watercolour",
  "Acrylic Painting",
  "Oil Painting",
  "Digital Art",
  "Craft & Mixed Media",
  "Portfolio Prep",
  "Other",
] as const;

export const batchStudentInputSchema = z.object({
  studentName: z.string().trim().min(1, "Student name is required"),
  studentEmail: z
    .string()
    .trim()
    .default("")
    .refine(v => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid student email"),
  phone: z.string().trim().optional().default(""),
  course: z.string().trim().optional().default(""),
  batchDay: z.string().trim().optional().default(""),
  batchTime: z.string().trim().optional().default(""),
  startMonth: z.string().trim().optional().default(""),
  endMonth: z.string().trim().optional().default(""),
});

export const batchWriteSchema = z.object({
  batchName: z.string().trim().min(2, "Batch name is required"),
  courseName: z.string().trim().min(1, "Course is required"),
  batchDay: z.string().trim().min(1, "Batch day is required"),
  batchTime: z.string().trim().min(1, "Batch time is required"),
  startMonth: z.string().trim().min(1, "Start month is required"),
  endMonth: z.string().trim().min(1, "End month is required"),
  branch: z.string().trim().min(1, "Branch is required"),
  batchCapacity: z.coerce.number().int().min(1).max(500),
  description: z.string().trim().optional().default(""),
  students: z.array(batchStudentInputSchema).optional().default([]),
  teacherIds: z.array(z.string().min(1)).optional().default([]),
});

export type BatchWriteInput = z.infer<typeof batchWriteSchema>;

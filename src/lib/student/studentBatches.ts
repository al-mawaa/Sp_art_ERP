import mongoose from "mongoose";
import Batch, { type BatchDocument } from "@/lib/models/Batch";
import type { StudentDocument } from "@/lib/models/Student";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";

// Ensure models are registered to prevent populate errors
const _models = { Teacher, SeniorTeacher };

export type StudentClassCard = {
  id: string;
  batchTime: string;
  batchName: string;
  courseName: string;
  batchDays: string;
  teachers: string;
  teacherName: string;
  seniorTeachers: string;
  branch: string;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Batches where embedded roster matches logged-in student (id, email, or name). */
export function buildStudentBatchFilter(student: StudentDocument): Record<string, unknown> {
  const clauses: Record<string, unknown>[] = [];
  const studentOid = student._id;

  clauses.push({ students: { $elemMatch: { _id: studentOid } } });

  const email = (student.email || "").trim();
  if (email) {
    const rx = new RegExp(`^${escapeRegex(email)}$`, "i");
    clauses.push({ students: { $elemMatch: { studentEmail: rx } } });
  }

  const name = student.fullName.trim();
  if (name) {
    const rx = new RegExp(`^${escapeRegex(name)}$`, "i");
    clauses.push({ students: { $elemMatch: { studentName: rx } } });
  }

  return {
    $or: clauses,
    batchStatus: { $in: ["Active", "Completed"] },
  };
}

function formatTeacherNames(
  teacherIds: BatchDocument["teacherIds"],
  populated: boolean,
): string {
  if (!populated || !teacherIds?.length) return "";
  const teachers = teacherIds as unknown as { fullName?: string }[];
  return teachers
    .map(t => (t.fullName || "").trim())
    .filter(Boolean)
    .join(", ");
}

function formatSeniorTeacherNames(
  seniorTeacherIds: BatchDocument["seniorTeacherIds"],
  populated: boolean,
): string {
  if (!populated || !seniorTeacherIds?.length) return "";
  const teachers = seniorTeacherIds as unknown as { fullName?: string }[];
  return teachers
    .map(t => (t.fullName || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function toStudentClassCard(doc: BatchDocument): StudentClassCard {
  const populated = doc.populated("teacherIds");
  const seniorPopulated = doc.populated("seniorTeacherIds");
  const batchDays = doc.batchDay?.trim() || "";
  const batchTime = doc.batchTime?.trim() || doc.batchTiming?.trim() || "";

  const teacherNames = formatTeacherNames(doc.teacherIds, Boolean(populated));
  const seniorTeacherNames = formatSeniorTeacherNames(doc.seniorTeacherIds, Boolean(seniorPopulated));
  return {
    id: doc._id.toString(),
    batchTime,
    batchName: doc.batchName,
    courseName: doc.courseName,
    batchDays,
    teachers: teacherNames,
    teacherName: teacherNames,
    seniorTeachers: seniorTeacherNames,
    branch: doc.branch?.trim() || "",
  };
}

export async function findBatchesForStudent(student: StudentDocument): Promise<StudentClassCard[]> {
  const filter = buildStudentBatchFilter(student);
  const rows = await Batch.find(filter)
    .sort({ batchTime: 1, batchName: 1 })
    .populate("teacherIds", "fullName")
    .populate("seniorTeacherIds", "fullName");

  return rows.map(d => toStudentClassCard(d as BatchDocument));
}

import mongoose from "mongoose";
import type { BatchDocument, BatchEmbeddedStudent } from "@/lib/models/Batch";

function serializeStudent(s: BatchEmbeddedStudent) {
  return {
    id: s._id.toString(),
    studentName: s.studentName,
    studentEmail: s.studentEmail,
    phone: s.phone,
    course: s.course,
    batchDay: s.batchDay,
    batchTime: s.batchTime,
    startMonth: s.startMonth,
    endMonth: s.endMonth,
  };
}

function serializeTeacher(t: { _id: mongoose.Types.ObjectId; fullName?: string; email?: string }) {
  return {
    id: t._id.toString(),
    fullName: t.fullName ?? "",
    email: t.email ?? "",
  };
}

export function serializeBatch(doc: BatchDocument) {
  const populated = doc.populated("teacherIds");
  let teachers: ReturnType<typeof serializeTeacher>[] | undefined;
  let teacherIds: string[];

  if (populated) {
    const pts = doc.teacherIds as unknown as { _id: mongoose.Types.ObjectId; fullName?: string; email?: string }[];
    teachers = pts.map(serializeTeacher);
    teacherIds = teachers.map(t => t.id);
  } else {
    teacherIds = (doc.teacherIds as mongoose.Types.ObjectId[]).map(id => id.toString());
  }

  return {
    id: doc._id.toString(),
    batchName: doc.batchName,
    courseName: doc.courseName,
    batchDay: doc.batchDay,
    batchTime: doc.batchTime,
    startMonth: doc.startMonth,
    endMonth: doc.endMonth,
    branch: doc.branch,
    batchCapacity: doc.batchCapacity,
    description: doc.description,
    students: doc.students.map(serializeStudent),
    teacherIds,
    teachers,
    totalStudents: doc.students.length,
    attendanceSummary: doc.attendanceSummary,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

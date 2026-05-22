import type { LeaveDocument, LeaveType } from "@/lib/models/Leave";
import TeacherLeaveBalance, { DEFAULT_LEAVE_BALANCE } from "@/lib/models/TeacherLeaveBalance";
import mongoose from "mongoose";

export function countLeaveDays(fromDate: string, toDate: string): number {
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

export function serializeLeave(doc: LeaveDocument) {
  return {
    id: doc._id.toString(),
    teacherId: doc.teacherId.toString(),
    teacherName: doc.teacherName,
    teacherEmail: doc.teacherEmail,
    leaveType: doc.leaveType,
    type: doc.leaveType,
    fromDate: doc.fromDate,
    toDate: doc.toDate,
    from: doc.fromDate,
    to: doc.toDate,
    reason: doc.reason,
    status: doc.status,
    adminRemark: doc.adminRemark ?? "",
    daysCount: doc.daysCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function getOrCreateBalance(teacherId: string) {
  const oid = new mongoose.Types.ObjectId(teacherId);
  let balance = await TeacherLeaveBalance.findOne({ teacherId: oid });
  if (!balance) {
    balance = await TeacherLeaveBalance.create({
      teacherId: oid,
      ...DEFAULT_LEAVE_BALANCE,
    });
  }
  return balance;
}

export function balanceKeyForType(leaveType: LeaveType): "casual" | "sick" | "personal" {
  if (leaveType === "Sick") return "sick";
  if (leaveType === "Personal") return "personal";
  return "casual";
}

/** Balance deduction disabled — leave days are not capped. Kept for API compatibility. */
export async function deductBalance(teacherId: string, _leaveType: LeaveType, _days: number) {
  const balance = await getOrCreateBalance(teacherId);
  return { ok: true as const, balance };
}

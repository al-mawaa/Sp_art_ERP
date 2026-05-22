import type { LeaveType } from "@/lib/models/Leave";
import type { SeniorTeacherLeaveDocument } from "@/lib/models/SeniorTeacherLeave";
import SeniorTeacherLeaveBalance, {
  DEFAULT_SENIOR_LEAVE_BALANCE,
} from "@/lib/models/SeniorTeacherLeaveBalance";
import mongoose from "mongoose";
import { countLeaveDays } from "@/lib/leave/utils";

export { countLeaveDays };

export function serializeSeniorLeave(doc: SeniorTeacherLeaveDocument) {
  return {
    id: doc._id.toString(),
    seniorTeacherId: doc.seniorTeacherId.toString(),
    seniorTeacherName: doc.seniorTeacherName,
    seniorTeacherEmail: doc.seniorTeacherEmail,
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

export async function getOrCreateSeniorBalance(seniorTeacherId: string) {
  const oid = new mongoose.Types.ObjectId(seniorTeacherId);
  let balance = await SeniorTeacherLeaveBalance.findOne({ seniorTeacherId: oid });
  if (!balance) {
    balance = await SeniorTeacherLeaveBalance.create({
      seniorTeacherId: oid,
      ...DEFAULT_SENIOR_LEAVE_BALANCE,
    });
  }
  return balance;
}

/** Balance deduction disabled — leave days are not capped. Kept for API compatibility. */
export async function deductSeniorBalance(seniorTeacherId: string, _leaveType: LeaveType, _days: number) {
  const balance = await getOrCreateSeniorBalance(seniorTeacherId);
  return { ok: true as const, balance };
}

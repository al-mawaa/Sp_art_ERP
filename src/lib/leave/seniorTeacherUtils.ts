import type { LeaveType } from "@/lib/models/Leave";
import type { SeniorTeacherLeaveDocument } from "@/lib/models/SeniorTeacherLeave";
import SeniorTeacherLeaveBalance, {
  DEFAULT_SENIOR_LEAVE_BALANCE,
} from "@/lib/models/SeniorTeacherLeaveBalance";
import mongoose from "mongoose";
import { countLeaveDays, balanceKeyForType } from "@/lib/leave/utils";

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

export async function deductSeniorBalance(
  seniorTeacherId: string,
  leaveType: LeaveType,
  days: number,
) {
  const balance = await getOrCreateSeniorBalance(seniorTeacherId);
  const key = balanceKeyForType(leaveType);
  if (balance[key] < days) {
    return {
      ok: false as const,
      message: `Insufficient ${leaveType} leave balance (${balance[key]} days left)`,
    };
  }
  balance[key] -= days;
  await balance.save();
  return { ok: true as const, balance };
}

import mongoose from "mongoose";
import SalaryProfile, { type PayrollStaffType } from "@/lib/models/SalaryProfile";
import PayrollRun, { type PayrollStatus } from "@/lib/models/PayrollRun";
import PayrollEntry from "@/lib/models/PayrollEntry";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import Batch from "@/lib/models/Batch";
import TeacherAttendance from "@/lib/models/TeacherAttendance";
import Leave from "@/lib/models/Leave";
import SeniorTeacherLeave from "@/lib/models/SeniorTeacherLeave";

type AttendanceSummary = {
  present: number;
  absent: number;
  halfDay: number;
};

type LeaveSummary = {
  approved: number;
  rejected: number;
  pending: number;
};

const DAY_ALIASES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

function ensureMonth(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Invalid month format. Use YYYY-MM");
  }
  return month;
}

function monthBounds(month: string) {
  const [year, monthNo] = month.split("-").map(Number);
  const start = new Date(year, monthNo - 1, 1);
  const end = new Date(year, monthNo, 0);
  const endDate = `${month}-${String(end.getDate()).padStart(2, "0")}`;
  return { start, end, startDate: `${month}-01`, endDate };
}

function parseBatchDays(batchDay: string): number[] {
  const tokens = batchDay
    .toLowerCase()
    .split(/[^a-z]+/)
    .map(t => t.trim())
    .filter(Boolean);

  const unique = new Set<number>();
  for (const token of tokens) {
    if (DAY_ALIASES[token] !== undefined) unique.add(DAY_ALIASES[token]);
  }
  return [...unique];
}

function countOccurrencesInMonth(days: number[], start: Date, end: Date): number {
  if (!days.length) return 0;
  const daySet = new Set(days);
  const cursor = new Date(start);
  let count = 0;
  while (cursor <= end) {
    if (daySet.has(cursor.getDay())) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

async function ensureSalaryProfiles(): Promise<void> {
  const [teachers, seniors] = await Promise.all([
    Teacher.find({}).select("_id fullName badgeId salary joiningDate status").lean(),
    SeniorTeacher.find({}).select("_id fullName badgeId salary joiningDate status").lean(),
  ]);

  await Promise.all([
    ...teachers.map(async t => {
      const existing = await SalaryProfile.findOne({ staffType: "teacher", staffId: t._id });
      if (!existing) {
        await SalaryProfile.create({
          staffType: "teacher",
          staffId: t._id,
          staffName: t.fullName ?? "Teacher",
          employeeId: t.badgeId ?? `TEACH-${t._id.toString().slice(-6).toUpperCase()}`,
          monthlySalary: Math.max(0, Number(t.salary ?? 0)),
          joiningDate: t.joiningDate ? new Date(t.joiningDate) : new Date(),
          status: t.status === "Inactive" ? "Inactive" : "Active",
        });
        return;
      }
      existing.staffName = t.fullName ?? "Teacher";
      existing.employeeId = t.badgeId ?? `TEACH-${t._id.toString().slice(-6).toUpperCase()}`;
      existing.status = t.status === "Inactive" ? "Inactive" : "Active";
      if (!existing.joiningDate) existing.joiningDate = t.joiningDate ? new Date(t.joiningDate) : new Date();
      await existing.save();
    }),
    ...seniors.map(async s => {
      const existing = await SalaryProfile.findOne({ staffType: "senior_teacher", staffId: s._id });
      if (!existing) {
        await SalaryProfile.create({
          staffType: "senior_teacher",
          staffId: s._id,
          staffName: s.fullName ?? "Senior Teacher",
          employeeId: s.badgeId ?? `SEN-${s._id.toString().slice(-6).toUpperCase()}`,
          monthlySalary: Math.max(0, Number(s.salary ?? 0)),
          joiningDate: s.joiningDate ? new Date(s.joiningDate) : new Date(),
          status: s.status === "Inactive" ? "Inactive" : "Active",
        });
        return;
      }
      existing.staffName = s.fullName ?? "Senior Teacher";
      existing.employeeId = s.badgeId ?? `SEN-${s._id.toString().slice(-6).toUpperCase()}`;
      existing.status = s.status === "Inactive" ? "Inactive" : "Active";
      if (!existing.joiningDate) existing.joiningDate = s.joiningDate ? new Date(s.joiningDate) : new Date();
      await existing.save();
    }),
  ]);
}

async function getBatchSessionCounts(
  staffType: PayrollStaffType,
  staffId: mongoose.Types.ObjectId,
  month: string,
) {
  const { start, end } = monthBounds(month);
  const filter: Record<string, unknown> =
    staffType === "teacher"
      ? { teacherIds: staffId, batchStatus: { $in: ["Active", "Completed"] as const } }
      : { seniorTeacherIds: staffId, batchStatus: { $in: ["Active", "Completed"] as const } };
  const batches = await Batch.find(filter).select("batchName batchDay").lean();

  let weekdaySessions = 0;
  let weekendSessions = 0;
  for (const batch of batches) {
    const days = parseBatchDays(batch.batchDay ?? "");
    const monthlySessions = countOccurrencesInMonth(days, start, end);
    if (monthlySessions === 0) continue;
    if (days.some(d => d === 0 || d === 6)) weekendSessions += monthlySessions;
    if (days.some(d => d >= 1 && d <= 5)) weekdaySessions += monthlySessions;
  }

  return {
    weekdayBatches: weekdaySessions,
    weekendBatches: weekendSessions,
    totalBatches: weekdaySessions + weekendSessions,
  };
}

async function getAttendanceSummary(
  staffType: PayrollStaffType,
  staffId: mongoose.Types.ObjectId,
  month: string,
): Promise<AttendanceSummary> {
  const role = staffType === "teacher" ? "teacher" : "senior-teacher";
  const { startDate, endDate } = monthBounds(month);
  const [present, absent, halfDay] = await Promise.all([
    TeacherAttendance.countDocuments({
      role,
      teacherId: staffId,
      attendanceDate: { $gte: startDate, $lte: endDate },
      status: "Present",
    }),
    TeacherAttendance.countDocuments({
      role,
      teacherId: staffId,
      attendanceDate: { $gte: startDate, $lte: endDate },
      status: "Absent",
    }),
    TeacherAttendance.countDocuments({
      role,
      teacherId: staffId,
      attendanceDate: { $gte: startDate, $lte: endDate },
      status: "Half Day",
    }),
  ]);
  return { present, absent, halfDay };
}

async function getLeaveSummary(
  staffType: PayrollStaffType,
  staffId: mongoose.Types.ObjectId,
  month: string,
): Promise<LeaveSummary> {
  const { startDate, endDate } = monthBounds(month);
  const docs =
    staffType === "teacher"
      ? await Leave.find({
          teacherId: staffId,
          fromDate: { $lte: endDate },
          toDate: { $gte: startDate },
        })
          .select("status daysCount")
          .lean()
      : await SeniorTeacherLeave.find({
          seniorTeacherId: staffId,
          fromDate: { $lte: endDate },
          toDate: { $gte: startDate },
        })
          .select("status daysCount")
          .lean();

  let approved = 0;
  let rejected = 0;
  let pending = 0;
  for (const doc of docs) {
    const days = Math.max(1, Number(doc.daysCount ?? 1));
    if (doc.status === "Approved") approved += days;
    if (doc.status === "Rejected") rejected += days;
    if (doc.status === "Pending") pending += days;
  }
  return { approved, rejected, pending };
}

export type PayrollEntryDto = {
  id: string;
  month: string;
  payrollRunId: string;
  staffType: PayrollStaffType;
  staffId: string;
  staffName: string;
  employeeId: string;
  monthlySalary: number;
  weekdayBatches: number;
  weekendBatches: number;
  totalBatches: number;
  salaryPerBatch: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  leaveCount: number;
  rejectedLeaveCount: number;
  pendingLeaveCount: number;
  deductionAmount: number;
  netSalary: number;
  payrollStatus: PayrollStatus;
  remarks: string;
};

function toPayrollEntryDto(row: {
  _id: mongoose.Types.ObjectId;
  payrollRunId: mongoose.Types.ObjectId;
  month: string;
  staffType: PayrollStaffType;
  staffId: mongoose.Types.ObjectId;
  staffName: string;
  employeeId: string;
  monthlySalary: number;
  weekdayBatches: number;
  weekendBatches: number;
  totalBatches: number;
  salaryPerBatch: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  leaveCount: number;
  rejectedLeaveCount: number;
  pendingLeaveCount: number;
  deductionAmount: number;
  netSalary: number;
  payrollStatus: PayrollStatus;
  remarks: string;
}): PayrollEntryDto {
  return {
    id: row._id.toString(),
    payrollRunId: row.payrollRunId.toString(),
    month: row.month,
    staffType: row.staffType,
    staffId: row.staffId.toString(),
    staffName: row.staffName,
    employeeId: row.employeeId,
    monthlySalary: row.monthlySalary,
    weekdayBatches: row.weekdayBatches,
    weekendBatches: row.weekendBatches,
    totalBatches: row.totalBatches,
    salaryPerBatch: row.salaryPerBatch,
    presentCount: row.presentCount,
    absentCount: row.absentCount,
    halfDayCount: row.halfDayCount,
    leaveCount: row.leaveCount,
    rejectedLeaveCount: row.rejectedLeaveCount,
    pendingLeaveCount: row.pendingLeaveCount,
    deductionAmount: row.deductionAmount,
    netSalary: row.netSalary,
    payrollStatus: row.payrollStatus,
    remarks: row.remarks,
  };
}

export async function listSalaryProfiles() {
  await ensureSalaryProfiles();
  const rows = await SalaryProfile.find({}).sort({ staffType: 1, staffName: 1 }).lean();
  return rows.map(r => ({
    id: r._id.toString(),
    staffType: r.staffType,
    staffId: r.staffId.toString(),
    staffName: r.staffName,
    employeeId: r.employeeId,
    monthlySalary: r.monthlySalary,
    joiningDate: r.joiningDate ? new Date(r.joiningDate).toISOString() : "",
    status: r.status,
  }));
}

export async function updateSalaryProfile(input: {
  id: string;
  monthlySalary: number;
  joiningDate?: string;
  status?: "Active" | "Inactive";
}) {
  const row = await SalaryProfile.findById(input.id);
  if (!row) throw new Error("Salary profile not found");
  row.monthlySalary = Math.max(0, input.monthlySalary);
  if (input.joiningDate) row.joiningDate = new Date(input.joiningDate);
  if (input.status) row.status = input.status;
  await row.save();

  if (row.staffType === "teacher") {
    await Teacher.findByIdAndUpdate(row.staffId, { $set: { salary: row.monthlySalary } });
  } else {
    await SeniorTeacher.findByIdAndUpdate(row.staffId, { $set: { salary: row.monthlySalary } });
  }
}

type SalaryProfileDoc = {
  staffType: PayrollStaffType;
  staffId: mongoose.Types.ObjectId;
  staffName: string;
  employeeId: string;
  monthlySalary: number;
};

async function ensurePayrollRun(month: string) {
  let run = await PayrollRun.findOne({ month });
  if (!run) {
    run = await PayrollRun.create({ month, payrollStatus: "Pending" });
  }
  return run;
}

async function computePayrollEntryFields(
  profile: SalaryProfileDoc,
  month: string,
  payrollRunId: mongoose.Types.ObjectId,
) {
  const staffId = profile.staffId;
  const [batchCounts, attendance, leave] = await Promise.all([
    getBatchSessionCounts(profile.staffType, staffId, month),
    getAttendanceSummary(profile.staffType, staffId, month),
    getLeaveSummary(profile.staffType, staffId, month),
  ]);

  const monthlySalary = Math.max(0, Number(profile.monthlySalary ?? 0));
  const salaryPerBatch = batchCounts.totalBatches > 0 ? monthlySalary / batchCounts.totalBatches : 0;
  const absentDeduction = salaryPerBatch * attendance.absent;
  const halfDayDeduction = salaryPerBatch * 0.5 * attendance.halfDay;
  const rejectedLeaveDeduction = salaryPerBatch * leave.rejected;
  const deductionAmount = Number((absentDeduction + halfDayDeduction + rejectedLeaveDeduction).toFixed(2));
  const netSalary = Math.max(0, Number((monthlySalary - deductionAmount).toFixed(2)));
  const remarks =
    leave.pending > 0 ? `Hold calculation: ${leave.pending} pending leave day(s).` : "";

  return {
    payrollRunId,
    month,
    staffType: profile.staffType,
    staffId,
    staffName: profile.staffName,
    employeeId: profile.employeeId,
    monthlySalary,
    weekdayBatches: batchCounts.weekdayBatches,
    weekendBatches: batchCounts.weekendBatches,
    totalBatches: batchCounts.totalBatches,
    salaryPerBatch: Number(salaryPerBatch.toFixed(2)),
    presentCount: attendance.present,
    absentCount: attendance.absent,
    halfDayCount: attendance.halfDay,
    leaveCount: leave.approved,
    rejectedLeaveCount: leave.rejected,
    pendingLeaveCount: leave.pending,
    deductionAmount,
    netSalary,
    payrollStatus: (leave.pending > 0 ? "Pending" : "Generated") as PayrollStatus,
    remarks,
  };
}

async function recalculatePayrollRunSummary(month: string) {
  const entries = await PayrollEntry.find({ month }).lean();
  const run = await ensurePayrollRun(month);

  const summary = {
    totalStaff: entries.length,
    totalMonthlySalary: Number(
      entries.reduce((sum, row) => sum + Number(row.monthlySalary ?? 0), 0).toFixed(2),
    ),
    totalDeductions: Number(
      entries.reduce((sum, row) => sum + Number(row.deductionAmount ?? 0), 0).toFixed(2),
    ),
    totalNetSalary: Number(entries.reduce((sum, row) => sum + Number(row.netSalary ?? 0), 0).toFixed(2)),
  };

  const statuses = entries.map(row => row.payrollStatus);
  let payrollStatus: PayrollStatus = "Pending";
  if (statuses.length > 0) {
    if (statuses.every(status => status === "Paid")) payrollStatus = "Paid";
    else if (statuses.every(status => status === "Approved" || status === "Paid")) payrollStatus = "Approved";
    else if (statuses.some(status => status !== "Pending")) payrollStatus = "Generated";
  }

  run.summary = summary;
  run.payrollStatus = payrollStatus;
  if (payrollStatus === "Approved" && !run.approvedAt) run.approvedAt = new Date();
  if (payrollStatus === "Paid" && !run.paidAt) run.paidAt = new Date();
  await run.save();
}

export async function generatePayrollForProfiles(monthInput: string, profileIds: string[]) {
  const month = ensureMonth(monthInput);
  await ensureSalaryProfiles();

  const ids = profileIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (ids.length === 0) throw new Error("No valid salary profiles selected");

  const run = await ensurePayrollRun(month);
  run.generatedAt = new Date();
  await run.save();

  const profiles = await SalaryProfile.find({ _id: { $in: ids }, status: "Active" }).lean();
  const bulkOps: Array<{ updateOne: { filter: Record<string, unknown>; update: Record<string, unknown>; upsert: true } }> =
    [];

  for (const profile of profiles) {
    const fields = await computePayrollEntryFields(
      {
        staffType: profile.staffType,
        staffId: profile.staffId as mongoose.Types.ObjectId,
        staffName: profile.staffName,
        employeeId: profile.employeeId,
        monthlySalary: Number(profile.monthlySalary ?? 0),
      },
      month,
      run._id as mongoose.Types.ObjectId,
    );

    bulkOps.push({
      updateOne: {
        filter: { month, staffType: profile.staffType, staffId: profile.staffId },
        update: { $set: fields },
        upsert: true,
      },
    });
  }

  if (bulkOps.length > 0) {
    await PayrollEntry.bulkWrite(bulkOps, { ordered: false });
  }

  await recalculatePayrollRunSummary(month);
  return getPayrollByMonth(month);
}

export async function generatePayrollForMonth(monthInput: string) {
  const month = ensureMonth(monthInput);
  await ensureSalaryProfiles();
  const profiles = await SalaryProfile.find({ status: "Active" }).select("_id").lean();
  return generatePayrollForProfiles(
    month,
    profiles.map(profile => profile._id.toString()),
  );
}

export async function updatePayrollStatusesForProfiles(
  monthInput: string,
  profileIds: string[],
  payrollStatus: PayrollStatus,
) {
  const month = ensureMonth(monthInput);
  const ids = profileIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (ids.length === 0) throw new Error("No valid salary profiles selected");

  const profiles = await SalaryProfile.find({ _id: { $in: ids } }).lean();
  let updated = 0;

  for (const profile of profiles) {
    const entry = await PayrollEntry.findOne({
      month,
      staffType: profile.staffType,
      staffId: profile.staffId,
    });
    if (!entry) continue;
    entry.payrollStatus = payrollStatus;
    await entry.save();
    updated += 1;
  }

  if (updated === 0) {
    throw new Error("Generate payroll first for the selected staff");
  }

  await recalculatePayrollRunSummary(month);
  return getPayrollByMonth(month);
}

export async function getPayrollByMonth(monthInput: string) {
  const month = ensureMonth(monthInput);
  const run = await PayrollRun.findOne({ month }).lean();
  const rows = await PayrollEntry.find({ month }).sort({ staffType: 1, staffName: 1 }).lean();
  return {
    run: run
      ? {
          id: run._id.toString(),
          month: run.month,
          payrollStatus: run.payrollStatus,
          summary: run.summary,
          generatedAt: run.generatedAt ? new Date(run.generatedAt).toISOString() : null,
          approvedAt: run.approvedAt ? new Date(run.approvedAt).toISOString() : null,
          paidAt: run.paidAt ? new Date(run.paidAt).toISOString() : null,
        }
      : null,
    entries: rows.map(r =>
      toPayrollEntryDto({
        _id: r._id as mongoose.Types.ObjectId,
        payrollRunId: r.payrollRunId as mongoose.Types.ObjectId,
        month: r.month,
        staffType: r.staffType,
        staffId: r.staffId as mongoose.Types.ObjectId,
        staffName: r.staffName,
        employeeId: r.employeeId,
        monthlySalary: r.monthlySalary,
        weekdayBatches: r.weekdayBatches,
        weekendBatches: r.weekendBatches,
        totalBatches: r.totalBatches,
        salaryPerBatch: r.salaryPerBatch,
        presentCount: r.presentCount,
        absentCount: r.absentCount,
        halfDayCount: r.halfDayCount,
        leaveCount: r.leaveCount,
        rejectedLeaveCount: r.rejectedLeaveCount,
        pendingLeaveCount: r.pendingLeaveCount,
        deductionAmount: r.deductionAmount,
        netSalary: r.netSalary,
        payrollStatus: r.payrollStatus,
        remarks: r.remarks ?? "",
      }),
    ),
  };
}

export async function updatePayrollStatusForEntry(entryId: string, payrollStatus: PayrollStatus) {
  const row = await PayrollEntry.findById(entryId);
  if (!row) throw new Error("Payroll entry not found");
  row.payrollStatus = payrollStatus;
  await row.save();
  await recalculatePayrollRunSummary(row.month);
  return getPayrollByMonth(row.month);
}

export async function updatePayrollRunStatus(monthInput: string, payrollStatus: PayrollStatus) {
  const month = ensureMonth(monthInput);
  const run = await PayrollRun.findOne({ month });
  if (!run) throw new Error("Payroll run not found");

  run.payrollStatus = payrollStatus;
  if (payrollStatus === "Approved") run.approvedAt = new Date();
  if (payrollStatus === "Paid") run.paidAt = new Date();
  await run.save();

  await PayrollEntry.updateMany({ month }, { $set: { payrollStatus } });
}

export async function getTeacherPayrollHistory(staffType: PayrollStaffType, staffId: string) {
  if (!mongoose.Types.ObjectId.isValid(staffId)) return [];
  const rows = await PayrollEntry.find({ staffType, staffId: new mongoose.Types.ObjectId(staffId) })
    .sort({ month: -1 })
    .lean();
  return rows.map(r =>
    toPayrollEntryDto({
      _id: r._id as mongoose.Types.ObjectId,
      payrollRunId: r.payrollRunId as mongoose.Types.ObjectId,
      month: r.month,
      staffType: r.staffType,
      staffId: r.staffId as mongoose.Types.ObjectId,
      staffName: r.staffName,
      employeeId: r.employeeId,
      monthlySalary: r.monthlySalary,
      weekdayBatches: r.weekdayBatches,
      weekendBatches: r.weekendBatches,
      totalBatches: r.totalBatches,
      salaryPerBatch: r.salaryPerBatch,
      presentCount: r.presentCount,
      absentCount: r.absentCount,
      halfDayCount: r.halfDayCount,
      leaveCount: r.leaveCount,
      rejectedLeaveCount: r.rejectedLeaveCount,
      pendingLeaveCount: r.pendingLeaveCount,
      deductionAmount: r.deductionAmount,
      netSalary: r.netSalary,
      payrollStatus: r.payrollStatus,
      remarks: r.remarks ?? "",
    }),
  );
}

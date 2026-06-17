import mongoose from "mongoose";
import type { PayrollStaffType } from "@/lib/models/SalaryProfile";
import type { PayrollStatus } from "@/lib/models/PayrollRun";

export interface PayrollEntryDocument extends mongoose.Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const PayrollEntrySchema = new mongoose.Schema<PayrollEntryDocument>(
  {
    payrollRunId: { type: mongoose.Schema.Types.ObjectId, ref: "PayrollRun", required: true, index: true },
    month: { type: String, required: true, trim: true, index: true },
    staffType: {
      type: String,
      enum: ["teacher", "senior_teacher"],
      required: true,
      index: true,
    },
    staffId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    staffName: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, trim: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    weekdayBatches: { type: Number, default: 0, min: 0 },
    weekendBatches: { type: Number, default: 0, min: 0 },
    totalBatches: { type: Number, default: 0, min: 0 },
    salaryPerBatch: { type: Number, default: 0, min: 0 },
    presentCount: { type: Number, default: 0, min: 0 },
    absentCount: { type: Number, default: 0, min: 0 },
    halfDayCount: { type: Number, default: 0, min: 0 },
    leaveCount: { type: Number, default: 0, min: 0 },
    rejectedLeaveCount: { type: Number, default: 0, min: 0 },
    pendingLeaveCount: { type: Number, default: 0, min: 0 },
    deductionAmount: { type: Number, default: 0, min: 0 },
    netSalary: { type: Number, default: 0, min: 0 },
    payrollStatus: {
      type: String,
      enum: ["Pending", "Generated", "Approved", "Paid"],
      default: "Pending",
      index: true,
    },
    remarks: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "payroll_entries" },
);

PayrollEntrySchema.index({ month: 1, staffType: 1, staffId: 1 }, { unique: true });

const PayrollEntryModel =
  (mongoose.models.PayrollEntry as mongoose.Model<PayrollEntryDocument> | undefined) ??
  mongoose.model<PayrollEntryDocument>("PayrollEntry", PayrollEntrySchema);

export default PayrollEntryModel;

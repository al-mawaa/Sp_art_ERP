import mongoose from "mongoose";

export type PayrollStatus = "Pending" | "Generated" | "Approved" | "Paid";

export interface PayrollRunDocument extends mongoose.Document {
  month: string;
  payrollStatus: PayrollStatus;
  generatedAt?: Date;
  approvedAt?: Date;
  paidAt?: Date;
  summary: {
    totalStaff: number;
    totalMonthlySalary: number;
    totalDeductions: number;
    totalNetSalary: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PayrollRunSchema = new mongoose.Schema<PayrollRunDocument>(
  {
    month: { type: String, required: true, trim: true, unique: true, index: true },
    payrollStatus: {
      type: String,
      enum: ["Pending", "Generated", "Approved", "Paid"],
      default: "Pending",
      index: true,
    },
    generatedAt: { type: Date },
    approvedAt: { type: Date },
    paidAt: { type: Date },
    summary: {
      totalStaff: { type: Number, default: 0 },
      totalMonthlySalary: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      totalNetSalary: { type: Number, default: 0 },
    },
  },
  { timestamps: true, collection: "payroll_runs" },
);

const PayrollRunModel =
  (mongoose.models.PayrollRun as mongoose.Model<PayrollRunDocument> | undefined) ??
  mongoose.model<PayrollRunDocument>("PayrollRun", PayrollRunSchema);

export default PayrollRunModel;

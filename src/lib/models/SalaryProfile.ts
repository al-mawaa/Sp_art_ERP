import mongoose from "mongoose";

export type PayrollStaffType = "teacher" | "senior_teacher";
export type SalaryProfileStatus = "Active" | "Inactive";

export interface SalaryProfileDocument extends mongoose.Document {
  staffType: PayrollStaffType;
  staffId: mongoose.Types.ObjectId;
  employeeId: string;
  staffName: string;
  monthlySalary: number;
  joiningDate: Date;
  status: SalaryProfileStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryProfileSchema = new mongoose.Schema<SalaryProfileDocument>(
  {
    staffType: {
      type: String,
      enum: ["teacher", "senior_teacher"],
      required: true,
      index: true,
    },
    staffId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    employeeId: { type: String, required: true, trim: true, index: true },
    staffName: { type: String, required: true, trim: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
  },
  { timestamps: true, collection: "salary_profiles" },
);

SalaryProfileSchema.index({ staffType: 1, staffId: 1 }, { unique: true });

const SalaryProfileModel =
  (mongoose.models.SalaryProfile as mongoose.Model<SalaryProfileDocument> | undefined) ??
  mongoose.model<SalaryProfileDocument>("SalaryProfile", SalaryProfileSchema);

export default SalaryProfileModel;

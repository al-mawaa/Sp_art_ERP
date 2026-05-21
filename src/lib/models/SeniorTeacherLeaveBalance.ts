import mongoose from "mongoose";

export interface SeniorTeacherLeaveBalanceDocument extends mongoose.Document {
  seniorTeacherId: mongoose.Types.ObjectId;
  casual: number;
  sick: number;
  personal: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SENIOR_LEAVE_BALANCE = { casual: 6, sick: 8, personal: 3 };

const SeniorTeacherLeaveBalanceSchema = new mongoose.Schema<SeniorTeacherLeaveBalanceDocument>(
  {
    seniorTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeniorTeacher",
      required: true,
      unique: true,
    },
    casual: { type: Number, default: DEFAULT_SENIOR_LEAVE_BALANCE.casual, min: 0 },
    sick: { type: Number, default: DEFAULT_SENIOR_LEAVE_BALANCE.sick, min: 0 },
    personal: { type: Number, default: DEFAULT_SENIOR_LEAVE_BALANCE.personal, min: 0 },
  },
  { timestamps: true, collection: "senior_teacher_leave_balances" },
);

const SeniorTeacherLeaveBalanceModel =
  (mongoose.models.SeniorTeacherLeaveBalance as
    | mongoose.Model<SeniorTeacherLeaveBalanceDocument>
    | undefined) ??
  mongoose.model<SeniorTeacherLeaveBalanceDocument>(
    "SeniorTeacherLeaveBalance",
    SeniorTeacherLeaveBalanceSchema,
  );

export default SeniorTeacherLeaveBalanceModel;

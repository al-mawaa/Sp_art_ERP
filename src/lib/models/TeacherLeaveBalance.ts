import mongoose from "mongoose";

export interface TeacherLeaveBalanceDocument extends mongoose.Document {
  teacherId: mongoose.Types.ObjectId;
  casual: number;
  sick: number;
  personal: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_LEAVE_BALANCE = { casual: 6, sick: 8, personal: 3 };

const TeacherLeaveBalanceSchema = new mongoose.Schema<TeacherLeaveBalanceDocument>(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true, unique: true },
    casual: { type: Number, default: DEFAULT_LEAVE_BALANCE.casual, min: 0 },
    sick: { type: Number, default: DEFAULT_LEAVE_BALANCE.sick, min: 0 },
    personal: { type: Number, default: DEFAULT_LEAVE_BALANCE.personal, min: 0 },
  },
  { timestamps: true, collection: "teacher_leave_balances" },
);

const TeacherLeaveBalanceModel =
  (mongoose.models.TeacherLeaveBalance as mongoose.Model<TeacherLeaveBalanceDocument> | undefined) ??
  mongoose.model<TeacherLeaveBalanceDocument>("TeacherLeaveBalance", TeacherLeaveBalanceSchema);

export default TeacherLeaveBalanceModel;

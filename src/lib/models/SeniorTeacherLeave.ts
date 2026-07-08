import mongoose from "mongoose";
import type { LeaveStatus, LeaveType } from "@/lib/models/Leave";

export type { LeaveStatus, LeaveType };

export interface SeniorTeacherLeaveDocument extends mongoose.Document {
  seniorTeacherId: mongoose.Types.ObjectId;
  seniorTeacherName: string;
  seniorTeacherEmail: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  adminRemark: string;
  daysCount: number;
  documentUrl?: string;
  documentName?: string;
  documentType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SeniorTeacherLeaveSchema = new mongoose.Schema<SeniorTeacherLeaveDocument>(
  {
    seniorTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeniorTeacher",
      required: true,
      index: true,
    },
    seniorTeacherName: { type: String, required: true, trim: true },
    seniorTeacherEmail: { type: String, required: true, trim: true, lowercase: true },
    leaveType: { type: String, enum: ["Casual", "Sick", "Personal"], required: true },
    fromDate: { type: String, required: true, index: true },
    toDate: { type: String, required: true },
    reason: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    adminRemark: { type: String, default: "", trim: true },
    daysCount: { type: Number, default: 1, min: 1 },
    documentUrl: { type: String, trim: true },
    documentName: { type: String, trim: true },
    documentType: { type: String, trim: true },
  },
  { timestamps: true, collection: "senior_teacher_leaves" },
);

SeniorTeacherLeaveSchema.index(
  { seniorTeacherId: 1, leaveType: 1, fromDate: 1, toDate: 1, reason: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "Pending" },
    name: "unique_senior_teacher_pending_leave",
  },
);

if (mongoose.models.SeniorTeacherLeave) {
  delete mongoose.models.SeniorTeacherLeave;
}
const SeniorTeacherLeaveModel = mongoose.model<SeniorTeacherLeaveDocument>("SeniorTeacherLeave", SeniorTeacherLeaveSchema);

export default SeniorTeacherLeaveModel;

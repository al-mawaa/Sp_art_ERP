import mongoose from "mongoose";
import type { QueryCategory } from "@/lib/queries/queryCategories";

export type QueryStatus = "pending" | "approved" | "rejected";
export type QueryRole = "student" | "teacher" | "senior_teacher";

export interface QueryDocument extends mongoose.Document {
  role: QueryRole;
  userId: mongoose.Types.ObjectId;
  personName: string;
  personEmail: string;
  category: QueryCategory;
  remarks: string;
  status: QueryStatus;
  adminRemark?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  actionType?: "approved" | "rejected";
  /** Profile correction */
  requestedChanges?: string;
  /** Switch batch */
  currentBatchId?: string;
  requestedBatchId?: string;
  currentBatchName?: string;
  requestedBatchName?: string;
  /** Course change */
  currentCourseId?: string;
  requestedCourseId?: string;
  currentCourseName?: string;
  requestedCourseName?: string;
  /** Attendance correction */
  attendanceDate?: string;
  currentAttendanceStatus?: string;
  requestedAttendanceStatus?: string;
  createdAt: Date;
  updatedAt: Date;
  /** @deprecated Legacy student fields */
  studentId?: mongoose.Types.ObjectId;
  studentName?: string;
  studentEmail?: string;
  /** @deprecated Legacy teacher fields */
  teacherId?: mongoose.Types.ObjectId;
  teacherName?: string;
  teacherEmail?: string;
  /** @deprecated Legacy senior teacher fields */
  seniorTeacherId?: mongoose.Types.ObjectId;
  seniorTeacherName?: string;
  seniorTeacherEmail?: string;
}

const QuerySchema = new mongoose.Schema<QueryDocument>(
  {
    role: {
      type: String,
      enum: ["student", "teacher", "senior_teacher"],
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    personName: { type: String, required: true, trim: true },
    personEmail: { type: String, required: true, trim: true, lowercase: true },
    category: {
      type: String,
      enum: [
        "profile_correction",
        "switch_batch",
        "course_change",
        "fee_related",
        "attendance_correction",
        "other",
      ],
      default: "profile_correction",
      index: true,
    },
    remarks: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminRemark: { type: String, trim: true, default: "" },
    reviewedAt: { type: Date },
    reviewedBy: { type: String, trim: true },
    actionType: { type: String, enum: ["approved", "rejected"] },
    requestedChanges: { type: String, trim: true },
    currentBatchId: { type: String, trim: true },
    requestedBatchId: { type: String, trim: true },
    currentBatchName: { type: String, trim: true },
    requestedBatchName: { type: String, trim: true },
    currentCourseId: { type: String, trim: true },
    requestedCourseId: { type: String, trim: true },
    currentCourseName: { type: String, trim: true },
    requestedCourseName: { type: String, trim: true },
    attendanceDate: { type: String, trim: true },
    currentAttendanceStatus: { type: String, trim: true },
    requestedAttendanceStatus: { type: String, trim: true },
  },
  { timestamps: true, collection: "queries", strict: false },
);

QuerySchema.index({ role: 1, userId: 1, createdAt: -1 });
QuerySchema.index({ status: 1, createdAt: -1 });
QuerySchema.index({ category: 1, status: 1 });

const QueryModel =
  (mongoose.models.Query as mongoose.Model<QueryDocument> | undefined) ??
  mongoose.model<QueryDocument>("Query", QuerySchema);

export default QueryModel;

/** @deprecated Use Query model — collection is `queries` */
export { QueryModel as StudentQueryModel };

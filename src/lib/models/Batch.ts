import mongoose from "mongoose";

/** Embedded roster line — same person may appear multiple times (req. 3). */
export interface BatchEmbeddedStudent {
  _id: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  phone: string;
  course: string;
  batchDay: string;
  batchTime: string;
  startMonth: string;
  endMonth: string;
}

export interface BatchAttendanceSummary {
  totalSessions: number;
  completedSessions: number;
  averageAttendancePercent: number;
}

export interface BatchDocument extends mongoose.Document {
  batchName: string;
  courseName: string;
  batchDay: string;
  batchTime: string;
  startMonth: string;
  endMonth: string;
  branch: string;
  batchCapacity: number;
  description: string;
  students: BatchEmbeddedStudent[];
  teacherIds: mongoose.Types.ObjectId[];
  attendanceSummary: BatchAttendanceSummary;
  createdAt: Date;
  updatedAt: Date;
}

const BatchStudentSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    course: { type: String, default: "", trim: true },
    batchDay: { type: String, default: "", trim: true },
    batchTime: { type: String, default: "", trim: true },
    startMonth: { type: String, default: "", trim: true },
    endMonth: { type: String, default: "", trim: true },
  },
  { _id: true },
);

const AttendanceSummarySchema = new mongoose.Schema(
  {
    totalSessions: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    averageAttendancePercent: { type: Number, default: 0 },
  },
  { _id: false },
);

const BatchSchema = new mongoose.Schema<BatchDocument>(
  {
    batchName: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    batchDay: { type: String, required: true, trim: true },
    batchTime: { type: String, required: true, trim: true },
    startMonth: { type: String, required: true, trim: true },
    endMonth: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    batchCapacity: { type: Number, required: true, min: 1 },
    description: { type: String, default: "", trim: true },
    students: { type: [BatchStudentSchema], default: [] },
    teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }],
    attendanceSummary: {
      type: AttendanceSummarySchema,
      default: () => ({ totalSessions: 0, completedSessions: 0, averageAttendancePercent: 0 }),
    },
  },
  { timestamps: true, collection: "batches" },
);

const BatchModel =
  (mongoose.models.Batch as mongoose.Model<BatchDocument> | undefined) ??
  mongoose.model<BatchDocument>("Batch", BatchSchema);

export default BatchModel;

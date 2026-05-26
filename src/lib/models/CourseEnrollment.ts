import mongoose from "mongoose";

export type EnrollmentStatus = "enrolled" | "pending" | "cancelled";
export type EnrollmentPaymentStatus = "paid" | "pending" | "failed" | "partial";
export type InstallmentType = "full" | "two_installments" | "monthly";

export interface CourseEnrollmentDocument extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  paymentStatus: EnrollmentPaymentStatus;
  status: EnrollmentStatus;
  totalAmount: number;
  paidAmount: number;
  installmentType: InstallmentType;
  installmentCount: number;
  installmentsPaid: number;
  nextDueDate?: string;
  enrollmentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CourseEnrollmentSchema = new mongoose.Schema<CourseEnrollmentDocument>(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "failed", "partial"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["enrolled", "pending", "cancelled"],
      default: "pending",
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    installmentType: {
      type: String,
      enum: ["full", "two_installments", "monthly"],
      default: "full",
    },
    installmentCount: { type: Number, default: 1, min: 1 },
    installmentsPaid: { type: Number, default: 0, min: 0 },
    nextDueDate: { type: String, trim: true },
    enrollmentDate: { type: Date },
  },
  { timestamps: true, collection: "course_enrollments" },
);

CourseEnrollmentSchema.index({ studentId: 1, batchId: 1 }, { unique: true });

const CourseEnrollmentModel =
  (mongoose.models.CourseEnrollment as mongoose.Model<CourseEnrollmentDocument> | undefined) ??
  mongoose.model<CourseEnrollmentDocument>("CourseEnrollment", CourseEnrollmentSchema);

export default CourseEnrollmentModel;

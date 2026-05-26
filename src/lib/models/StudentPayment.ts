import mongoose from "mongoose";

export type StudentPaymentStatus = "paid" | "pending" | "failed";

export interface StudentPaymentDocument extends mongoose.Document {
  enrollmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: StudentPaymentStatus;
  installmentNumber: number;
  receiptNumber: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudentPaymentSchema = new mongoose.Schema<StudentPaymentDocument>(
  {
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseEnrollment", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["paid", "pending", "failed"], default: "pending" },
    installmentNumber: { type: Number, default: 1, min: 1 },
    receiptNumber: { type: String, required: true, unique: true },
    paidAt: { type: Date },
  },
  { timestamps: true, collection: "student_payments" },
);

const StudentPaymentModel =
  (mongoose.models.StudentPayment as mongoose.Model<StudentPaymentDocument> | undefined) ??
  mongoose.model<StudentPaymentDocument>("StudentPayment", StudentPaymentSchema);

export default StudentPaymentModel;

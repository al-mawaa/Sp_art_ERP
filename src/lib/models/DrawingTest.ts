import mongoose from 'mongoose';

export type DrawingTestStatus = 'Pending Senior Review' | 'Reviewed' | 'Approved' | 'Rejected';

export interface DrawingTestDocument extends mongoose.Document {
  teacherId: mongoose.Types.ObjectId;
  teacherName: string;
  batchId: mongoose.Types.ObjectId;
  batchName: string;
  courseName: string;
  batchMonth?: string;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  taskId?: mongoose.Types.ObjectId;
  testTitle: string;
  timeTaken: number;
  teacherDrawingImage: string;
  studentDrawingImage: string;
  status: DrawingTestStatus;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DrawingTestSchema = new mongoose.Schema<DrawingTestDocument>(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    teacherName: { type: String, required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    batchName: { type: String, required: true },
    courseName: { type: String, default: "" },
    batchMonth: { type: String, default: "" },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    studentName: { type: String, required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrawingTask', index: true, required: false },
    testTitle: { type: String, required: true },
    timeTaken: { type: Number, default: 0 },
    teacherDrawingImage: { type: String, required: false, default: "" },
    studentDrawingImage: { type: String, required: true },
    status: { type: String, enum: ['Pending Senior Review', 'Reviewed', 'Approved', 'Rejected'], default: 'Pending Senior Review' },
    submittedAt: { type: Date },
  },
  { timestamps: true, collection: 'drawing_tests' },
);

const DrawingTest = (mongoose.models.DrawingTest as mongoose.Model<DrawingTestDocument> | undefined) ??
  mongoose.model<DrawingTestDocument>('DrawingTest', DrawingTestSchema);

export default DrawingTest;

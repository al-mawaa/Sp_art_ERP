import mongoose from 'mongoose';

export interface StudentEvaluationDocument extends mongoose.Document {
  submissionId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  drawingMarks: number;
  coloringMarks: number;
  speedMarks: number;
  neatnessMarks: number;
  creativityMarks: number;
  accuracyMarks: number;
  obtainedMarks: number;
  maxMarks: number;
  performancePercentage: number;
  remarks: string;
  evaluatedBy: mongoose.Types.ObjectId;
  evaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudentEvaluationSchema = new mongoose.Schema<StudentEvaluationDocument>(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DrawingTest',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DrawingTask',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    drawingMarks: { type: Number, required: true, min: 0, max: 5 },
    coloringMarks: { type: Number, required: true, min: 0, max: 5 },
    speedMarks: { type: Number, required: true, min: 0, max: 5 },
    neatnessMarks: { type: Number, required: true, min: 0, max: 5 },
    creativityMarks: { type: Number, required: true, min: 0, max: 5 },
    accuracyMarks: { type: Number, required: true, min: 0, max: 5 },
    obtainedMarks: { type: Number, required: true, default: 0 },
    maxMarks: { type: Number, required: true, default: 30 },
    performancePercentage: { type: Number, required: true, default: 0 },
    remarks: { type: String, trim: true, default: '' },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    evaluatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: 'student_evaluations' },
);

StudentEvaluationSchema.index({ taskId: 1, studentId: 1 }, { unique: true });
StudentEvaluationSchema.index({ teacherId: 1, evaluatedAt: -1 });

const StudentEvaluation =
  (mongoose.models.StudentEvaluation as mongoose.Model<StudentEvaluationDocument> | undefined) ??
  mongoose.model<StudentEvaluationDocument>('StudentEvaluation', StudentEvaluationSchema);

export default StudentEvaluation;

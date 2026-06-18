import mongoose from 'mongoose';

export interface TeacherPerformanceDocument extends mongoose.Document {
  teacherId: mongoose.Types.ObjectId;
  totalStudentsEvaluated: number;
  averagePerformance: number;
  incentiveEligible: boolean;
  incentivePercentage: number;
  lastEvaluatedAt: Date;
  lastUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherPerformanceSchema = new mongoose.Schema<TeacherPerformanceDocument>(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      unique: true,
      index: true,
    },
    totalStudentsEvaluated: { type: Number, required: true, default: 0 },
    averagePerformance: { type: Number, required: true, default: 0 },
    incentiveEligible: { type: Boolean, required: true, default: false },
    incentivePercentage: { type: Number, required: true, default: 0 },
    lastEvaluatedAt: { type: Date },
    lastUpdatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: 'teacher_performance' },
);

const TeacherPerformance =
  (mongoose.models.TeacherPerformance as mongoose.Model<TeacherPerformanceDocument> | undefined) ??
  mongoose.model<TeacherPerformanceDocument>('TeacherPerformance', TeacherPerformanceSchema);

export default TeacherPerformance;

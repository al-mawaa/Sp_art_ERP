import mongoose from 'mongoose';

export type CourseStatus = 'active' | 'inactive';

export interface CourseDocument extends mongoose.Document {
  courseTitle: string;
  courseCode: string;
  image?: string;
  instructor?: string;
  session: string;
  remainingDays?: string;
  teacherId?: mongoose.Types.ObjectId;
  seniorTeacherId?: mongoose.Types.ObjectId;
  validUntil?: Date;
  startDate?: Date;
  endDate?: Date;
  totalFees: number;
  discountFees: number;
  discountPercentage: number;
  status: CourseStatus;
  notes?: string;
  rulesAndRegulations?: string;
  materialsRequired?: string;
  category?: string;
  categorySlug?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new mongoose.Schema<CourseDocument>(
  {
    courseTitle: { type: String, required: true },
    courseCode: { type: String, required: true, unique: true, sparse: true },
    image: { type: String },
    instructor: { type: String },
    session: { type: String, required: true, default: '1' },
    remainingDays: { type: String },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    seniorTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorTeacher' },
    validUntil: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    totalFees: { type: Number, required: true, default: 0 },
    discountFees: { type: Number, required: true, default: 0 },
    discountPercentage: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    notes: { type: String },
    rulesAndRegulations: { type: String, default: '' },
    materialsRequired: { type: String, default: '' },
    category: { type: String },
    categorySlug: { type: String },
    createdBy: { type: String },
  },
  {
    timestamps: true,
    collection: 'courses',
  }
);

const CourseModel =
  (mongoose.models.Course as mongoose.Model<CourseDocument> | undefined) ??
  mongoose.model<CourseDocument>('Course', CourseSchema);

export default CourseModel;

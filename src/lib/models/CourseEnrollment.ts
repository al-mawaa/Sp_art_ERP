import mongoose from 'mongoose';

export interface CourseEnrollmentDocument extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  status: 'active' | 'completed' | 'dropped';
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  paymentStatus?: string;
}

const CourseEnrollmentSchema = new mongoose.Schema<CourseEnrollmentDocument>(
  {
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Student', 
      required: true 
    },
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Course', 
      required: true 
    },
    enrollmentDate: { 
      type: Date, 
      required: true, 
      default: () => new Date() 
    },
    status: { 
      type: String, 
      enum: ['active', 'completed', 'dropped'], 
      default: 'active' 
    },
    completionPercentage: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 100 
    },
    paymentId: { type: String },
    orderId: { type: String, unique: true, sparse: true }, // Unique to prevent duplicate payment processing
    amount: { type: Number },
    paymentStatus: { type: String },
  },
  {
    timestamps: true,
    collection: 'courseenrollments',
  }
);

// Index to prevent duplicate enrollments for same student-course pair
CourseEnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const CourseEnrollmentModel =
  (mongoose.models.CourseEnrollment as mongoose.Model<CourseEnrollmentDocument> | undefined) ??
  mongoose.model<CourseEnrollmentDocument>('CourseEnrollment', CourseEnrollmentSchema);

export default CourseEnrollmentModel;

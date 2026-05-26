import mongoose from 'mongoose';

export interface CourseEnrollmentDocument extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  status: 'active' | 'completed' | 'dropped';
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
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
  },
  {
    timestamps: true,
    collection: 'courseenrollments',
  }
);

// Index to prevent duplicate enrollments
CourseEnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const CourseEnrollmentModel =
  (mongoose.models.CourseEnrollment as mongoose.Model<CourseEnrollmentDocument> | undefined) ??
  mongoose.model<CourseEnrollmentDocument>('CourseEnrollment', CourseEnrollmentSchema);

export default CourseEnrollmentModel;

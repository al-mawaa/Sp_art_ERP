import mongoose from 'mongoose';

export interface CertificateDocument extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  certificateNumber: string;
  issueDate?: Date;
  status: 'pending_approval' | 'approved' | 'rejected';
  pdfUrl?: string;
  qrCodeUrl?: string;
  downloadCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new mongoose.Schema<CertificateDocument>(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseEnrollment',
      required: true,
    },
    certificateNumber: {
      type: String,
      unique: true,
      required: true,
    },
    issueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected'],
      default: 'pending_approval',
    },
    pdfUrl: {
      type: String,
    },
    qrCodeUrl: {
      type: String,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'certificates',
  }
);

// Prevent multiple certificates for the same enrollment
CertificateSchema.index({ enrollmentId: 1 }, { unique: true });

const CertificateModel =
  (mongoose.models.Certificate as mongoose.Model<CertificateDocument> | undefined) ??
  mongoose.model<CertificateDocument>('Certificate', CertificateSchema);

export default CertificateModel;

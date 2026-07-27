import mongoose from 'mongoose';

export interface ProfileUpdateRequestDocument extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  field: string;
  currentValue: string;
  newValue: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileUpdateRequestSchema = new mongoose.Schema<ProfileUpdateRequestDocument>({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  field: { type: String, required: true },
  currentValue: { type: String, required: true },
  newValue: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorTeacher' },
  reviewedAt: { type: Date },
  reviewComment: { type: String },
}, {
  timestamps: true,
  collection: 'profile_update_requests',
});

const ProfileUpdateRequestModel =
  (mongoose.models.ProfileUpdateRequest as mongoose.Model<ProfileUpdateRequestDocument> | undefined) ??
  mongoose.model<ProfileUpdateRequestDocument>('ProfileUpdateRequest', ProfileUpdateRequestSchema);

export default ProfileUpdateRequestModel;

import mongoose from 'mongoose';

export interface StudentCredentialsDocument extends mongoose.Document {
  studentId: string;
  name: string;
  username: string;
  email: string;
  password: string;
  passwordHash: string;
  role: 'Student' | 'Class Representative' | 'Premium Student';
  accountStatus: 'Active' | 'Inactive' | 'Suspended';
  portalAccess: boolean;
  forcePasswordReset: boolean;
  recoveryEmail?: string;
  mobileNumber?: string;
  studentIdNumber?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentCredentialsSchema = new mongoose.Schema<StudentCredentialsDocument>({
  studentId: { type: String, required: true }, // Changed from ObjectId to String to match mock data IDs
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Class Representative', 'Premium Student'], default: 'Student' },
  accountStatus: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
  portalAccess: { type: Boolean, default: true },
  forcePasswordReset: { type: Boolean, default: true },
  recoveryEmail: { type: String },
  mobileNumber: { type: String },
  studentIdNumber: { type: String }, // Admission Number
  createdBy: { type: String, required: true }, // Admin ID or name
}, {
  timestamps: true,
});

const StudentCredentialsModel = mongoose.models.StudentCredentials as mongoose.Model<StudentCredentialsDocument>;
export default StudentCredentialsModel || mongoose.model<StudentCredentialsDocument>('StudentCredentials', StudentCredentialsSchema);
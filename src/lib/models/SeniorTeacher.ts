import mongoose from 'mongoose';

export interface SeniorTeacherDocument extends mongoose.Document {
  fullName: string;
  badgeId?: string;
  email: string;
  phone: string;
  dob?: Date;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  schoolCollege?: string;
  parentGuardianDetails?: string;
  address: string;
  className?: string;
  currentSubjectCourse?: string;
  specialization: string;
  yearsOfExperience: number;
  role?: string;
  qualification: string;
  joiningDate: Date;
  salary?: number;
  bio?: string;
  profileImage?: string;
  courseName?: string;
  branchName?: string;
  status: 'Active' | 'Inactive';
  assignedClasses: number;
  teacherDocuments?: {
    aadhaarCard?: {
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
      uploadedAt?: Date;
    };
    panCard?: {
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
      uploadedAt?: Date;
    };
    offerLetter?: {
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
      uploadedAt?: Date;
    };
    incrementLetter?: {
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
      uploadedAt?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const SeniorTeacherSchema = new mongoose.Schema<SeniorTeacherDocument>({
  fullName: { type: String, required: true },
  badgeId: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dob: { type: Date },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String },
  schoolCollege: { type: String },
  parentGuardianDetails: { type: String },
  address: { type: String, required: true },
  className: { type: String },
  currentSubjectCourse: { type: String },
  specialization: { type: String, required: true },
  yearsOfExperience: { type: Number, required: true, default: 0 },
  role: { type: String },
  qualification: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  salary: { type: Number },
  bio: { type: String },
  profileImage: { type: String },
  courseName: { type: String },
  branchName: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  assignedClasses: { type: Number, default: 0 },
  teacherDocuments: {
    aadhaarCard: {
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadedAt: { type: Date },
    },
    panCard: {
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadedAt: { type: Date },
    },
    offerLetter: {
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadedAt: { type: Date },
    },
    incrementLetter: {
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadedAt: { type: Date },
    },
  },
}, {
  timestamps: true,
  collection: 'seniorteachers',
});

const SeniorTeacherModel = mongoose.models.SeniorTeacher as mongoose.Model<SeniorTeacherDocument>;
export default SeniorTeacherModel || mongoose.model<SeniorTeacherDocument>('SeniorTeacher', SeniorTeacherSchema);

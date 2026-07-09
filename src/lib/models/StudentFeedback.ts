import mongoose from "mongoose";

export type FeedbackCategory =
  | "Teaching Quality"
  | "Communication"
  | "Behaviour"
  | "Time Management"
  | "Classroom Management"
  | "Course Content"
  | "Practical Session"
  | "Overall Experience"
  | "Suggestion"
  | "Other";

export type FeedbackStatus = "Submitted" | "Reviewed" | "Closed";

export interface StudentFeedbackDocument extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  
  category: FeedbackCategory;
  
  // Ratings (1-5)
  teachingRating: number;
  communicationRating: number;
  behaviourRating: number;
  knowledgeRating: number;
  practicalRating: number;
  overallRating: number;
  
  subject: string;
  message: string;
  
  originalTeacherName?: string;
  
  anonymous: boolean;
  status: FeedbackStatus;
  adminRemark?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const StudentFeedbackSchema = new mongoose.Schema<StudentFeedbackDocument>(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    
    category: {
      type: String,
      enum: [
        "Teaching Quality",
        "Communication",
        "Behaviour",
        "Time Management",
        "Classroom Management",
        "Course Content",
        "Practical Session",
        "Overall Experience",
        "Suggestion",
        "Other",
      ],
      required: true,
    },

    teachingRating: { type: Number, required: true, min: 1, max: 5 },
    communicationRating: { type: Number, required: true, min: 1, max: 5 },
    behaviourRating: { type: Number, required: true, min: 1, max: 5 },
    knowledgeRating: { type: Number, required: true, min: 1, max: 5 },
    practicalRating: { type: Number, required: true, min: 1, max: 5 },
    overallRating: { type: Number, required: true, min: 1, max: 5 },

    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    
    originalTeacherName: { type: String },
    
    anonymous: { type: Boolean, default: false },
    status: { type: String, enum: ["Submitted", "Reviewed", "Closed"], default: "Submitted", index: true },
    adminRemark: { type: String, trim: true },
  },
  { timestamps: true, collection: "studentfeedbacks" }
);

StudentFeedbackSchema.index({ studentId: 1, teacherId: 1, courseId: 1, createdAt: -1 });

delete mongoose.models.StudentFeedback;

const StudentFeedbackModel = mongoose.model<StudentFeedbackDocument>("StudentFeedback", StudentFeedbackSchema);

export default StudentFeedbackModel;

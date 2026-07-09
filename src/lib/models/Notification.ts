import mongoose from "mongoose";

export type NotificationPriority = "Low" | "Medium" | "High" | "Urgent";
export type NotificationStatus = "Draft" | "Scheduled" | "Sending" | "Sent" | "Failed";

export interface NotificationDocument extends mongoose.Document {
  title: string;
  subject?: string;
  message: string;
  type: string;
  priority: NotificationPriority;
  senderId?: mongoose.Types.ObjectId;
  senderRole?: string;
  targetRoles?: string[];
  targetUsers?: mongoose.Types.ObjectId[];
  targetBatches?: mongoose.Types.ObjectId[];
  targetCourses?: mongoose.Types.ObjectId[];
  targetBranches?: mongoose.Types.ObjectId[];
  attachmentUrl?: string;
  attachmentName?: string;
  deliveryChannels: string[];
  templateId?: mongoose.Types.ObjectId;
  scheduledAt?: Date;
  expiresAt?: Date;
  isPinned: boolean;
  status: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true }, // HTML or plain text depending on editor
    type: { type: String, required: true, index: true },
    priority: { 
      type: String, 
      enum: ["Low", "Medium", "High", "Urgent"], 
      default: "Medium" 
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "Credentials" },
    senderRole: { type: String },
    
    // Targeting arrays
    targetRoles: [{ type: String }],
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Credentials" }],
    targetBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],
    targetCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    targetBranches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }], // Assuming Branch model exists, else just string/id
    
    attachmentUrl: { type: String },
    attachmentName: { type: String },
    
    deliveryChannels: [{ type: String, enum: ["In-app", "Email"] }], 
    
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "NotificationTemplate" },
    
    scheduledAt: { type: Date },
    expiresAt: { type: Date },
    isPinned: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ["Draft", "Scheduled", "Sending", "Sent", "Failed"], 
      default: "Sent"
    },
  },
  { timestamps: true, collection: "notifications" }
);

NotificationSchema.index({ status: 1, scheduledAt: 1 });
NotificationSchema.index({ expiresAt: 1 });

const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<NotificationDocument> | undefined) ??
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);

export default NotificationModel;

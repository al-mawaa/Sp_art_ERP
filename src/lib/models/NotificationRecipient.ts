import mongoose from "mongoose";

export interface NotificationRecipientDocument extends mongoose.Document {
  notificationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: string;
  delivered: boolean;
  deliveredAt?: Date;
  read: boolean;
  readAt?: Date;
  archived: boolean;
  openedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationRecipientSchema = new mongoose.Schema<NotificationRecipientDocument>(
  {
    notificationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Notification", 
      required: true, 
      index: true 
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      index: true 
    },
    role: { type: String }, // e.g., 'student', 'teacher', 'admin', 'parent', 'hr'
    delivered: { type: Boolean, default: true },
    deliveredAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    archived: { type: Boolean, default: false },
    openedAt: { type: Date },
  },
  { timestamps: true, collection: "notificationRecipients" }
);

// Compound indexes for fast querying of user's notifications and unread counts
NotificationRecipientSchema.index({ userId: 1, read: 1, archived: 1 });
NotificationRecipientSchema.index({ notificationId: 1, userId: 1 }, { unique: true });

const NotificationRecipientModel =
  (mongoose.models.NotificationRecipient as mongoose.Model<NotificationRecipientDocument> | undefined) ??
  mongoose.model<NotificationRecipientDocument>("NotificationRecipient", NotificationRecipientSchema);

export default NotificationRecipientModel;

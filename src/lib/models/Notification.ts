import mongoose from "mongoose";

export type NotificationType =
  // Admin notifications
  | "student_admission"
  | "teacher_registration"
  | "course_approval"
  | "batch_creation"
  | "payment_verification"
  | "offline_payment"
  | "query_submitted"
  | "leave_request"
  | "referral_request"
  | "credential_request"
  | "birthday_reminder"
  | "fee_due"
  | "inventory_low"
  | "general"
  // Student notifications
  | "batch_assigned"
  | "batch_changed"
  | "class_schedule_updated"
  | "new_class_added"
  | "class_cancelled"
  | "teacher_changed"
  | "study_material_uploaded"
  | "query_approved"
  | "query_rejected"
  | "query_replied"
  | "new_course_launched"
  | "enrollment_approved"
  | "enrollment_rejected"
  | "course_updated"
  | "fee_due_reminder"
  | "fee_overdue"
  | "payment_received"
  | "payment_rejected"
  | "invoice_generated"
  | "certificate_issued"
  | "certificate_ready"
  | "attendance_marked"
  | "low_attendance_warning"
  | "exam_scheduled"
  | "marks_published"
  | "result_released"
  | "profile_approved"
  | "referral_reward_credited"
  | "gift_reward_earned"
  | "academy_announcement"
  | "holiday_notice"
  | "event_registration_confirmed";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface NotificationDocument extends mongoose.Document {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  redirectUrl?: string;
  referenceId?: string;
  referenceModel?: string;
  isRead: boolean;
  readAt?: Date;
  recipientRole?: string;
  recipientId?: mongoose.Types.ObjectId;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        // Admin notifications
        "student_admission",
        "teacher_registration",
        "course_approval",
        "batch_creation",
        "payment_verification",
        "offline_payment",
        "query_submitted",
        "leave_request",
        "referral_request",
        "credential_request",
        "birthday_reminder",
        "fee_due",
        "inventory_low",
        "general",
        // Student notifications
        "batch_assigned",
        "batch_changed",
        "class_schedule_updated",
        "new_class_added",
        "class_cancelled",
        "teacher_changed",
        "study_material_uploaded",
        "query_approved",
        "query_rejected",
        "query_replied",
        "new_course_launched",
        "enrollment_approved",
        "enrollment_rejected",
        "course_updated",
        "fee_due_reminder",
        "fee_overdue",
        "payment_received",
        "payment_rejected",
        "invoice_generated",
        "certificate_issued",
        "certificate_ready",
        "attendance_marked",
        "low_attendance_warning",
        "exam_scheduled",
        "marks_published",
        "result_released",
        "profile_approved",
        "referral_reward_credited",
        "gift_reward_earned",
        "academy_announcement",
        "holiday_notice",
        "event_registration_confirmed",
      ],
      default: "general",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    redirectUrl: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    referenceModel: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    recipientRole: {
      type: String,
      trim: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    createdBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

// Indexes for efficient queries
NotificationSchema.index({ isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<NotificationDocument> | undefined) ??
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);

export default NotificationModel;

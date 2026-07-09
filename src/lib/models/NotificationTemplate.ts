import mongoose from "mongoose";

export interface NotificationTemplateDocument extends mongoose.Document {
  title: string;
  subject: string;
  body: string;
  type: string;
  variables?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new mongoose.Schema<NotificationTemplateDocument>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true }, // Rich text
    type: { type: String, required: true, index: true },
    variables: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Credentials", required: true },
  },
  { timestamps: true, collection: "notificationTemplates" }
);

const NotificationTemplateModel =
  (mongoose.models.NotificationTemplate as mongoose.Model<NotificationTemplateDocument> | undefined) ??
  mongoose.model<NotificationTemplateDocument>("NotificationTemplate", NotificationTemplateSchema);

export default NotificationTemplateModel;

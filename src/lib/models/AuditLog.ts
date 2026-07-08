import mongoose from "mongoose";

export interface AuditLogDocument extends mongoose.Document {
  action: string;
  entityId: string;
  entityType: string;
  details: string; // JSON string of the deleted document or details
  performedBy: string; // admin email
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new mongoose.Schema<AuditLogDocument>(
  {
    action: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    details: { type: String, required: true },
    performedBy: { type: String, required: true },
  },
  { timestamps: true, collection: "audit_logs" },
);

if (mongoose.models.AuditLog) {
  delete mongoose.models.AuditLog;
}

const AuditLogModel = mongoose.model<AuditLogDocument>("AuditLog", AuditLogSchema);

export default AuditLogModel;

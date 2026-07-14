import mongoose from "mongoose";

export interface InventoryRequestItem {
  itemId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface InventoryRequestDocument extends mongoose.Document {
  requesterType: "Student" | "Teacher" | "SeniorTeacher";
  requesterId: mongoose.Types.ObjectId;
  items: InventoryRequestItem[];
  purpose: string;
  status: "Requested" | "Pending" | "Approved" | "Rejected" | "Issued" | "Returned";
  remarks?: string;
  approvedByAdminId?: mongoose.Types.ObjectId;
  issueId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryRequestSchema = new mongoose.Schema<InventoryRequestDocument>(
  {
    requesterType: {
      type: String,
      enum: ["Student", "Teacher", "SeniorTeacher"],
      required: true,
    },
    requesterId: { type: mongoose.Schema.Types.ObjectId, required: true },
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    purpose: { type: String, required: true },
    status: {
      type: String,
      enum: ["Requested", "Pending", "Approved", "Rejected", "Issued", "Returned"],
      default: "Requested",
    },
    remarks: { type: String },
    approvedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryIssue" },
  },
  { timestamps: true, collection: "inventory_requests" }
);

InventoryRequestSchema.index({ requesterId: 1, requesterType: 1 });
InventoryRequestSchema.index({ status: 1 });

const InventoryRequestModel =
  (mongoose.models.InventoryRequest as mongoose.Model<InventoryRequestDocument> | undefined) ??
  mongoose.model<InventoryRequestDocument>("InventoryRequest", InventoryRequestSchema);

export default InventoryRequestModel;

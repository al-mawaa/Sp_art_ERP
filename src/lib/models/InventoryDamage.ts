import mongoose from "mongoose";

export interface InventoryDamageDocument extends mongoose.Document {
  itemId: mongoose.Types.ObjectId;
  quantity: number;
  reason: string;
  reportedByUserId: mongoose.Types.ObjectId; // Could be teacher or admin
  reportedByUserType: "Admin" | "Teacher" | "SeniorTeacher";
  status: "Pending" | "Approved" | "Rejected";
  resolution: "WriteOff" | "Replacement" | "Pending";
  remarks?: string;
  resolvedByAdminId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryDamageSchema = new mongoose.Schema<InventoryDamageDocument>(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    reportedByUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reportedByUserType: {
      type: String,
      enum: ["Admin", "Teacher", "SeniorTeacher"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    resolution: {
      type: String,
      enum: ["WriteOff", "Replacement", "Pending"],
      default: "Pending",
    },
    remarks: { type: String },
    resolvedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true, collection: "inventory_damages" }
);

InventoryDamageSchema.index({ itemId: 1 });
InventoryDamageSchema.index({ status: 1 });

const InventoryDamageModel =
  (mongoose.models.InventoryDamage as mongoose.Model<InventoryDamageDocument> | undefined) ??
  mongoose.model<InventoryDamageDocument>("InventoryDamage", InventoryDamageSchema);

export default InventoryDamageModel;

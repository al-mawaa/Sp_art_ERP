import mongoose from "mongoose";

export interface InventoryReturnItem {
  itemId: mongoose.Types.ObjectId;
  quantity: number;
  condition: "Excellent" | "Good" | "Damaged" | "Lost";
}

export interface InventoryReturnDocument extends mongoose.Document {
  issueId: mongoose.Types.ObjectId; // Link to the original issue
  receiverType: "Student" | "Teacher" | "SeniorTeacher" | "Batch" | "Department";
  receiverId: mongoose.Types.ObjectId;
  items: InventoryReturnItem[];
  returnDate: Date;
  lateReturnFine: number;
  remarks?: string;
  processedByAdminId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryReturnSchema = new mongoose.Schema<InventoryReturnDocument>(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryIssue", required: true },
    receiverType: {
      type: String,
      enum: ["Student", "Teacher", "SeniorTeacher", "Batch", "Department"],
      required: true,
    },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
        quantity: { type: Number, required: true, min: 1 },
        condition: {
          type: String,
          enum: ["Excellent", "Good", "Damaged", "Lost"],
          required: true,
        },
      },
    ],
    returnDate: { type: Date, required: true, default: () => new Date() },
    lateReturnFine: { type: Number, default: 0 },
    remarks: { type: String },
    processedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true },
  },
  { timestamps: true, collection: "inventory_returns" }
);

InventoryReturnSchema.index({ issueId: 1 });
InventoryReturnSchema.index({ receiverId: 1, receiverType: 1 });

const InventoryReturnModel =
  (mongoose.models.InventoryReturn as mongoose.Model<InventoryReturnDocument> | undefined) ??
  mongoose.model<InventoryReturnDocument>("InventoryReturn", InventoryReturnSchema);

export default InventoryReturnModel;

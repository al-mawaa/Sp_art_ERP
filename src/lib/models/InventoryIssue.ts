import mongoose from "mongoose";

export interface InventoryIssueItem {
  itemId: mongoose.Types.ObjectId;
  quantity: number;
  condition: "Excellent" | "Good" | "Damaged" | "Lost" | "New";
}

export interface InventoryIssueDocument extends mongoose.Document {
  issueNumber: string;
  receiverType: "Student" | "Teacher" | "SeniorTeacher" | "Batch" | "Department";
  receiverId: mongoose.Types.ObjectId;
  items: InventoryIssueItem[];
  issueDate: Date;
  expectedReturnDate?: Date;
  purpose?: string;
  remarks?: string;
  status: "Issued" | "Partially_Returned" | "Returned";
  issuedByAdminId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryIssueSchema = new mongoose.Schema<InventoryIssueDocument>(
  {
    issueNumber: { type: String, required: true, unique: true },
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
          enum: ["Excellent", "Good", "Damaged", "Lost", "New"],
          default: "New",
        },
      },
    ],
    issueDate: { type: Date, required: true, default: () => new Date() },
    expectedReturnDate: { type: Date },
    purpose: { type: String },
    remarks: { type: String },
    status: {
      type: String,
      enum: ["Issued", "Partially_Returned", "Returned"],
      default: "Issued",
    },
    issuedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true },
  },
  { timestamps: true, collection: "inventory_issues" }
);

InventoryIssueSchema.index({ issueNumber: 1 }, { unique: true });
InventoryIssueSchema.index({ receiverId: 1, receiverType: 1 });
InventoryIssueSchema.index({ status: 1 });

const InventoryIssueModel =
  (mongoose.models.InventoryIssue as mongoose.Model<InventoryIssueDocument> | undefined) ??
  mongoose.model<InventoryIssueDocument>("InventoryIssue", InventoryIssueSchema);

export default InventoryIssueModel;

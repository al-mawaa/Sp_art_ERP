import mongoose from "mongoose";

export type MovementType = "Purchase" | "Issue" | "Return" | "Damage" | "Replacement" | "Adjustment" | "Transfer";

export interface InventoryMovementDocument extends mongoose.Document {
  itemId: mongoose.Types.ObjectId;
  type: MovementType;
  referenceId?: mongoose.Types.ObjectId; // PO Id, Issue Id, etc.
  quantity: number;
  previousStock: number;
  newStock: number;
  remarks?: string;
  createdByAdminId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryMovementSchema = new mongoose.Schema<InventoryMovementDocument>(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    type: {
      type: String,
      enum: ["Purchase", "Issue", "Return", "Damage", "Replacement", "Adjustment", "Transfer"],
      required: true,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    remarks: { type: String },
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true },
  },
  { timestamps: true, collection: "inventory_movements" }
);

InventoryMovementSchema.index({ itemId: 1 });
InventoryMovementSchema.index({ createdAt: -1 });
InventoryMovementSchema.index({ type: 1 });

const InventoryMovementModel =
  (mongoose.models.InventoryMovement as mongoose.Model<InventoryMovementDocument> | undefined) ??
  mongoose.model<InventoryMovementDocument>("InventoryMovement", InventoryMovementSchema);

export default InventoryMovementModel;

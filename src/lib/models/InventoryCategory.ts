import mongoose from "mongoose";

export interface InventoryCategoryDocument extends mongoose.Document {
  name: string;
  parentId?: mongoose.Types.ObjectId;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryCategorySchema = new mongoose.Schema<InventoryCategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryCategory" },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "inventory_categories" }
);

InventoryCategorySchema.index({ name: 1 });
InventoryCategorySchema.index({ parentId: 1 });

const InventoryCategoryModel =
  (mongoose.models.InventoryCategory as mongoose.Model<InventoryCategoryDocument> | undefined) ??
  mongoose.model<InventoryCategoryDocument>("InventoryCategory", InventoryCategorySchema);

export default InventoryCategoryModel;

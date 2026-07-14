import mongoose from "mongoose";

export interface InventoryItemDocument extends mongoose.Document {
  itemName: string;
  itemCode: string;
  barcode?: string;
  qrCode?: string;
  categoryId: mongoose.Types.ObjectId;
  subCategoryId?: mongoose.Types.ObjectId;
  brand?: string;
  unit: string;
  hsnCode?: string;
  gstPercentage: number;
  description?: string;
  image?: string;
  status: "Active" | "Inactive";
  
  // Stock tracking
  openingStock: number;
  currentStock: number;
  reservedStock: number;
  issuedStock: number;
  returnedStock: number;
  damagedStock: number;
  lostStock: number;
  
  // Alerts
  lowStockThreshold: number;
  criticalStockThreshold: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new mongoose.Schema<InventoryItemDocument>(
  {
    itemName: { type: String, required: true, trim: true },
    itemCode: { type: String, required: true, unique: true },
    barcode: { type: String },
    qrCode: { type: String },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryCategory", required: true },
    subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryCategory" },
    brand: { type: String },
    unit: { type: String, required: true },
    hsnCode: { type: String },
    gstPercentage: { type: Number, default: 0 },
    description: { type: String },
    image: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    
    openingStock: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    issuedStock: { type: Number, default: 0 },
    returnedStock: { type: Number, default: 0 },
    damagedStock: { type: Number, default: 0 },
    lostStock: { type: Number, default: 0 },
    
    lowStockThreshold: { type: Number, default: 10 },
    criticalStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true, collection: "inventory_items" }
);

InventoryItemSchema.index({ itemCode: 1 }, { unique: true });
InventoryItemSchema.index({ itemName: "text" });
InventoryItemSchema.index({ categoryId: 1 });
InventoryItemSchema.index({ status: 1 });

const InventoryItemModel =
  (mongoose.models.InventoryItem as mongoose.Model<InventoryItemDocument> | undefined) ??
  mongoose.model<InventoryItemDocument>("InventoryItem", InventoryItemSchema);

export default InventoryItemModel;

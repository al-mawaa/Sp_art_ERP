import mongoose from "mongoose";

export interface PurchaseOrderItem {
  itemId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  discount: number;
  total: number;
}

export interface PurchaseOrderDocument extends mongoose.Document {
  vendorId: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  purchaseDate: Date;
  expectedDeliveryDate?: Date;
  items: PurchaseOrderItem[];
  subTotal: number;
  totalGst: number;
  totalDiscount: number;
  totalAmount: number;
  status: "Pending" | "Ordered" | "Received" | "Cancelled";
  approvedByAdminId?: mongoose.Types.ObjectId;
  receivedByAdminId?: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema = new mongoose.Schema<PurchaseOrderDocument>(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    invoiceNumber: { type: String },
    purchaseDate: { type: Date, required: true, default: () => new Date() },
    expectedDeliveryDate: { type: Date },
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        gstPercentage: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true, default: 0 },
    totalGst: { type: Number, required: true, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Ordered", "Received", "Cancelled"],
      default: "Pending",
    },
    approvedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    receivedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    remarks: { type: String },
  },
  { timestamps: true, collection: "purchase_orders" }
);

PurchaseOrderSchema.index({ vendorId: 1 });
PurchaseOrderSchema.index({ status: 1 });
PurchaseOrderSchema.index({ purchaseDate: -1 });

const PurchaseOrderModel =
  (mongoose.models.PurchaseOrder as mongoose.Model<PurchaseOrderDocument> | undefined) ??
  mongoose.model<PurchaseOrderDocument>("PurchaseOrder", PurchaseOrderSchema);

export default PurchaseOrderModel;

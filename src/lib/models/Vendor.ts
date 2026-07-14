import mongoose from "mongoose";

export interface VendorDocument extends mongoose.Document {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new mongoose.Schema<VendorDocument>(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String },
    gstNumber: { type: String, trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true, collection: "vendors" }
);

VendorSchema.index({ name: "text" });

const VendorModel =
  (mongoose.models.Vendor as mongoose.Model<VendorDocument> | undefined) ??
  mongoose.model<VendorDocument>("Vendor", VendorSchema);

export default VendorModel;

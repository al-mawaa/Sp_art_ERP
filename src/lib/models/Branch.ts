import mongoose from 'mongoose';

export type BranchStatus = 'Active' | 'Inactive';

export interface BranchDocument extends mongoose.Document {
  name: string;
  address?: string;
  phone?: string;
  status: BranchStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new mongoose.Schema<BranchDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  {
    timestamps: true,
    collection: 'branches',
  }
);

const BranchModel =
  (mongoose.models.Branch as mongoose.Model<BranchDocument> | undefined) ??
  mongoose.model<BranchDocument>('Branch', BranchSchema);

export default BranchModel;

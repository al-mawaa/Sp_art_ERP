import mongoose from "mongoose";

export type RewardType = "physical" | "cashback" | "voucher" | "wallet";
export type RewardStatus = "active" | "inactive";

export interface RewardDocument extends mongoose.Document {
  title: string;
  description?: string;
  categoryId: mongoose.Types.ObjectId;
  image?: string;
  rewardType: RewardType;
  /** Wallet/cashback amount in INR when rewardType is wallet or cashback. */
  walletAmount?: number;
  requiredReferrals: number;
  status: RewardStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new mongoose.Schema<RewardDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RewardCategory",
      required: true,
      index: true,
    },
    image: { type: String, trim: true },
    rewardType: {
      type: String,
      enum: ["physical", "cashback", "voucher", "wallet"],
      default: "physical",
    },
    walletAmount: { type: Number, min: 0, default: 0 },
    requiredReferrals: { type: Number, required: true, min: 1, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "rewards" },
);

RewardSchema.index({ requiredReferrals: 1, status: 1 });

const RewardModel =
  (mongoose.models.Reward as mongoose.Model<RewardDocument> | undefined) ??
  mongoose.model<RewardDocument>("Reward", RewardSchema);

export default RewardModel;

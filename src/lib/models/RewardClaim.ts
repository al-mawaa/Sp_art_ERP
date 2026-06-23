import mongoose from "mongoose";

export type RewardClaimStatus =
  | "eligible"
  | "claimed"
  | "approved"
  | "rejected"
  | "shipped"
  | "delivered";

export interface RewardClaimDocument extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  rewardId: mongoose.Types.ObjectId;
  referralCount: number;
  claimStatus: RewardClaimStatus;
  address?: string;
  phoneNumber?: string;
  deliveryNotes?: string;
  adminRemark?: string;
  processedBy?: mongoose.Types.ObjectId;
  claimedAt?: Date;
  approvedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RewardClaimSchema = new mongoose.Schema<RewardClaimDocument>(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    rewardId: { type: mongoose.Schema.Types.ObjectId, ref: "Reward", required: true, index: true },
    referralCount: { type: Number, required: true, min: 0 },
    claimStatus: {
      type: String,
      enum: ["eligible", "claimed", "approved", "rejected", "shipped", "delivered"],
      default: "claimed",
      index: true,
    },
    address: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    deliveryNotes: { type: String, trim: true },
    adminRemark: { type: String, trim: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    claimedAt: { type: Date },
    approvedAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true, collection: "reward_claims" },
);

RewardClaimSchema.index({ studentId: 1, rewardId: 1 });

const RewardClaimModel =
  (mongoose.models.RewardClaim as mongoose.Model<RewardClaimDocument> | undefined) ??
  mongoose.model<RewardClaimDocument>("RewardClaim", RewardClaimSchema);

export default RewardClaimModel;

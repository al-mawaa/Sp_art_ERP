import mongoose from "mongoose";

export interface RewardCategoryDocument extends mongoose.Document {
  name: string;
  slug: string;
  description?: string;
  status: "active" | "inactive";
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const RewardCategorySchema = new mongoose.Schema<RewardCategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "reward_categories" },
);

const RewardCategoryModel =
  (mongoose.models.RewardCategory as mongoose.Model<RewardCategoryDocument> | undefined) ??
  mongoose.model<RewardCategoryDocument>("RewardCategory", RewardCategorySchema);

export default RewardCategoryModel;

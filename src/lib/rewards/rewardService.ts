import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Student from "@/lib/models/Student";
import ReferralTransaction from "@/lib/models/ReferralTransaction";
import StudentReferralProfile from "@/lib/models/StudentReferralProfile";
import ReferralWalletTransaction from "@/lib/models/ReferralWalletTransaction";
import RewardCategory from "@/lib/models/RewardCategory";
import Reward, { type RewardType, type RewardStatus } from "@/lib/models/Reward";
import RewardClaim, { type RewardClaimStatus } from "@/lib/models/RewardClaim";
import {
  sendAdminRewardClaimNotification,
  sendRewardApprovedEmail,
  sendRewardClaimedEmail,
  sendRewardDeliveredEmail,
  sendRewardRejectedEmail,
  sendRewardShippedEmail,
  sendRewardUnlockedEmail,
} from "@/lib/email/rewardEmail";

const DEFAULT_CATEGORIES = [
  { name: "Electronics", slug: "electronics", sortOrder: 1 },
  { name: "Gadgets", slug: "gadgets", sortOrder: 2 },
  { name: "Cashback", slug: "cashback", sortOrder: 3 },
  { name: "Gift Cards", slug: "gift-cards", sortOrder: 4 },
  { name: "Premium Rewards", slug: "premium-rewards", sortOrder: 5 },
  { name: "Special Campaign Rewards", slug: "special-campaign", sortOrder: 6 },
];

const DEFAULT_REWARDS: Array<{
  title: string;
  categorySlug: string;
  rewardType: RewardType;
  walletAmount?: number;
  requiredReferrals: number;
  description: string;
  sortOrder: number;
}> = [
  {
    title: "₹500 Wallet Credit",
    categorySlug: "cashback",
    rewardType: "wallet",
    walletAmount: 500,
    requiredReferrals: 1,
    description: "Instant wallet credit after admin approval",
    sortOrder: 1,
  },
  {
    title: "Smart Watch",
    categorySlug: "gadgets",
    rewardType: "physical",
    requiredReferrals: 5,
    description: "Premium smart watch for top referrers",
    sortOrder: 2,
  },
  {
    title: "Bluetooth Earbuds",
    categorySlug: "electronics",
    rewardType: "physical",
    requiredReferrals: 10,
    description: "Wireless earbuds delivered to your address",
    sortOrder: 3,
  },
  {
    title: "Mobile Phone",
    categorySlug: "electronics",
    rewardType: "physical",
    requiredReferrals: 20,
    description: "Smartphone reward for dedicated ambassadors",
    sortOrder: 4,
  },
  {
    title: "Laptop",
    categorySlug: "premium-rewards",
    rewardType: "physical",
    requiredReferrals: 50,
    description: "Premium laptop for elite referrers",
    sortOrder: 5,
  },
  {
    title: "Amazon Voucher",
    categorySlug: "gift-cards",
    rewardType: "voucher",
    requiredReferrals: 15,
    description: "Amazon gift voucher",
    sortOrder: 6,
  },
  {
    title: "Gift Hamper",
    categorySlug: "special-campaign",
    rewardType: "physical",
    requiredReferrals: 8,
    description: "Curated art supplies gift hamper",
    sortOrder: 7,
  },
];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Safe ObjectId string from populated or raw ref fields. */
function refId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === "object" && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    if (id instanceof mongoose.Types.ObjectId) return id.toString();
    if (typeof id === "string") return id;
  }
  return String(value);
}

export type StudentRewardStatus =
  | "locked"
  | "eligible"
  | "claimed"
  | "approved"
  | "rejected"
  | "shipped"
  | "delivered";

export async function getSuccessfulReferralCount(studentId: string) {
  await dbConnect();
  return ReferralTransaction.countDocuments({
    referrerId: new mongoose.Types.ObjectId(studentId),
    enrollmentStatus: true,
  });
}

export async function ensureDefaultRewardCatalog() {
  await dbConnect();
  for (const cat of DEFAULT_CATEGORIES) {
    await RewardCategory.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: { ...cat, status: "active" as const } },
      { upsert: true },
    );
  }

  const count = await Reward.countDocuments();
  if (count > 0) return;

  const categories = await RewardCategory.find();
  const bySlug = new Map(categories.map(c => [c.slug, c._id]));

  for (const item of DEFAULT_REWARDS) {
    const categoryId = bySlug.get(item.categorySlug);
    if (!categoryId) continue;
    await Reward.create({
      title: item.title,
      description: item.description,
      categoryId,
      rewardType: item.rewardType,
      walletAmount: item.walletAmount ?? 0,
      requiredReferrals: item.requiredReferrals,
      status: "active",
      sortOrder: item.sortOrder,
    });
  }
}

function mapStudentRewardStatus(
  successfulReferrals: number,
  requiredReferrals: number,
  claimStatus?: RewardClaimStatus,
): StudentRewardStatus {
  if (claimStatus === "delivered") return "delivered";
  if (claimStatus === "shipped") return "shipped";
  if (claimStatus === "approved") return "approved";
  if (claimStatus === "rejected") return "rejected";
  if (claimStatus === "claimed") return "claimed";
  if (successfulReferrals >= requiredReferrals) return "eligible";
  return "locked";
}

export async function getStudentRewardsDashboard(studentId: string) {
  await dbConnect();
  await ensureDefaultRewardCatalog();

  const [profile, successfulReferrals, rewards, claims] = await Promise.all([
    StudentReferralProfile.findOne({ studentId: new mongoose.Types.ObjectId(studentId) }),
    getSuccessfulReferralCount(studentId),
    Reward.find({ status: "active" })
      .populate("categoryId")
      .sort({ requiredReferrals: 1, sortOrder: 1 }),
    RewardClaim.find({ studentId: new mongoose.Types.ObjectId(studentId) }).sort({ createdAt: -1 }),
  ]);

  const claimByReward = new Map(claims.map(c => [c.rewardId.toString(), c]));

  const catalog = rewards.map(r => {
    const cat = r.categoryId as { name?: string; slug?: string } | null;
    const claim = claimByReward.get(r._id.toString());
    const status = mapStudentRewardStatus(
      successfulReferrals,
      r.requiredReferrals,
      claim?.claimStatus,
    );
    return {
      id: r._id.toString(),
      title: r.title,
      description: r.description ?? "",
      category: cat?.name ?? "General",
      categorySlug: cat?.slug ?? "",
      image: r.image ?? "",
      rewardType: r.rewardType,
      walletAmount: r.walletAmount ?? 0,
      requiredReferrals: r.requiredReferrals,
      status,
      claimId: claim?._id.toString(),
      claimStatus: claim?.claimStatus,
      progress: Math.min(100, Math.round((successfulReferrals / r.requiredReferrals) * 100)),
    };
  });

  const unlocked = catalog.filter(c => c.status !== "locked");
  const availableToClaim = catalog.filter(c => c.status === "eligible");
  const earned = catalog.filter(c =>
    ["claimed", "approved", "shipped", "delivered"].includes(c.status),
  );

  const nextReward = catalog.find(c => c.status === "locked");

  return {
    referralCode: profile?.referralCode ?? "",
    totalReferrals: profile?.totalReferrals ?? 0,
    successfulReferrals,
    rewardsEarned: earned.length,
    rewardsAvailable: availableToClaim.length,
    rewardsUnlocked: unlocked.length,
    nextReward: nextReward
      ? {
          title: nextReward.title,
          requiredReferrals: nextReward.requiredReferrals,
          currentReferrals: successfulReferrals,
          progress: nextReward.progress,
          remaining: Math.max(0, nextReward.requiredReferrals - successfulReferrals),
        }
      : null,
    catalog,
    claims: claims.map(c => ({
      id: c._id.toString(),
      rewardId: c.rewardId.toString(),
      referralCount: c.referralCount,
      claimStatus: c.claimStatus,
      address: c.address,
      phoneNumber: c.phoneNumber,
      deliveryNotes: c.deliveryNotes,
      adminRemark: c.adminRemark,
      claimedAt: c.claimedAt,
      approvedAt: c.approvedAt,
      shippedAt: c.shippedAt,
      deliveredAt: c.deliveredAt,
      createdAt: c.createdAt,
    })),
  };
}

export async function submitRewardClaim(params: {
  studentId: string;
  rewardId: string;
  address: string;
  phoneNumber: string;
  deliveryNotes?: string;
}) {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(params.rewardId)) {
    throw new Error("Invalid reward");
  }

  const reward = await Reward.findById(params.rewardId);
  if (!reward || reward.status !== "active") throw new Error("Reward not found");

  const successfulReferrals = await getSuccessfulReferralCount(params.studentId);
  if (successfulReferrals < reward.requiredReferrals) {
    throw new Error("You have not reached the required referral count");
  }

  const existing = await RewardClaim.findOne({
    studentId: new mongoose.Types.ObjectId(params.studentId),
    rewardId: reward._id,
    claimStatus: { $nin: ["rejected"] },
  });
  if (existing) throw new Error("You have already claimed this reward");

  const claim = await RewardClaim.create({
    studentId: new mongoose.Types.ObjectId(params.studentId),
    rewardId: reward._id,
    referralCount: successfulReferrals,
    claimStatus: "claimed",
    address: params.address.trim(),
    phoneNumber: params.phoneNumber.trim(),
    deliveryNotes: params.deliveryNotes?.trim(),
    claimedAt: new Date(),
  });

  const student = await Student.findById(params.studentId);
  if (student?.email) {
    try {
      await sendRewardClaimedEmail({
        studentEmail: student.email,
        studentName: student.fullName,
        rewardTitle: reward.title,
      });
    } catch (err) {
      console.error("Reward claimed email failed:", err);
    }
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_FROM;
  if (adminEmail && student) {
    try {
      await sendAdminRewardClaimNotification({
        adminEmail,
        studentName: student.fullName,
        rewardTitle: reward.title,
      });
    } catch (err) {
      console.error("Admin reward notification failed:", err);
    }
  }

  return claim;
}

/** Called after each successful referral payment — checks for newly unlocked rewards. */
export async function processReferralRewardUnlock(referrerId: string) {
  await dbConnect();
  await ensureDefaultRewardCatalog();

  const successfulReferrals = await getSuccessfulReferralCount(referrerId);
  const reward = await Reward.findOne({
    status: "active",
    requiredReferrals: successfulReferrals,
  });
  if (!reward) return;

  const student = await Student.findById(referrerId);
  if (!student?.email) return;

  try {
    await sendRewardUnlockedEmail({
      studentEmail: student.email,
      studentName: student.fullName,
      rewardTitle: reward.title,
      requiredReferrals: reward.requiredReferrals,
      successfulReferrals,
    });
  } catch (err) {
    console.error("Reward unlock email failed:", err);
  }
}

export async function getAdminRewardReport() {
  await dbConnect();
  await ensureDefaultRewardCatalog();

  const [categories, rewards, claims, topProfiles] = await Promise.all([
    RewardCategory.find().sort({ sortOrder: 1 }),
    Reward.find().populate("categoryId", "name slug").sort({ requiredReferrals: 1 }),
    RewardClaim.find()
      .populate("studentId", "fullName email badgeId")
      .populate("rewardId", "title rewardType")
      .sort({ createdAt: -1 }),
    StudentReferralProfile.find()
      .sort({ totalReferrals: -1 })
      .limit(10)
      .select("studentId referralCode totalReferrals totalEarnings")
      .lean(),
  ]);

  const topStudentIds = topProfiles.map(p => p.studentId).filter(Boolean);
  const topStudents = topStudentIds.length
    ? await Student.find({ _id: { $in: topStudentIds } }).select("fullName email").lean()
    : [];
  const topStudentMap = new Map(topStudents.map(s => [s._id.toString(), s]));

  const pending = claims.filter(c => c.claimStatus === "claimed");
  const approved = claims.filter(c => c.claimStatus === "approved");
  const shipped = claims.filter(c => c.claimStatus === "shipped");
  const delivered = claims.filter(c => c.claimStatus === "delivered");
  const rejected = claims.filter(c => c.claimStatus === "rejected");

  return {
    stats: {
      totalRewards: rewards.length,
      activeRewards: rewards.filter(r => r.status === "active").length,
      totalClaims: claims.length,
      pendingClaims: pending.length,
      approvedClaims: approved.length,
      shippedClaims: shipped.length,
      deliveredClaims: delivered.length,
      rejectedClaims: rejected.length,
    },
    categories: categories.map(c => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description,
      status: c.status,
      sortOrder: c.sortOrder,
    })),
    rewards: rewards.map(r => {
      const cat = r.categoryId as { name?: string; _id?: unknown } | null;
      return {
        id: r._id.toString(),
        title: r.title,
        description: r.description,
        categoryId: refId(r.categoryId),
        categoryName: cat?.name ?? "",
        image: r.image,
        rewardType: r.rewardType,
        walletAmount: r.walletAmount,
        requiredReferrals: r.requiredReferrals,
        status: r.status,
        sortOrder: r.sortOrder,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
      };
    }),
    claims: claims.map(c => {
      const student = c.studentId as { fullName?: string; email?: string; badgeId?: string } | null;
      const reward = c.rewardId as { title?: string; rewardType?: string } | null;
      return {
        id: c._id.toString(),
        studentId: refId(c.studentId),
        studentName: student?.fullName ?? "Student",
        studentEmail: student?.email ?? "",
        studentBadgeId: student?.badgeId ?? "",
        rewardId: refId(c.rewardId),
        rewardTitle: reward?.title ?? "",
        rewardType: reward?.rewardType ?? "",
        referralCount: c.referralCount,
        claimStatus: c.claimStatus,
        address: c.address,
        phoneNumber: c.phoneNumber,
        deliveryNotes: c.deliveryNotes,
        adminRemark: c.adminRemark,
        claimedAt: c.claimedAt,
        approvedAt: c.approvedAt,
        shippedAt: c.shippedAt,
        deliveredAt: c.deliveredAt,
        createdAt: c.createdAt,
      };
    }),
    topReferrers: topProfiles.map(p => {
      const sid = p.studentId.toString();
      const student = topStudentMap.get(sid);
      return {
        studentId: sid,
        studentName: student?.fullName ?? "Student",
        email: student?.email ?? "",
        referralCode: p.referralCode,
        totalReferrals: p.totalReferrals,
        totalEarnings: p.totalEarnings,
      };
    }),
  };
}

export async function createRewardCategory(params: {
  name: string;
  description?: string;
  status?: "active" | "inactive";
  sortOrder?: number;
}) {
  await dbConnect();
  const slug = slugify(params.name);
  const existing = await RewardCategory.findOne({ slug });
  if (existing) throw new Error("Category already exists");

  return RewardCategory.create({
    name: params.name.trim(),
    slug,
    description: params.description?.trim(),
    status: params.status ?? "active",
    sortOrder: params.sortOrder ?? 0,
  });
}

export async function updateRewardCategory(
  id: string,
  params: Partial<{ name: string; description: string; status: "active" | "inactive"; sortOrder: number }>,
) {
  await dbConnect();
  const cat = await RewardCategory.findById(id);
  if (!cat) throw new Error("Category not found");
  if (params.name) cat.name = params.name.trim();
  if (params.description !== undefined) cat.description = params.description.trim();
  if (params.status) cat.status = params.status;
  if (params.sortOrder !== undefined) cat.sortOrder = params.sortOrder;
  await cat.save();
  return cat;
}

export async function createReward(params: {
  title: string;
  description?: string;
  categoryId: string;
  image?: string;
  rewardType: RewardType;
  walletAmount?: number;
  requiredReferrals: number;
  status?: RewardStatus;
  sortOrder?: number;
}) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.categoryId)) {
    throw new Error("Invalid category");
  }
  return Reward.create({
    title: params.title.trim(),
    description: params.description?.trim(),
    categoryId: new mongoose.Types.ObjectId(params.categoryId),
    image: params.image?.trim(),
    rewardType: params.rewardType,
    walletAmount: params.walletAmount ?? 0,
    requiredReferrals: params.requiredReferrals,
    status: params.status ?? "active",
    sortOrder: params.sortOrder ?? 0,
  });
}

export async function updateReward(
  id: string,
  params: Partial<{
    title: string;
    description: string;
    categoryId: string;
    image: string;
    rewardType: RewardType;
    walletAmount: number;
    requiredReferrals: number;
    status: RewardStatus;
    sortOrder: number;
  }>,
) {
  await dbConnect();
  const reward = await Reward.findById(id);
  if (!reward) throw new Error("Reward not found");

  if (params.title) reward.title = params.title.trim();
  if (params.description !== undefined) reward.description = params.description.trim();
  if (params.categoryId && mongoose.Types.ObjectId.isValid(params.categoryId)) {
    reward.categoryId = new mongoose.Types.ObjectId(params.categoryId);
  }
  if (params.image !== undefined) reward.image = params.image.trim();
  if (params.rewardType) reward.rewardType = params.rewardType;
  if (params.walletAmount !== undefined) reward.walletAmount = params.walletAmount;
  if (params.requiredReferrals !== undefined) reward.requiredReferrals = params.requiredReferrals;
  if (params.status) reward.status = params.status;
  if (params.sortOrder !== undefined) reward.sortOrder = params.sortOrder;

  await reward.save();
  return reward;
}

export async function deleteReward(id: string) {
  await dbConnect();
  const activeClaims = await RewardClaim.countDocuments({
    rewardId: id,
    claimStatus: { $in: ["claimed", "approved", "shipped"] },
  });
  if (activeClaims > 0) throw new Error("Cannot delete reward with active claims");
  await Reward.findByIdAndDelete(id);
}

async function creditWalletForReward(studentId: string, amount: number, rewardTitle: string, claimId: mongoose.Types.ObjectId) {
  const profile = await StudentReferralProfile.findOne({
    studentId: new mongoose.Types.ObjectId(studentId),
  });
  if (!profile || amount <= 0) return;

  profile.totalEarnings = round2(profile.totalEarnings + amount);
  profile.availableBalance = round2(profile.availableBalance + amount);
  await profile.save();

  await ReferralWalletTransaction.create({
    studentId: profile.studentId,
    type: "credit",
    amount,
    description: `Reward cashback — ${rewardTitle}`,
    balanceAfter: profile.availableBalance,
  });
}

export async function updateRewardClaimStatus(params: {
  claimId: string;
  status: RewardClaimStatus;
  adminRemark?: string;
}) {
  await dbConnect();

  const claim = await RewardClaim.findById(params.claimId).populate("rewardId");
  if (!claim) throw new Error("Claim not found");

  const reward = claim.rewardId as {
    title?: string;
    rewardType?: string;
    walletAmount?: number;
  } | null;
  const rewardTitle = reward?.title ?? "Reward";
  const now = new Date();

  claim.claimStatus = params.status;
  if (params.adminRemark !== undefined) claim.adminRemark = params.adminRemark.trim();

  if (params.status === "approved") {
    claim.approvedAt = now;
    if (reward && (reward.rewardType === "wallet" || reward.rewardType === "cashback")) {
      const amount = reward.walletAmount ?? 0;
      if (amount > 0) {
        await creditWalletForReward(claim.studentId.toString(), amount, rewardTitle, claim._id);
      }
    }
  } else if (params.status === "shipped") {
    claim.shippedAt = now;
  } else if (params.status === "delivered") {
    claim.deliveredAt = now;
  }

  await claim.save();

  const student = await Student.findById(claim.studentId);
  if (!student?.email) return claim;

  try {
    if (params.status === "approved") {
      await sendRewardApprovedEmail({
        studentEmail: student.email,
        studentName: student.fullName,
        rewardTitle,
        walletAmount:
          reward?.rewardType === "wallet" || reward?.rewardType === "cashback"
            ? reward.walletAmount
            : undefined,
      });
    } else if (params.status === "rejected") {
      await sendRewardRejectedEmail({
        studentEmail: student.email,
        studentName: student.fullName,
        rewardTitle,
        adminRemark: params.adminRemark,
      });
    } else if (params.status === "shipped") {
      await sendRewardShippedEmail({
        studentEmail: student.email,
        studentName: student.fullName,
        rewardTitle,
      });
    } else if (params.status === "delivered") {
      await sendRewardDeliveredEmail({
        studentEmail: student.email,
        studentName: student.fullName,
        rewardTitle,
      });
    }
  } catch (err) {
    console.error("Reward status email failed:", err);
  }

  return claim;
}

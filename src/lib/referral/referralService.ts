import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Student from "@/lib/models/Student";
import ReferralSetting, { type ReferralPercentage } from "@/lib/models/ReferralSetting";
import StudentReferralProfile from "@/lib/models/StudentReferralProfile";
import ReferralTransaction from "@/lib/models/ReferralTransaction";
import ReferralWalletTransaction from "@/lib/models/ReferralWalletTransaction";
import EnrollmentPaymentRecord from "@/lib/models/EnrollmentPaymentRecord";
import CourseEnrollment from "@/lib/models/CourseEnrollment";
import Course from "@/lib/models/Course";
import { sendEnrolleeReferralDiscountEmail, sendReferralUsedEmail } from "@/lib/email/referralEmail";
import { resolvePaymentOrder } from "@/lib/enrollment/enrollmentPaymentService";
import type { PaymentType } from "@/lib/enrollment/paymentCalculations";
import {
  REFERRAL_SHARE_RATIO,
  applyReferralDiscountToPayment,
  calculateReferralCheckoutDiscount,
  getReferralEnrolleeDiscountTotal,
} from "@/lib/referral/referralCalculations";

export { calculateReferralCheckoutDiscount, getReferralEnrolleeDiscountTotal };

const ALLOWED_PERCENTAGES: ReferralPercentage[] = [5, 10, 15, 20];
const REFERRAL_CODE_PREFIX = "SPARTRF-";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function splitReferralPool(totalPool: number) {
  if (totalPool <= 0) {
    return { totalPool: 0, referrerAmount: 0, enrolleeAmount: 0 };
  }
  const referrerAmount = round2(totalPool * REFERRAL_SHARE_RATIO);
  const enrolleeAmount = round2(totalPool - referrerAmount);
  return { totalPool: round2(totalPool), referrerAmount, enrolleeAmount };
}

function resolveReferralSplit(transaction: {
  earnedAmount: number;
  referrerEarnedAmount?: number;
  enrolleeEarnedAmount?: number;
}) {
  if (
    transaction.referrerEarnedAmount != null &&
    transaction.enrolleeEarnedAmount != null &&
    (transaction.referrerEarnedAmount > 0 || transaction.enrolleeEarnedAmount > 0)
  ) {
    return {
      totalPool: transaction.earnedAmount,
      referrerAmount: transaction.referrerEarnedAmount,
      enrolleeAmount: transaction.enrolleeEarnedAmount,
    };
  }
  return {
    totalPool: transaction.earnedAmount,
    referrerAmount: transaction.earnedAmount,
    enrolleeAmount: 0,
  };
}

function formatReferralCode(sequence: number) {
  return `${REFERRAL_CODE_PREFIX}${String(sequence).padStart(4, "0")}`;
}

export async function generateNextReferralCode() {
  await dbConnect();

  const profiles = await StudentReferralProfile.find().select("referralCode").lean();
  let maxSequence = 0;

  for (const profile of profiles) {
    const match = profile.referralCode.match(/^SPARTRF-(\d+)$/i);
    if (match) {
      maxSequence = Math.max(maxSequence, Number.parseInt(match[1], 10));
    }
  }

  let sequence = maxSequence + 1;
  let code = formatReferralCode(sequence);

  while (await StudentReferralProfile.findOne({ referralCode: code })) {
    sequence += 1;
    code = formatReferralCode(sequence);
  }

  return code;
}

export async function ensureDefaultReferralSettings() {
  await dbConnect();
  const count = await ReferralSetting.countDocuments();
  if (count > 0) return;

  await ReferralSetting.insertMany(
    ALLOWED_PERCENTAGES.map((percentage, index) => ({
      percentage,
      status: index === 1 ? "active" : "inactive",
    })),
  );
}

export async function getActiveReferralPercentage(): Promise<number | null> {
  await dbConnect();
  const setting = await ReferralSetting.findOne({ status: "active" }).sort({ updatedAt: -1 });
  if (!setting) return null;
  if (setting.expiresAt && setting.expiresAt < new Date()) return null;
  return setting.percentage;
}

export async function ensureStudentReferralProfile(studentId: string) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error("Invalid student ID");
  }

  const existing = await StudentReferralProfile.findOne({
    studentId: new mongoose.Types.ObjectId(studentId),
  });
  if (existing) return existing;

  const student = await Student.findById(studentId);
  if (!student) throw new Error("Student not found");

  const code = await generateNextReferralCode();

  return StudentReferralProfile.create({
    studentId: student._id,
    referralCode: code,
    totalReferrals: 0,
    totalEarnings: 0,
    availableBalance: 0,
  });
}

export type ValidateReferralResult =
  | {
      valid: true;
      referralCode: string;
      referrerId: string;
      referrerName: string;
      referralPercentage: number;
    }
  | { valid: false; error: string };

export async function validateReferralCode(
  code: string,
  currentStudentId: string,
): Promise<ValidateReferralResult> {
  await dbConnect();

  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, error: "Referral code is required" };
  }

  const percentage = await getActiveReferralPercentage();
  if (percentage === null) {
    return { valid: false, error: "Referral program is currently inactive" };
  }

  const profile = await StudentReferralProfile.findOne({ referralCode: normalized });
  if (!profile) {
    return { valid: false, error: "Invalid referral code" };
  }

  if (profile.studentId.toString() === currentStudentId) {
    return { valid: false, error: "You cannot use your own referral code" };
  }

  const referrer = await Student.findById(profile.studentId);
  if (!referrer) {
    return { valid: false, error: "Invalid referral code" };
  }

  return {
    valid: true,
    referralCode: normalized,
    referrerId: profile.studentId.toString(),
    referrerName: referrer.fullName,
    referralPercentage: percentage,
  };
}

export async function resolveReferralPaymentAdjustment(params: {
  studentId: string;
  courseId: string;
  paymentType: PaymentType;
  termNo: number;
  enrollmentId?: string;
  referralCode?: string;
}) {
  const resolved = await resolvePaymentOrder({
    courseId: params.courseId,
    studentId: params.studentId,
    paymentType: params.paymentType,
    termNo: params.termNo,
    enrollmentId: params.enrollmentId,
  });

  let validatedReferral: Awaited<ReturnType<typeof validateReferralCode>> | null = null;
  let referralDiscount = 0;
  let chargeAmount = resolved.amount;

  if (params.enrollmentId) {
    const enrollment = await CourseEnrollment.findOne({
      _id: params.enrollmentId,
      studentId: new mongoose.Types.ObjectId(params.studentId),
    });
    const discountTotal = enrollment?.referralDiscountTotal ?? 0;
    const discountApplied = enrollment?.referralDiscountApplied ?? 0;
    const discountRemaining = round2(Math.max(0, discountTotal - discountApplied));

    if (discountRemaining > 0) {
      const applied = applyReferralDiscountToPayment(resolved.amount, discountRemaining);
      referralDiscount = applied.enrolleeDiscount;
      chargeAmount = applied.finalPayAmount;
    }

    return {
      resolved,
      chargeAmount,
      referralDiscount,
      validatedReferral,
    };
  }

  const referralCode = params.referralCode?.trim();
  if (referralCode) {
    const validation = await validateReferralCode(referralCode, params.studentId);
    if (validation.valid === false) {
      throw new Error(validation.error);
    }
    validatedReferral = validation;

    const checkout = calculateReferralCheckoutDiscount({
      courseTotalAmount: resolved.breakdown.totalAmount,
      payAmount: resolved.amount,
      referralPercentage: validation.referralPercentage,
    });
    referralDiscount = checkout.enrolleeDiscount;
    chargeAmount = checkout.finalPayAmount;
  }

  return { resolved, chargeAmount, referralDiscount, validatedReferral };
}

export async function applyReferralDiscountToEnrollment(params: {
  enrollmentId: string;
  orderId: string;
  referralDiscount: number;
  isNewEnrollment: boolean;
}) {
  if (params.referralDiscount <= 0) return;

  const enrollment = await CourseEnrollment.findById(params.enrollmentId);
  if (!enrollment) return;

  if (params.isNewEnrollment) {
    const referralTx = await ReferralTransaction.findOne({ orderId: params.orderId });
    if (referralTx) {
      const { enrolleeDiscountTotal } = getReferralEnrolleeDiscountTotal(
        enrollment.totalAmount ?? enrollment.amount ?? referralTx.courseAmount,
        referralTx.referralPercentage,
      );
      enrollment.referralCode = referralTx.referralCode;
      enrollment.referralDiscountTotal = enrolleeDiscountTotal;
    }
  }

  enrollment.referralDiscountApplied = round2(
    (enrollment.referralDiscountApplied ?? 0) + params.referralDiscount,
  );
  await enrollment.save();
}

export async function createPendingReferralTransaction(params: {
  referrerId: string;
  referredStudentId: string;
  referredStudentName: string;
  referralCode: string;
  referralPercentage: number;
  courseAmount: number;
  enrolleeDiscount: number;
  orderId: string;
}) {
  await dbConnect();

  const existing = await ReferralTransaction.findOne({ orderId: params.orderId });
  if (existing) return existing;

  return ReferralTransaction.create({
    referrerId: new mongoose.Types.ObjectId(params.referrerId),
    referredStudentId: new mongoose.Types.ObjectId(params.referredStudentId),
    referredStudentName: params.referredStudentName,
    referralCode: params.referralCode.toUpperCase(),
    referralPercentage: params.referralPercentage,
    courseAmount: params.courseAmount,
    enrolleeEarnedAmount: round2(params.enrolleeDiscount),
    earnedAmount: 0,
    enrollmentStatus: false,
    paymentStatus: "pending",
    orderId: params.orderId,
  });
}

export async function completeReferralOnPayment(params: {
  referredStudentId: string;
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseAmount: number;
  orderId: string;
  referralCode?: string;
}) {
  await dbConnect();

  const { referredStudentId, enrollmentId, courseId, courseTitle, courseAmount, orderId } =
    params;

  let transaction = await ReferralTransaction.findOne({ orderId });
  const referralCode = params.referralCode?.trim().toUpperCase();

  if (!transaction && referralCode) {
    const validation = await validateReferralCode(referralCode, referredStudentId);
    if (validation.valid === false) return null;

    const referredStudent = await Student.findById(referredStudentId);
    transaction = await ReferralTransaction.create({
      referrerId: new mongoose.Types.ObjectId(validation.referrerId),
      referredStudentId: new mongoose.Types.ObjectId(referredStudentId),
      referredStudentName: referredStudent?.fullName ?? "Student",
      referralCode: validation.referralCode,
      referralPercentage: validation.referralPercentage,
      courseAmount,
      earnedAmount: 0,
      enrollmentStatus: false,
      paymentStatus: "pending",
      orderId,
    });
  }

  if (!transaction || transaction.enrollmentStatus) {
    return transaction;
  }

  const effectiveCourseAmount = Math.max(
    courseAmount,
    transaction.courseAmount ?? 0,
  );
  const totalPool = round2((effectiveCourseAmount * transaction.referralPercentage) / 100);
  const { referrerAmount, enrolleeAmount: poolEnrolleeShare } = splitReferralPool(totalPool);
  const pendingDiscount = transaction.enrolleeEarnedAmount ?? 0;
  const enrolleeDiscountApplied =
    pendingDiscount > 0 ? pendingDiscount : poolEnrolleeShare;

  transaction.enrollmentId = new mongoose.Types.ObjectId(enrollmentId);
  transaction.courseId = new mongoose.Types.ObjectId(courseId);
  transaction.courseTitle = courseTitle;
  transaction.courseAmount = effectiveCourseAmount;
  transaction.earnedAmount = totalPool;
  transaction.referrerEarnedAmount = referrerAmount;
  transaction.enrolleeEarnedAmount = enrolleeDiscountApplied;
  transaction.enrollmentStatus = true;
  transaction.paymentStatus = "paid";
  await transaction.save();

  const referrerProfile = await ensureStudentReferralProfile(transaction.referrerId.toString());
  referrerProfile.totalReferrals += 1;
  if (referrerAmount > 0) {
    referrerProfile.totalEarnings = round2(referrerProfile.totalEarnings + referrerAmount);
    referrerProfile.availableBalance = round2(referrerProfile.availableBalance + referrerAmount);
  }
  await referrerProfile.save();

  if (referrerAmount > 0) {
    await ReferralWalletTransaction.create({
      studentId: referrerProfile.studentId,
      type: "credit",
      amount: referrerAmount,
      description: `Referral reward (50%) — ${courseTitle}`,
      referralTransactionId: transaction._id,
      balanceAfter: referrerProfile.availableBalance,
    });
  }

  const [referrer, enrollee] = await Promise.all([
    Student.findById(transaction.referrerId),
    Student.findById(referredStudentId),
  ]);

  if (referrer?.email && referrerAmount > 0) {
    try {
      await sendReferralUsedEmail({
        referrerEmail: referrer.email,
        referrerName: referrer.fullName,
        referredStudentName: transaction.referredStudentName,
        courseTitle,
        earnedAmount: referrerAmount,
        totalPool,
        referralCode: transaction.referralCode,
      });
    } catch (err) {
      console.error("Referral email failed:", err);
    }
  }

  if (enrollee?.email && enrolleeDiscountApplied > 0) {
    try {
      await sendEnrolleeReferralDiscountEmail({
        enrolleeEmail: enrollee.email,
        enrolleeName: enrollee.fullName,
        referrerName: referrer?.fullName ?? "Referrer",
        courseTitle,
        discountAmount: enrolleeDiscountApplied,
        totalPool,
        referralCode: transaction.referralCode,
      });
    } catch (err) {
      console.error("Enrollee referral email failed:", err);
    }
  }

  try {
    const { processReferralRewardUnlock } = await import("@/lib/rewards/rewardService");
    await processReferralRewardUnlock(transaction.referrerId.toString());
  } catch (err) {
    console.error("Referral reward unlock failed:", err);
  }

  return transaction;
}

/** Complete referral rows left pending after a successful Razorpay payment. */
export async function reconcilePendingReferralTransactions() {
  await dbConnect();

  const pending = await ReferralTransaction.find({
    enrollmentStatus: false,
    orderId: { $exists: true, $ne: null },
  });

  let repaired = 0;

  for (const transaction of pending) {
    const paymentRecord = await EnrollmentPaymentRecord.findOne({
      orderId: transaction.orderId,
      paymentStatus: "paid",
    });

    if (!paymentRecord) continue;

    const enrollment = await CourseEnrollment.findById(paymentRecord.enrollmentId);
    if (!enrollment) continue;

    const course = await Course.findById(enrollment.courseId);

    await completeReferralOnPayment({
      referredStudentId: transaction.referredStudentId.toString(),
      enrollmentId: enrollment._id.toString(),
      courseId: enrollment.courseId.toString(),
      courseTitle: course?.courseTitle ?? "Course",
      courseAmount: Number(enrollment.totalAmount ?? enrollment.amount ?? paymentRecord.amount ?? 0),
      orderId: transaction.orderId!,
      referralCode: transaction.referralCode,
    });
    repaired += 1;
  }

  return repaired;
}

export async function getStudentReferralDashboard(studentId: string) {
  await dbConnect();
  const profile = await ensureStudentReferralProfile(studentId);
  const studentOid = new mongoose.Types.ObjectId(studentId);

  const [referralTransactions, enrollmentBonuses, walletHistory] = await Promise.all([
    ReferralTransaction.find({ referrerId: studentOid }).sort({ createdAt: -1 }),
    ReferralTransaction.find({ referredStudentId: studentOid, enrollmentStatus: true }).sort({
      createdAt: -1,
    }),
    ReferralWalletTransaction.find({ studentId: studentOid }).sort({ createdAt: -1 }).limit(50),
  ]);

  const successful = referralTransactions.filter(t => t.enrollmentStatus).length;
  const pending = referralTransactions.filter(t => !t.enrollmentStatus).length;
  const activePercentage = await getActiveReferralPercentage();

  return {
    referralCode: profile.referralCode,
    totalReferrals: profile.totalReferrals,
    totalEarnings: profile.totalEarnings,
    availableBalance: profile.availableBalance,
    successfulEnrollments: successful,
    pendingReferrals: pending,
    activeReferralPercentage: activePercentage,
    splitNote:
      "Referral pool is split 50% to referrer (wallet) and 50% enrollee discount at checkout — full and installment payments.",
    referrals: referralTransactions.map(t => {
      const split = resolveReferralSplit(t);
      return {
        id: t._id.toString(),
        referralCode: t.referralCode,
        referredStudentName: t.referredStudentName,
        referredStudentId: t.referredStudentId.toString(),
        referralPercentage: t.referralPercentage,
        enrollmentStatus: t.enrollmentStatus,
        paymentStatus: t.paymentStatus,
        earnedAmount: split.referrerAmount,
        totalPool: split.totalPool,
        referrerEarnedAmount: split.referrerAmount,
        enrolleeEarnedAmount: split.enrolleeAmount,
        courseTitle: t.courseTitle,
        courseAmount: t.courseAmount,
        createdAt: t.createdAt,
      };
    }),
    enrollmentBonuses: enrollmentBonuses.map(t => {
      const split = resolveReferralSplit(t);
      return {
        id: t._id.toString(),
        referralCode: t.referralCode,
        courseTitle: t.courseTitle,
        courseAmount: t.courseAmount,
        referralPercentage: t.referralPercentage,
        earnedAmount: split.enrolleeAmount,
        totalPool: split.totalPool,
        createdAt: t.createdAt,
      };
    }),
    walletHistory: walletHistory.map(w => ({
      id: w._id.toString(),
      type: w.type,
      amount: w.amount,
      description: w.description,
      balanceAfter: w.balanceAfter,
      createdAt: w.createdAt,
    })),
  };
}

export async function getAdminReferralReport(filters?: {
  studentId?: string;
  referralCode?: string;
  status?: "all" | "success" | "pending";
  from?: string;
  to?: string;
}) {
  await dbConnect();

  await ensureDefaultReferralSettings();

  const query: Record<string, unknown> = {};
  if (filters?.studentId && mongoose.Types.ObjectId.isValid(filters.studentId)) {
    query.referrerId = new mongoose.Types.ObjectId(filters.studentId);
  }
  if (filters?.referralCode) {
    query.referralCode = filters.referralCode.trim().toUpperCase();
  }
  if (filters?.status === "success") query.enrollmentStatus = true;
  if (filters?.status === "pending") query.enrollmentStatus = false;
  if (filters?.from || filters?.to) {
    query.createdAt = {};
    if (filters.from) (query.createdAt as Record<string, Date>).$gte = new Date(filters.from);
    if (filters.to) {
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      (query.createdAt as Record<string, Date>).$lte = to;
    }
  }

  const [settings, transactions, profiles] = await Promise.all([
    ReferralSetting.find().sort({ percentage: 1 }),
    ReferralTransaction.find(query)
      .populate({ path: "referrerId", model: Student, select: "fullName email badgeId" })
      .sort({ createdAt: -1 }),
    StudentReferralProfile.find()
      .populate({ path: "studentId", model: Student, select: "fullName email" })
      .sort({ totalEarnings: -1 })
      .limit(10),
  ]);

  const activeSetting = settings.find(s => s.status === "active") ?? null;
  const successful = transactions.filter(t => t.enrollmentStatus);
  const totalEarningsDistributed = successful.reduce((s, t) => s + t.earnedAmount, 0);
  const totalRevenue = successful.reduce((s, t) => s + t.courseAmount, 0);

  return {
    settings: settings.map(s => ({
      id: s._id.toString(),
      percentage: s.percentage,
      status: s.status,
      expiresAt: s.expiresAt,
      updatedAt: s.updatedAt,
    })),
    activePercentage: activeSetting?.percentage ?? null,
    stats: {
      totalReferrals: transactions.length,
      successfulEnrollments: successful.length,
      pendingReferrals: transactions.length - successful.length,
      totalEarningsDistributed: round2(totalEarningsDistributed),
      referralRevenue: round2(totalRevenue),
    },
    topReferrers: profiles.map(p => {
      const student = p.studentId as { _id?: mongoose.Types.ObjectId; fullName?: string; email?: string } | null;
      return {
        studentId: student?._id?.toString() ?? p._id.toString(),
        studentName: student?.fullName ?? "Unknown",
        referralCode: p.referralCode,
        totalReferrals: p.totalReferrals,
        totalEarnings: p.totalEarnings,
      };
    }),
    transactions: transactions.map(t => {
      const referrer = t.referrerId as { fullName?: string; _id?: mongoose.Types.ObjectId } | null;
      const split = resolveReferralSplit(t);
      return {
        id: t._id.toString(),
        referralCode: t.referralCode,
        referrerName: referrer?.fullName ?? "Unknown",
        referrerId: referrer?._id?.toString() ?? t._id.toString(),
        referredStudentName: t.referredStudentName,
        referredStudentId: t.referredStudentId?.toString() ?? "",
        referralPercentage: t.referralPercentage,
        enrollmentStatus: t.enrollmentStatus,
        paymentStatus: t.paymentStatus,
        earnedAmount: split.totalPool,
        referrerEarnedAmount: split.referrerAmount,
        enrolleeEarnedAmount: split.enrolleeAmount,
        courseAmount: t.courseAmount,
        courseTitle: t.courseTitle,
        createdAt: t.createdAt,
      };
    }),
    allowedPercentages: ALLOWED_PERCENTAGES,
  };
}

export async function saveReferralSettings(percentage: ReferralPercentage, status: "active" | "inactive") {
  await dbConnect();
  if (!ALLOWED_PERCENTAGES.includes(percentage)) {
    throw new Error("Invalid referral percentage");
  }

  let setting = await ReferralSetting.findOne({ percentage });
  if (!setting) {
    setting = await ReferralSetting.create({ percentage, status });
  } else {
    setting.status = status;
    await setting.save();
  }

  if (status === "active") {
    await ReferralSetting.updateMany(
      { _id: { $ne: setting._id } },
      { $set: { status: "inactive" } },
    );
  }

  return setting;
}

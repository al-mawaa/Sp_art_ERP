import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import { getAdminReferralReport, saveReferralSettings, reconcilePendingReferralTransactions } from "@/lib/referral/referralService";
import type { ReferralPercentage } from "@/lib/models/ReferralSetting";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    console.log("[GET /api/admin/referrals] Step 1: Checking auth...");
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    console.log("[GET /api/admin/referrals] Step 2: Auth passed, reconciling...");
    const { searchParams } = new URL(request.url);

    // Reconcile is best-effort — don't let it crash the report
    try {
      await reconcilePendingReferralTransactions();
    } catch (reconcileErr) {
      console.error("[GET /api/admin/referrals] Reconcile failed (non-fatal):", reconcileErr);
    }

    console.log("[GET /api/admin/referrals] Step 3: Fetching report...");
    const report = await getAdminReferralReport({
      studentId: searchParams.get("studentId") ?? undefined,
      referralCode: searchParams.get("referralCode") ?? undefined,
      status: (searchParams.get("status") as "all" | "success" | "pending") ?? "all",
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    console.log("[GET /api/admin/referrals] Step 4: Report fetched successfully");
    return NextResponse.json(report);
  } catch (error) {
    console.error("[GET /api/admin/referrals] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load referrals" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const percentage = Number(body?.percentage) as ReferralPercentage;
    const status = body?.status === "active" ? "active" : "inactive";

    if (![5, 10, 15, 20].includes(percentage)) {
      return NextResponse.json({ error: "Invalid percentage. Use 5, 10, 15, or 20." }, { status: 400 });
    }

    const setting = await saveReferralSettings(percentage, status);
    return NextResponse.json({
      success: true,
      setting: {
        id: setting._id.toString(),
        percentage: setting.percentage,
        status: setting.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import {
  getAdminRewardReport,
  updateRewardClaimStatus,
} from "@/lib/rewards/rewardService";
import type { RewardClaimStatus } from "@/lib/models/RewardClaim";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const report = await getAdminRewardReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/admin/reward-claims error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load reward report" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const claimId = typeof body?.claimId === "string" ? body.claimId : "";
    const status = body?.status as RewardClaimStatus;
    const adminRemark = typeof body?.adminRemark === "string" ? body.adminRemark : undefined;

    const allowed: RewardClaimStatus[] = [
      "approved",
      "rejected",
      "shipped",
      "delivered",
    ];
    if (!claimId || !allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid claim update" }, { status: 400 });
    }

    const claim = await updateRewardClaimStatus({ claimId, status, adminRemark });
    return NextResponse.json({ success: true, claimId: claim._id.toString(), status: claim.claimStatus });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update claim" },
      { status: 500 },
    );
  }
}

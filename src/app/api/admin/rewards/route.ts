import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import {
  createReward,
  createRewardCategory,
  deleteReward,
  getAdminRewardReport,
  updateReward,
  updateRewardCategory,
} from "@/lib/rewards/rewardService";
import type { RewardType, RewardStatus } from "@/lib/models/Reward";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const report = await getAdminRewardReport();
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load rewards" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const entity = body?.entity === "category" ? "category" : "reward";

    if (entity === "category") {
      const category = await createRewardCategory({
        name: body.name,
        description: body.description,
        status: body.status,
        sortOrder: body.sortOrder,
      });
      return NextResponse.json({
        success: true,
        category: { id: category._id.toString(), name: category.name },
      });
    }

    const reward = await createReward({
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      image: body.image,
      rewardType: body.rewardType as RewardType,
      walletAmount: Number(body.walletAmount ?? 0),
      requiredReferrals: Number(body.requiredReferrals),
      status: body.status as RewardStatus,
      sortOrder: Number(body.sortOrder ?? 0),
    });
    return NextResponse.json({
      success: true,
      reward: { id: reward._id.toString(), title: reward.title },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const entity = body?.entity === "category" ? "category" : "reward";
    const id = typeof body?.id === "string" ? body.id : "";

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    if (entity === "category") {
      await updateRewardCategory(id, body);
      return NextResponse.json({ success: true });
    }

    await updateReward(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await deleteReward(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 },
    );
  }
}

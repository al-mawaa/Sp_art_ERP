import { NextRequest, NextResponse } from "next/server";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import {
  getStudentRewardsDashboard,
  submitRewardClaim,
} from "@/lib/rewards/rewardService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const dashboard = await getStudentRewardsDashboard(auth.student.id);
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load rewards" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const rewardId = typeof body?.rewardId === "string" ? body.rewardId : "";
    const address = typeof body?.address === "string" ? body.address.trim() : "";
    const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const deliveryNotes =
      typeof body?.deliveryNotes === "string" ? body.deliveryNotes.trim() : undefined;

    if (!rewardId || !address || !phoneNumber) {
      return NextResponse.json(
        { error: "rewardId, address, and phoneNumber are required" },
        { status: 400 },
      );
    }

    const claim = await submitRewardClaim({
      studentId: auth.student.id,
      rewardId,
      address,
      phoneNumber,
      deliveryNotes,
    });

    return NextResponse.json({
      success: true,
      claimId: claim._id.toString(),
      message: "Reward claim submitted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit claim" },
      { status: 400 },
    );
  }
}

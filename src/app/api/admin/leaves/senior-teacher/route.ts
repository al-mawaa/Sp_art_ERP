import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SeniorTeacherLeave from "@/lib/models/SeniorTeacherLeave";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import { serializeSeniorLeave } from "@/lib/leave/seniorTeacherUtils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "").trim();

    const filter: Record<string, string> = {};
    if (status && status !== "All") filter.status = status;

    const leaves = await SeniorTeacherLeave.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: { leaves: leaves.map(serializeSeniorLeave) },
    });
  } catch (e) {
    console.error("[admin/leaves/senior-teacher GET]", e);
    return NextResponse.json({ success: false, error: "Failed to load leave requests" }, { status: 500 });
  }
}

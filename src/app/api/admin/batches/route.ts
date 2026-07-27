import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import Batch from "@/lib/models/Batch";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const batches = await Batch.find({ batchStatus: "Active" })
      .select("_id batchName courseName batchTiming batchDay batchTime")
      .sort({ batchName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      batches: batches.map(b => ({
        id: b._id.toString(),
        batchName: b.batchName,
        courseName: b.courseName,
        batchTiming: b.batchTiming || `${b.batchDay} ${b.batchTime}`,
      })),
    });
  } catch (error: unknown) {
    console.error("[admin/batches GET]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load batches" },
      { status: 500 }
    );
  }
}

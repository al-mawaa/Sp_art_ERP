import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import dbConnect from "@/lib/mongodb";
import StudentFeedback from "@/lib/models/StudentFeedback";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { teacherId } = await params;
    if (!teacherId) {
      return NextResponse.json({ success: false, error: "Teacher ID is required" }, { status: 400 });
    }

    await dbConnect();

    const result = await StudentFeedback.deleteMany({ teacherId });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} feedback records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting teacher feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}

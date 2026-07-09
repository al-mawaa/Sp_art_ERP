import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import dbConnect from "@/lib/mongodb";
import StudentFeedback from "@/lib/models/StudentFeedback";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const body = await request.json();
    const { status, adminRemark } = body;

    await dbConnect();

    const feedback = await StudentFeedback.findById(id);
    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    if (status) feedback.status = status;
    if (adminRemark !== undefined) feedback.adminRemark = adminRemark;

    await feedback.save();

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("Admin feedback PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update feedback" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;

    await dbConnect();

    const result = await StudentFeedback.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin feedback DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete feedback" },
      { status: 500 }
    );
  }
}

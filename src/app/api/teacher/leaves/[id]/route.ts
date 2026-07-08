import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Leave from "@/lib/models/Leave";
import { requireTeacherFromRequest } from "@/lib/auth/require-teacher";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return (auth as { ok: false; response: NextResponse }).response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const doc = await Leave.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
    }

    // Only allow deleting own leaves
    if (doc.teacherId.toString() !== auth.teacher.id) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this leave" }, { status: 403 });
    }

    // Only pending leaves can be deleted
    if (doc.status !== "Pending") {
      return NextResponse.json({ success: false, error: "Only pending leaves can be deleted" }, { status: 400 });
    }

    await Leave.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Leave deleted successfully" });
  } catch (e) {
    console.error("[teacher/leaves/[id] DELETE]", e);
    return NextResponse.json({ success: false, error: "Failed to delete leave" }, { status: 500 });
  }
}

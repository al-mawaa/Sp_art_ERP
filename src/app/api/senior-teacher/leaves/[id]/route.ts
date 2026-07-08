import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import SeniorTeacherLeave from "@/lib/models/SeniorTeacherLeave";
import { requireSeniorTeacherFromRequest } from "@/lib/auth/require-senior-teacher";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return (auth as { ok: false; response: NextResponse }).response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const doc = await SeniorTeacherLeave.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
    }

    // Only allow deleting own leaves
    if (doc.seniorTeacherId.toString() !== auth.seniorTeacher.id) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this leave" }, { status: 403 });
    }

    // Only pending leaves can be deleted
    if (doc.status !== "Pending") {
      return NextResponse.json({ success: false, error: "Only pending leaves can be deleted" }, { status: 400 });
    }

    await SeniorTeacherLeave.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Leave deleted successfully" });
  } catch (e) {
    console.error("[senior-teacher/leaves/[id] DELETE]", e);
    return NextResponse.json({ success: false, error: "Failed to delete leave" }, { status: 500 });
  }
}

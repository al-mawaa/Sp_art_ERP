import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Batch from "@/lib/models/Batch";
import { requireTeacherFromRequest } from "@/lib/auth/require-teacher";
import { teacherCanAccessBatch } from "@/lib/auth/require-batch-access";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id: batchId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return NextResponse.json({ success: false, error: "Invalid batch id" }, { status: 400 });
    }

    const allowed = await teacherCanAccessBatch(auth.teacher.id, batchId);
    console.debug('[debug] teacherCanAccessBatch', { teacherId: auth.teacher.id, batchId, allowed });
    if (!allowed) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    await dbConnect();
    const batch = await Batch.findById(batchId).lean();
    if (!batch) return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });

    const students = (batch.students || []).map(s => ({
      id: String(s._id),
      studentId: s.studentId ? String(s.studentId) : undefined,
      name: s.studentName,
      email: s.studentEmail,
      phone: s.phone,
    }));
    console.debug('[debug] batch students count', { batchId, count: students.length });

    return NextResponse.json({ success: true, data: { students } });
  } catch (e) {
    console.error("[teacher/batches/[id]/students GET]", e);
    return NextResponse.json({ success: false, error: "Failed to load students" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import Batch from "@/lib/models/Batch";
import type { StaffRole } from "@/lib/attendance/staffSelfAttendance";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const role = (searchParams.get("role") || "teacher").trim() as StaffRole;

    await dbConnect();

    const [staff, batches] = await Promise.all([
      role === "teacher"
        ? Teacher.find({}).select("fullName").sort({ fullName: 1 }).lean()
        : SeniorTeacher.find({}).select("fullName").sort({ fullName: 1 }).lean(),
      Batch.find({}).select("batchName").sort({ batchName: 1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        staff: staff.map(s => ({
          id: s._id.toString(),
          name: "fullName" in s ? (s.fullName as string) : "Staff",
        })),
        batches: batches.map(b => ({
          id: b._id.toString(),
          batchName: b.batchName,
        })),
      },
    });
  } catch (e) {
    console.error("[admin/staff-attendance/filters GET]", e);
    return NextResponse.json({ success: false, error: "Failed to load filters" }, { status: 500 });
  }
}

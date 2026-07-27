import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Teacher from "@/lib/models/Teacher";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const { id } = await params;
    const teacher = await Teacher.findById(id).lean();
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, teacher });
  } catch (error: any) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch teacher" }, { status: 500 });
  }
}

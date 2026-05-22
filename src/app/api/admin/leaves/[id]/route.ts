import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Leave from "@/lib/models/Leave";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import { serializeLeave } from "@/lib/leave/utils";
import { sendLeaveStatusEmailToTeacher } from "@/lib/leave/leaveEmail";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const doc = await Leave.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { leave: serializeLeave(doc) } });
  } catch (e) {
    console.error("[admin/leaves/[id] GET]", e);
    return NextResponse.json({ success: false, error: "Failed to load leave" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }

    let body: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text.trim()) body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const action = String(body.action ?? body.status ?? "").trim();
    const adminRemark = String(body.adminRemark ?? body.remarks ?? "").trim();

    let newStatus: "Approved" | "Rejected" | null = null;
    if (action === "approve" || action === "Approved") newStatus = "Approved";
    if (action === "reject" || action === "Rejected") newStatus = "Rejected";

    if (!newStatus) {
      return NextResponse.json({ success: false, error: "action must be approve or reject" }, { status: 400 });
    }

    await dbConnect();
    const doc = await Leave.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
    }

    if (doc.status !== "Pending") {
      return NextResponse.json(
        { success: false, error: `Leave is already ${doc.status}` },
        { status: 409 },
      );
    }

    doc.status = newStatus;
    doc.adminRemark = adminRemark;
    await doc.save();

    try {
      await sendLeaveStatusEmailToTeacher(
        doc.teacherEmail,
        {
          teacherName: doc.teacherName,
          leaveType: doc.leaveType,
          fromDate: doc.fromDate,
          toDate: doc.toDate,
          reason: doc.reason,
          status: doc.status,
          adminRemark: doc.adminRemark,
        },
        newStatus === "Approved",
      );
    } catch (err) {
      console.error("[admin/leaves email]", err);
    }

    return NextResponse.json({
      success: true,
      data: { leave: serializeLeave(doc) },
      message: `Leave ${newStatus.toLowerCase()}`,
    });
  } catch (e) {
    console.error("[admin/leaves/[id] PATCH]", e);
    return NextResponse.json({ success: false, error: "Failed to update leave" }, { status: 500 });
  }
}

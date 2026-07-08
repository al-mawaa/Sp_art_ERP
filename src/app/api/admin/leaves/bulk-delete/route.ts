import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Leave from "@/lib/models/Leave";
import SeniorTeacherLeave from "@/lib/models/SeniorTeacherLeave";
import AuditLog from "@/lib/models/AuditLog";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    let body: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text.trim()) body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const items = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Missing or empty items array" }, { status: 400 });
    }

    const validItems = items.filter(
      (item: Record<string, unknown>) => item && typeof item.id === "string" && mongoose.Types.ObjectId.isValid(item.id) && typeof item.staffType === "string"
    );

    if (validItems.length === 0) {
      return NextResponse.json({ success: false, error: "No valid items provided" }, { status: 400 });
    }

    await dbConnect();

    const teacherIds = validItems.filter(i => i.staffType === "teacher").map(i => i.id);
    const seniorIds = validItems.filter(i => i.staffType === "senior_teacher").map(i => i.id);

    // Fetch documents to log them
    const teacherDocs = teacherIds.length > 0 ? await Leave.find({ _id: { $in: teacherIds } }) : [];
    const seniorDocs = seniorIds.length > 0 ? await SeniorTeacherLeave.find({ _id: { $in: seniorIds } }) : [];

    const auditLogs = [
      ...teacherDocs.map(doc => ({
        action: "DELETE_LEAVE",
        entityId: doc._id.toString(),
        entityType: "Leave",
        details: JSON.stringify(doc.toJSON()),
        performedBy: auth.adminEmail,
      })),
      ...seniorDocs.map(doc => ({
        action: "DELETE_LEAVE",
        entityId: doc._id.toString(),
        entityType: "SeniorTeacherLeave",
        details: JSON.stringify(doc.toJSON()),
        performedBy: auth.adminEmail,
      }))
    ];

    if (auditLogs.length > 0) {
      await AuditLog.insertMany(auditLogs);
    }

    // Delete documents
    if (teacherIds.length > 0) {
      await Leave.deleteMany({ _id: { $in: teacherIds } });
    }
    if (seniorIds.length > 0) {
      await SeniorTeacherLeave.deleteMany({ _id: { $in: seniorIds } });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${teacherDocs.length + seniorDocs.length} leave requests successfully` 
    });
  } catch (error) {
    console.error("[bulk-delete leaves POST]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

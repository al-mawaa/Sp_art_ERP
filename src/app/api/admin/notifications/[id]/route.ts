import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import NotificationModel from "@/lib/models/Notification";
import NotificationRecipientModel from "@/lib/models/NotificationRecipient";

// GET /api/admin/notifications/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const notification = await NotificationModel.findById(id).lean();
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Also fetch aggregate analytics for this notification
    const totalRecipients = await NotificationRecipientModel.countDocuments({ notificationId: id });
    const readRecipients = await NotificationRecipientModel.countDocuments({ notificationId: id, read: true });

    return NextResponse.json({
      notification,
      analytics: {
        totalRecipients,
        readRecipients,
        unreadRecipients: totalRecipients - readRecipients,
        readPercentage: totalRecipients > 0 ? (readRecipients / totalRecipients) * 100 : 0,
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error" }, { status: 500 });
  }
}

// PUT /api/admin/notifications/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const data = await req.json();
    
    // Primarily used to update drafts or pin status
    const notification = await NotificationModel.findByIdAndUpdate(id, data, { new: true });
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error" }, { status: 500 });
  }
}

// DELETE /api/admin/notifications/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const notification = await NotificationModel.findByIdAndDelete(id);
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Delete associated recipients
    await NotificationRecipientModel.deleteMany({ notificationId: id });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error" }, { status: 500 });
  }
}

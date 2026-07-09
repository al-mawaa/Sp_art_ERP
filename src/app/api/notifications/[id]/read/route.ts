import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import NotificationRecipientModel from "@/lib/models/NotificationRecipient";
import { getUserIdFromRequest } from "@/lib/auth/getUserId";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipient = await NotificationRecipientModel.findOneAndUpdate(
      { notificationId: id, userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!recipient) {
      return NextResponse.json({ error: "Notification not found for this user" }, { status: 404 });
    }

    return NextResponse.json({ success: true, recipient });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error" }, { status: 500 });
  }
}

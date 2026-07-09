import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import NotificationModel from "@/lib/models/Notification";
import NotificationRecipientModel from "@/lib/models/NotificationRecipient";

// POST /api/admin/notifications/bulk
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { action, ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No notification IDs provided" }, { status: 400 });
    }

    if (action === "delete") {
      await NotificationModel.deleteMany({ _id: { $in: ids } });
      await NotificationRecipientModel.deleteMany({ notificationId: { $in: ids } });
      return NextResponse.json({ success: true, message: "Deleted successfully" });
    }

    // Additional actions like archive could be implemented here

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import NotificationRecipientModel from "@/lib/models/NotificationRecipient";
import NotificationModel from "@/lib/models/Notification";
import { getUserIdFromRequest } from "@/lib/auth/getUserId";



export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const filter = searchParams.get("filter") || "all";

    const query: Record<string, unknown> = { userId };
    if (filter === "unread") {
      query.read = false;
    } else if (filter === "archived") {
      query.archived = true;
    } else {
      query.archived = false;
    }

    // Explicitly import NotificationModel so mongoose knows about it for population
    const dummy = NotificationModel;

    const recipients = await NotificationRecipientModel.find(query)
      .populate('notificationId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await NotificationRecipientModel.countDocuments(query);
    const unreadCount = await NotificationRecipientModel.countDocuments({ userId, read: false, archived: false });

    return NextResponse.json({
      notifications: recipients,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error" }, { status: 500 });
  }
}

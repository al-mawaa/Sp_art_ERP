import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import NotificationModel from "@/lib/models/Notification";
import { sendNotification } from "@/lib/services/notificationService";

// GET /api/admin/notifications
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (searchParams.get("type")) query.type = searchParams.get("type");
    if (searchParams.get("priority")) query.priority = searchParams.get("priority");
    if (searchParams.get("status")) query.status = searchParams.get("status");

    const notifications = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await NotificationModel.countDocuments(query);

    return NextResponse.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    console.error("GET Notifications Error:", error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

// POST /api/admin/notifications
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();

    if (data.status === "Draft") {
      // Just save draft
      const draft = new NotificationModel(data);
      await draft.save();
      return NextResponse.json({ success: true, notification: draft }, { status: 201 });
    }

    // Otherwise, trigger send and fan-out
    const notification = await sendNotification(data);
    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST Notification Error:", error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

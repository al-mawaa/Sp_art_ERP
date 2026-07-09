import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import NotificationModel from "@/lib/models/Notification";

// PATCH /api/notifications/:id/read - Mark a notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    const notification = await NotificationModel.findByIdAndUpdate(
      params.id,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

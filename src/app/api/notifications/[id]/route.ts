import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import NotificationModel from "@/lib/models/Notification";

// DELETE /api/notifications/:id - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    const notification = await NotificationModel.findByIdAndDelete(params.id);

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

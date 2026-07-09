import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import NotificationModel from "@/lib/models/Notification";

// PATCH /api/notifications/read-all - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role"); // admin, student, teacher
    const userId = searchParams.get("userId");

    await mongoose.connect(process.env.MONGODB_URI!);

    const query: any = { isRead: false };
    
    // Role-based filtering
    if (role) {
      query.recipientRole = role;
    }
    
    // User-specific filtering for student/teacher notifications
    if (userId && role !== "admin") {
      query.recipientId = new mongoose.Types.ObjectId(userId);
    }

    const result = await NotificationModel.updateMany(
      query,
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return NextResponse.json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}

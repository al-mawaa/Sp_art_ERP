import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import NotificationModel from "@/lib/models/Notification";

// GET /api/notifications/unread-count - Get unread notification count
export async function GET(request: NextRequest) {
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

    const count = await NotificationModel.countDocuments(query);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import NotificationModel, { NotificationDocument } from "@/lib/models/Notification";

// GET /api/notifications - Get notifications with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const filter = searchParams.get("filter") || "all"; // all, unread, read
    const type = searchParams.get("type");
    const role = searchParams.get("role"); // admin, student, teacher
    const userId = searchParams.get("userId");

    await mongoose.connect(process.env.MONGODB_URI!);

    const query: any = {};
    
    // Role-based filtering - critical for separating admin/student notifications
    if (role) {
      query.recipientRole = role;
    }
    
    // User-specific filtering for student/teacher notifications
    if (userId && role !== "admin") {
      query.recipientId = new mongoose.Types.ObjectId(userId);
    }
    
    if (filter === "unread") {
      query.isRead = false;
    } else if (filter === "read") {
      query.isRead = true;
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments(query),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      message,
      type = "general",
      priority = "medium",
      redirectUrl,
      referenceId,
      referenceModel,
      recipientRole,
      recipientId,
      createdBy,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const notification = await NotificationModel.create({
      title,
      message,
      type,
      priority,
      redirectUrl,
      referenceId,
      referenceModel,
      recipientRole,
      recipientId,
      createdBy,
      isRead: false,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import NotificationRecipientModel from "@/lib/models/NotificationRecipient";
import { getUserIdFromRequest } from "@/lib/auth/getUserId";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await NotificationRecipientModel.updateMany(
      { userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error" }, { status: 500 });
  }
}

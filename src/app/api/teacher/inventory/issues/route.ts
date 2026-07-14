import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryIssue from "@/lib/models/InventoryIssue";
import InventoryItem from "@/lib/models/InventoryItem";
import { requireTeacherFromRequest } from "@/lib/auth/require-teacher";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const issues = await InventoryIssue.find({
      receiverId: new mongoose.Types.ObjectId(auth.teacher.id),
      receiverType: "Teacher",
    })
      .populate({ path: "items.itemId", model: InventoryItem, select: "itemName itemCode unit image" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, issues });
  } catch (error: any) {
    console.error("Error fetching inventory issues for teacher:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch issues" }, { status: 500 });
  }
}

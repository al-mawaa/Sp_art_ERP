import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryIssue from "@/lib/models/InventoryIssue";
import InventoryItem from "@/lib/models/InventoryItem";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const issues = await InventoryIssue.find({
      receiverId: new mongoose.Types.ObjectId(auth.student.id),
      receiverType: "Student",
    })
      .populate({ path: "items.itemId", model: InventoryItem, select: "itemName itemCode unit image" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, issues });
  } catch (error: any) {
    console.error("Error fetching inventory issues for student:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch issues" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryItem from "@/lib/models/InventoryItem";
import { requireStudentFromRequest } from "@/lib/auth/require-student";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    // Only return active items that have stock available to request
    const items = await InventoryItem.find({
      status: "Active",
      currentStock: { $gt: 0 },
    })
      .select("itemName itemCode unit currentStock image")
      .sort({ itemName: 1 })
      .lean();

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Error fetching inventory items for student:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryMovement from "@/lib/models/InventoryMovement";
import InventoryItem from "@/lib/models/InventoryItem";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";


export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const movements = await InventoryMovement.find()
      .populate({ path: "itemId", model: InventoryItem, select: "itemName itemCode" })
      .sort({ createdAt: -1 })
      .limit(100) // Limit to recent 100 for performance
      .lean();
      
    return NextResponse.json({ success: true, movements });
  } catch (error: any) {
    console.error("Error fetching movements:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch movements" }, { status: 500 });
  }
}

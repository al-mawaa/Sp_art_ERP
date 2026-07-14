import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryItem from "@/lib/models/InventoryItem";
import InventoryCategory from "@/lib/models/InventoryCategory";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const items = await InventoryItem.find()
      .populate({ path: "categoryId", model: InventoryCategory, select: "name" })
      .sort({ itemName: 1 })
      .lean();
      
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Error fetching items:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const body = await request.json();
    
    // Auto-generate Item Code if not provided
    if (!body.itemCode) {
      const count = await InventoryItem.countDocuments();
      body.itemCode = `ITM-${(count + 1).toString().padStart(4, "0")}`;
    }

    const item = await InventoryItem.create(body);

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("Error creating item:", error);
    if (error.code === 11000) {
       return NextResponse.json({ success: false, error: "Item Code must be unique" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to create item" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryRequest from "@/lib/models/InventoryRequest";
import InventoryItem from "@/lib/models/InventoryItem";
import { requireTeacherFromRequest } from "@/lib/auth/require-teacher";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const requests = await InventoryRequest.find({
      requesterId: new mongoose.Types.ObjectId(auth.teacher.id),
      requesterType: "Teacher",
    })
      .populate({ path: "items.itemId", model: InventoryItem, select: "itemName itemCode unit image" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("Error fetching inventory requests for teacher:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { items, purpose } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Items are required" }, { status: 400 });
    }

    if (!purpose) {
      return NextResponse.json({ success: false, error: "Purpose is required" }, { status: 400 });
    }

    await dbConnect();

    // Verify all items exist and have stock
    for (const reqItem of items) {
      const item = await InventoryItem.findById(reqItem.itemId);
      if (!item) {
        return NextResponse.json({ success: false, error: `Item not found: ${reqItem.itemId}` }, { status: 404 });
      }
      if (item.currentStock < reqItem.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${item.itemName}. Available: ${item.currentStock}` },
          { status: 400 }
        );
      }
    }

    const newRequest = await InventoryRequest.create({
      requesterType: "Teacher",
      requesterId: new mongoose.Types.ObjectId(auth.teacher.id),
      items: items.map((i: any) => ({
        itemId: new mongoose.Types.ObjectId(i.itemId),
        quantity: Number(i.quantity),
      })),
      purpose,
      status: "Requested",
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error: any) {
    console.error("Error creating inventory request for teacher:", error);
    return NextResponse.json({ success: false, error: "Failed to create request" }, { status: 500 });
  }
}

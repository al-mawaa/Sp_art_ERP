import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryReturn from "@/lib/models/InventoryReturn";
import InventoryIssue from "@/lib/models/InventoryIssue";
import InventoryItem from "@/lib/models/InventoryItem";
import InventoryMovement from "@/lib/models/InventoryMovement";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const returns = await InventoryReturn.find()
      .populate({ path: "issueId", model: InventoryIssue, select: "issueNumber" })
      .populate({ path: "items.itemId", model: InventoryItem, select: "itemName itemCode unit" })
      .sort({ returnDate: -1 })
      .lean();
      
    return NextResponse.json({ success: true, returns });
  } catch (error: any) {
    console.error("Error fetching returns:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const body = await request.json();
    
    const { issueId, items } = body;
    
    if (!issueId || !items || !items.length) {
      return NextResponse.json({ success: false, error: "Issue ID and items are required" }, { status: 400 });
    }

    const issue = await InventoryIssue.findById(issueId);
    if (!issue) return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });

    const SYSTEM_ADMIN_ID = new mongoose.Types.ObjectId("000000000000000000000000");

    const ret = await InventoryReturn.create({
      ...body,
      receiverType: issue.receiverType,
      receiverId: issue.receiverId,
      processedByAdminId: SYSTEM_ADMIN_ID,
    });

    // Update stock and movement
    for (const item of items) {
      const invItem = await InventoryItem.findById(item.itemId);
      if (invItem) {
        const previousStock = invItem.currentStock;
        
        // Decrease issued stock
        invItem.issuedStock = Math.max(0, invItem.issuedStock - item.quantity);
        
        if (item.condition === "Damaged") {
          invItem.damagedStock += item.quantity;
        } else if (item.condition === "Lost") {
          invItem.lostStock += item.quantity;
        } else {
          invItem.currentStock += item.quantity;
        }
        
        invItem.returnedStock += item.quantity;
        await invItem.save();

        let movementType: "Return" | "Damage" = "Return";
        if (item.condition === "Damaged" || item.condition === "Lost") movementType = "Damage";

        await InventoryMovement.create({
          itemId: item.itemId,
          type: movementType,
          referenceId: ret._id,
          quantity: item.condition === "Excellent" || item.condition === "Good" ? item.quantity : 0, // Current stock change
          previousStock,
          newStock: invItem.currentStock,
          createdByAdminId: SYSTEM_ADMIN_ID,
          remarks: `Condition: ${item.condition}`
        });
      }
    }

    // Update Issue status
    issue.status = "Returned";
    await issue.save();

    return NextResponse.json({ success: true, return: ret });
  } catch (error: any) {
    console.error("Error creating return:", error);
    return NextResponse.json({ success: false, error: "Failed to create return" }, { status: 500 });
  }
}

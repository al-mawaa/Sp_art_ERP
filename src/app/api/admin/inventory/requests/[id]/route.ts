import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryRequest from "@/lib/models/InventoryRequest";
import InventoryIssue from "@/lib/models/InventoryIssue";
import InventoryItem from "@/lib/models/InventoryItem";
import InventoryMovement from "@/lib/models/InventoryMovement";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const body = await request.json();
    const { status, remarks } = body;

    if (!["Pending", "Approved", "Rejected", "Issued", "Returned"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const inventoryRequest = await InventoryRequest.findById(params.id);
    if (!inventoryRequest) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    if (inventoryRequest.status === "Issued" || inventoryRequest.status === "Returned") {
      return NextResponse.json({ success: false, error: "Cannot modify a request that has already been issued" }, { status: 400 });
    }

    const SYSTEM_ADMIN_ID = new mongoose.Types.ObjectId("000000000000000000000000");

    // If the admin is issuing the items, we need to handle the stock deduction and create an InventoryIssue
    if (status === "Issued") {
      // 1. Verify stock availability
      for (const item of inventoryRequest.items) {
        const invItem = await InventoryItem.findById(item.itemId);
        if (!invItem) return NextResponse.json({ success: false, error: `Item not found` }, { status: 404 });
        if (invItem.currentStock < item.quantity) {
          return NextResponse.json({ success: false, error: `Insufficient stock for ${invItem.itemName}` }, { status: 400 });
        }
      }

      // 2. Generate Issue Number
      const count = await InventoryIssue.countDocuments();
      const issueNumber = `ISS-${(count + 1).toString().padStart(5, "0")}`;

      // 3. Create InventoryIssue
      const issue = await InventoryIssue.create({
        issueNumber,
        receiverType: inventoryRequest.requesterType,
        receiverId: inventoryRequest.requesterId,
        items: inventoryRequest.items.map((i: any) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          condition: "New", // Default for requested items
        })),
        purpose: inventoryRequest.purpose,
        remarks: remarks || "Issued from request",
        status: "Issued",
        issuedByAdminId: SYSTEM_ADMIN_ID,
      });

      // 4. Update stock and create movements
      for (const item of inventoryRequest.items) {
        const invItem = await InventoryItem.findById(item.itemId);
        if (invItem) {
          const previousStock = invItem.currentStock;
          invItem.currentStock -= item.quantity;
          invItem.issuedStock += item.quantity;
          await invItem.save();

          await InventoryMovement.create({
            itemId: item.itemId,
            type: "Issue",
            referenceId: issue._id,
            quantity: -item.quantity,
            previousStock,
            newStock: invItem.currentStock,
            createdByAdminId: SYSTEM_ADMIN_ID,
            remarks: `Issued to ${inventoryRequest.requesterType} (Request ID: ${inventoryRequest._id})`
          });
        }
      }

      inventoryRequest.issueId = issue._id;
    }

    // Update request fields
    inventoryRequest.status = status;
    if (remarks) inventoryRequest.remarks = remarks;
    inventoryRequest.approvedByAdminId = SYSTEM_ADMIN_ID;

    await inventoryRequest.save();

    return NextResponse.json({ success: true, request: inventoryRequest });
  } catch (error: any) {
    console.error("Error updating request:", error);
    return NextResponse.json({ success: false, error: "Failed to update request" }, { status: 500 });
  }
}

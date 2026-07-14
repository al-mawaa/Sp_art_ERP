import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PurchaseOrder from "@/lib/models/PurchaseOrder";
import InventoryItem from "@/lib/models/InventoryItem";
import InventoryMovement from "@/lib/models/InventoryMovement";
import Vendor from "@/lib/models/Vendor";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const purchases = await PurchaseOrder.find()
      .populate({ path: "vendorId", model: Vendor, select: "name contactPerson" })
      .populate({ path: "items.itemId", model: InventoryItem, select: "itemName itemCode unit" })
      .sort({ purchaseDate: -1 })
      .lean();
      
    return NextResponse.json({ success: true, purchases });
  } catch (error: any) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const body = await request.json();
    
    const { vendorId, items, status } = body;
    
    if (!vendorId || !items || !items.length) {
      return NextResponse.json({ success: false, error: "Vendor and items are required" }, { status: 400 });
    }

    // Calculate totals
    let subTotal = 0;
    let totalGst = 0;
    let totalDiscount = 0;
    
    items.forEach((item: any) => {
      subTotal += item.quantity * item.unitPrice;
      totalGst += (item.quantity * item.unitPrice * (item.gstPercentage || 0)) / 100;
      totalDiscount += item.discount || 0;
    });

    const totalAmount = subTotal + totalGst - totalDiscount;

    const po = await PurchaseOrder.create({
      ...body,
      subTotal,
      totalGst,
      totalDiscount,
      totalAmount,
    });

    // If status is received immediately, update stock
    if (status === "Received") {
      const SYSTEM_ADMIN_ID = new mongoose.Types.ObjectId("000000000000000000000000");
      for (const item of items) {
        const invItem = await InventoryItem.findById(item.itemId);
        if (invItem) {
          const previousStock = invItem.currentStock;
          invItem.currentStock += item.quantity;
          await invItem.save();

          await InventoryMovement.create({
            itemId: item.itemId,
            type: "Purchase",
            referenceId: po._id,
            quantity: item.quantity,
            previousStock,
            newStock: invItem.currentStock,
            createdByAdminId: SYSTEM_ADMIN_ID,
            remarks: `PO ${po.invoiceNumber || po._id}`
          });
        }
      }
    }

    return NextResponse.json({ success: true, purchaseOrder: po });
  } catch (error: any) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ success: false, error: "Failed to create purchase order" }, { status: 500 });
  }
}

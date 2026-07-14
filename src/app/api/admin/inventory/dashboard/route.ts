import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryItem from "@/lib/models/InventoryItem";
import InventoryCategory from "@/lib/models/InventoryCategory";
import InventoryIssue from "@/lib/models/InventoryIssue";
import InventoryReturn from "@/lib/models/InventoryReturn";
import PurchaseOrder from "@/lib/models/PurchaseOrder";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      items,
      categoriesCount,
      todayIssues,
      todayReturns,
      pendingPOs,
    ] = await Promise.all([
      InventoryItem.find().lean(),
      InventoryCategory.countDocuments(),
      InventoryIssue.find({ issueDate: { $gte: today } }).lean(),
      InventoryReturn.find({ returnDate: { $gte: today } }).lean(),
      PurchaseOrder.find({ status: { $in: ["Pending", "Ordered"] } }).countDocuments()
    ]);

    const totalItems = items.reduce((sum, item) => sum + (item.currentStock || 0), 0);
    const lowStockItems = items.filter(item => (item.currentStock || 0) <= (item.lowStockThreshold || 10) && (item.currentStock || 0) > 0).length;
    const outOfStockItems = items.filter(item => (item.currentStock || 0) === 0).length;

    // Estimate total stock value (requires a pricing logic, usually avg cost. We will assume 0 for now as item cost isn't explicitly in schema yet, or we can use last purchase price)
    // To keep it simple, we just pass the count metrics
    
    let todayIssuedCount = 0;
    todayIssues.forEach((issue: any) => {
      issue.items.forEach((i: any) => { todayIssuedCount += i.quantity; });
    });

    let todayReturnedCount = 0;
    todayReturns.forEach((ret: any) => {
      ret.items.forEach((i: any) => { todayReturnedCount += i.quantity; });
    });

    const metrics = {
      totalItems,
      categoriesCount,
      lowStockItems,
      outOfStockItems,
      todayIssuedCount,
      todayReturnedCount,
      pendingPOs
    };

    return NextResponse.json({ success: true, metrics, items });
  } catch (error: any) {
    console.error("Error fetching inventory dashboard:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}

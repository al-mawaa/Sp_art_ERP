import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryIssue from "@/lib/models/InventoryIssue";
import InventoryItem from "@/lib/models/InventoryItem";
import InventoryMovement from "@/lib/models/InventoryMovement";
import Student from "@/lib/models/Student";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const issues = await InventoryIssue.find()
      .populate({ path: "items.itemId", model: InventoryItem, select: "itemName itemCode unit" })
      .sort({ issueDate: -1 })
      .lean();
      
    // We must manually populate the receiver since it's dynamic
    const studentIds = issues.filter(i => i.receiverType === "Student").map(i => i.receiverId);
    const teacherIds = issues.filter(i => i.receiverType === "Teacher").map(i => i.receiverId);
    
    const [students, teachers] = await Promise.all([
      Student.find({ _id: { $in: studentIds } }).select("fullName").lean(),
      Teacher.find({ _id: { $in: teacherIds } }).select("fullName").lean(),
    ]);

    const studentMap = new Map(students.map(s => [s._id.toString(), s.fullName]));
    const teacherMap = new Map(teachers.map(t => [t._id.toString(), t.fullName]));

    const mappedIssues = issues.map((issue: any) => {
      let receiverName = "Unknown";
      if (issue.receiverType === "Student") receiverName = studentMap.get(issue.receiverId.toString()) || "Unknown Student";
      else if (issue.receiverType === "Teacher") receiverName = teacherMap.get(issue.receiverId.toString()) || "Unknown Teacher";

      return {
        ...issue,
        receiverName,
      };
    });

    return NextResponse.json({ success: true, issues: mappedIssues });
  } catch (error: any) {
    console.error("Error fetching issues:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const body = await request.json();
    
    const { receiverType, receiverId, items, purpose } = body;
    
    if (!receiverType || !receiverId || !items || !items.length) {
      return NextResponse.json({ success: false, error: "Receiver and items are required" }, { status: 400 });
    }

    // Generate Issue Number
    const count = await InventoryIssue.countDocuments();
    const issueNumber = `ISS-${(count + 1).toString().padStart(5, "0")}`;

    // Verify stock availability
    for (const item of items) {
      const invItem = await InventoryItem.findById(item.itemId);
      if (!invItem) return NextResponse.json({ success: false, error: `Item not found` }, { status: 404 });
      if (invItem.currentStock < item.quantity) {
        return NextResponse.json({ success: false, error: `Insufficient stock for ${invItem.itemName}` }, { status: 400 });
      }
    }

    const SYSTEM_ADMIN_ID = new mongoose.Types.ObjectId("000000000000000000000000");

    const issue = await InventoryIssue.create({
      ...body,
      issueNumber,
      issuedByAdminId: SYSTEM_ADMIN_ID,
      status: "Issued",
    });

    // Update stock and movement
    for (const item of items) {
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
          remarks: `Issued to ${receiverType}`
        });
      }
    }

    return NextResponse.json({ success: true, issue });
  } catch (error: any) {
    console.error("Error creating issue:", error);
    return NextResponse.json({ success: false, error: "Failed to create issue" }, { status: 500 });
  }
}

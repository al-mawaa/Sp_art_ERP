import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryCategory from "@/lib/models/InventoryCategory";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const categories = await InventoryCategory.find().sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const body = await request.json();
    const { name, description, parentId, isActive } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const category = await InventoryCategory.create({
      name,
      description,
      parentId: parentId || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
  }
}

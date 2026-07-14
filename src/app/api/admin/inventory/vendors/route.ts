import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Vendor from "@/lib/models/Vendor";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const vendors = await Vendor.find().sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, vendors });
  } catch (error: any) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Vendor name is required" }, { status: 400 });
    }

    const vendor = await Vendor.create(body);
    return NextResponse.json({ success: true, vendor });
  } catch (error: any) {
    console.error("Error creating vendor:", error);
    return NextResponse.json({ success: false, error: "Failed to create vendor" }, { status: 500 });
  }
}

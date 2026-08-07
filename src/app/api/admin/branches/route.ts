import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import Branch from "@/lib/models/Branch";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const branches = await Branch.find({}).sort({ name: 1 }).lean();

    return NextResponse.json({
      success: true,
      branches: branches.map(b => ({
        id: b._id.toString(),
        name: b.name,
        address: b.address || "",
        phone: b.phone || "",
        status: b.status,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    });
  } catch (error: unknown) {
    console.error("[admin/branches GET]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load branches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const body = await request.json();
    const { name, address, phone, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Branch name is required" }, { status: 400 });
    }

    const existingBranch = await Branch.findOne({ name: name.trim() });
    if (existingBranch) {
      return NextResponse.json({ success: false, error: "Branch with this name already exists" }, { status: 400 });
    }

    const newBranch = await Branch.create({
      name: name.trim(),
      address: address?.trim(),
      phone: phone?.trim(),
      status: status || "Active",
    });

    return NextResponse.json({
      success: true,
      branch: {
        id: newBranch._id.toString(),
        name: newBranch.name,
        address: newBranch.address || "",
        phone: newBranch.phone || "",
        status: newBranch.status,
      },
    });
  } catch (error: unknown) {
    console.error("[admin/branches POST]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create branch" },
      { status: 500 }
    );
  }
}

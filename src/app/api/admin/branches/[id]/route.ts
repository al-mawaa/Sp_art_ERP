import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import Branch from "@/lib/models/Branch";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    await dbConnect();

    const branch = await Branch.findById(id).lean();
    if (!branch) {
      return NextResponse.json({ success: false, error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      branch: {
        id: branch._id.toString(),
        name: branch.name,
        address: branch.address || "",
        phone: branch.phone || "",
        status: branch.status,
      },
    });
  } catch (error: unknown) {
    console.error("[admin/branches/[id] GET]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load branch" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    await dbConnect();

    const body = await request.json();
    const { name, address, phone, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Branch name is required" }, { status: 400 });
    }

    const existingBranch = await Branch.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingBranch) {
      return NextResponse.json({ success: false, error: "Another branch with this name already exists" }, { status: 400 });
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        address: address?.trim(),
        phone: phone?.trim(),
        status: status || "Active",
      },
      { new: true }
    );

    if (!updatedBranch) {
      return NextResponse.json({ success: false, error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      branch: {
        id: updatedBranch._id.toString(),
        name: updatedBranch.name,
        address: updatedBranch.address || "",
        phone: updatedBranch.phone || "",
        status: updatedBranch.status,
      },
    });
  } catch (error: unknown) {
    console.error("[admin/branches/[id] PUT]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update branch" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    await dbConnect();

    const deletedBranch = await Branch.findByIdAndDelete(id);
    if (!deletedBranch) {
      return NextResponse.json({ success: false, error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error: unknown) {
    console.error("[admin/branches/[id] DELETE]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete branch" },
      { status: 500 }
    );
  }
}

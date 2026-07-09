import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import NotificationTemplateModel from "@/lib/models/NotificationTemplate";

// GET /api/admin/notifications/templates
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const templates = await NotificationTemplateModel.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ templates });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error" }, { status: 500 });
  }
}

// POST /api/admin/notifications/templates
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    const template = new NotificationTemplateModel(data);
    await template.save();

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error" }, { status: 500 });
  }
}

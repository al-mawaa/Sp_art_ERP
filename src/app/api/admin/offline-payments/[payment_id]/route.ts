import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import dbConnect from "@/lib/mongodb";
import OfflinePayment from "@/lib/models/OfflinePayment";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ payment_id: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const params = await context.params;
    const paymentId = params.payment_id;

    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
    }

    await dbConnect();
    const payment = await OfflinePayment.findById(paymentId);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await OfflinePayment.findByIdAndDelete(paymentId);

    return NextResponse.json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Delete payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete payment" },
      { status: 500 }
    );
  }
}

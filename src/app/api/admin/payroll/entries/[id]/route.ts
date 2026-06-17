import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import { updatePayrollStatusForEntry } from "@/lib/payroll/payrollService";

export const runtime = "nodejs";

const patchSchema = z.object({
  payrollStatus: z.enum(["Pending", "Generated", "Approved", "Paid"]).optional(),
  action: z.enum(["approve", "paid"]).optional(),
}).refine(data => data.payrollStatus || data.action, {
  message: "Provide payrollStatus or action",
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map(e => e.message).join("; "), 422);
    }

    const { id } = await context.params;

    await dbConnect();
    const payrollStatus =
      parsed.data.payrollStatus ??
      (parsed.data.action === "approve" ? "Approved" : "Paid");
    const data = await updatePayrollStatusForEntry(id, payrollStatus);
    return apiSuccess(data, { message: "Payroll entry updated" });
  } catch (error) {
    console.error("[admin/payroll/entries/[id] PATCH]", error);
    return apiError("Failed to update payroll entry", 500);
  }
}

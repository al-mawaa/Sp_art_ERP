import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import {
  generatePayrollForMonth,
  generatePayrollForProfiles,
  getPayrollByMonth,
  updatePayrollRunStatus,
  updatePayrollStatusesForProfiles,
} from "@/lib/payroll/payrollService";

function payrollErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Failed to load payroll";
  const err = error as { message?: string; name?: string; code?: string | number };
  if (err.code === "ECONNREFUSED" || err.message?.includes("ECONNREFUSED")) {
    return "Cannot connect to MongoDB. Check MONGODB_URI and your network.";
  }
  if (err.message?.includes("querySrv") || err.message?.includes("ENOTFOUND")) {
    return "MongoDB DNS lookup failed. Verify MONGODB_URI in .env.";
  }
  if (err.message) return err.message;
  return "Failed to load payroll";
}

export const runtime = "nodejs";

const actionSchema = z.object({
  action: z.enum(["generate", "approve", "paid"]),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  profileId: z.string().optional(),
  profileIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const month = (searchParams.get("month") || "").trim();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return apiError("Invalid month. Use YYYY-MM", 422);
    }

    await dbConnect();
    const data = await getPayrollByMonth(month);
    return apiSuccess(data);
  } catch (error) {
    console.error("[admin/payroll GET]", error);
    return apiError(payrollErrorMessage(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map(e => e.message).join("; "), 422);
    }

    await dbConnect();
    const { action, month, profileId, profileIds } = parsed.data;
    const selectedProfileIds = profileIds?.length
      ? profileIds
      : profileId
        ? [profileId]
        : [];

    if (selectedProfileIds.length > 0) {
      if (action === "generate") {
        const data = await generatePayrollForProfiles(month, selectedProfileIds);
        return apiSuccess(data, { message: "Payroll generated for selected staff" });
      }

      const status = action === "approve" ? "Approved" : "Paid";
      const data = await updatePayrollStatusesForProfiles(month, selectedProfileIds, status);
      return apiSuccess(data, {
        message: action === "approve" ? "Payroll approved for selected staff" : "Payroll marked paid for selected staff",
      });
    }

    if (action === "generate") {
      const data = await generatePayrollForMonth(month);
      return apiSuccess(data, { message: "Payroll generated successfully" });
    }

    if (action === "approve") {
      await updatePayrollRunStatus(month, "Approved");
      const data = await getPayrollByMonth(month);
      return apiSuccess(data, { message: "Payroll approved successfully" });
    }

    await updatePayrollRunStatus(month, "Paid");
    const data = await getPayrollByMonth(month);
    return apiSuccess(data, { message: "Payroll marked as paid" });
  } catch (error) {
    console.error("[admin/payroll POST]", error);
    const message = error instanceof Error ? error.message : "Failed to process payroll action";
    return apiError(message, 500);
  }
}

import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import {
  deleteSalaryProfiles,
  getPayrollByMonth,
  listSalaryProfiles,
  syncSalaryProfilesFromStaff,
  updateSalaryProfile,
} from "@/lib/payroll/payrollService";

export const runtime = "nodejs";

const patchSchema = z.object({
  id: z.string().trim().min(1),
  monthlySalary: z.number().min(0),
  joiningDate: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

const deleteSchema = z.object({
  id: z.string().trim().min(1).optional(),
  ids: z.array(z.string().trim().min(1)).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
}).refine(data => Boolean(data.id) || (data.ids?.length ?? 0) > 0, {
  message: "Provide id or ids",
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const profiles = await listSalaryProfiles();
    return apiSuccess({ profiles });
  } catch (error) {
    console.error("[admin/payroll/salary-profiles GET]", error);
    return apiError("Failed to load salary profiles", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const profiles = await syncSalaryProfilesFromStaff();
    return apiSuccess({ profiles }, { message: "Staff synced to salary master" });
  } catch (error) {
    console.error("[admin/payroll/salary-profiles POST]", error);
    return apiError("Failed to sync salary profiles", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map(e => e.message).join("; "), 422);
    }

    await dbConnect();
    await updateSalaryProfile({
      id: parsed.data.id,
      monthlySalary: parsed.data.monthlySalary,
      joiningDate: parsed.data.joiningDate,
      status: parsed.data.status,
    });
    const profiles = await listSalaryProfiles();
    return apiSuccess({ profiles }, { message: "Salary profile updated" });
  } catch (error) {
    console.error("[admin/payroll/salary-profiles PATCH]", error);
    return apiError("Failed to update salary profile", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map(e => e.message).join("; "), 422);
    }

    const ids = parsed.data.ids?.length
      ? parsed.data.ids
      : parsed.data.id
        ? [parsed.data.id]
        : [];

    await dbConnect();
    const profiles = await deleteSalaryProfiles(ids);
    const payroll = parsed.data.month ? await getPayrollByMonth(parsed.data.month) : null;
    return apiSuccess(
      { profiles, payroll },
      { message: ids.length === 1 ? "Salary profile removed" : `${ids.length} salary profiles removed` },
    );
  } catch (error) {
    console.error("[admin/payroll/salary-profiles DELETE]", error);
    const message = error instanceof Error ? error.message : "Failed to delete salary profile";
    return apiError(message, 500);
  }
}

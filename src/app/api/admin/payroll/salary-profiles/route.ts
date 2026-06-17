import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import { listSalaryProfiles, updateSalaryProfile } from "@/lib/payroll/payrollService";

export const runtime = "nodejs";

const patchSchema = z.object({
  id: z.string().trim().min(1),
  monthlySalary: z.number().min(0),
  joiningDate: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
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

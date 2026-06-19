import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { generatePayrollForMonth } from "@/lib/payroll/payrollService";

export const runtime = "nodejs";

function previousMonthIso(now: Date) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = new Date(y, m - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(_request: NextRequest) {
  try {
    await dbConnect();
    const month = previousMonthIso(new Date());
    const data = await generatePayrollForMonth(month);
    return apiSuccess(data, {
      message: `Payroll generated automatically for ${month}`,
    });
  } catch (error) {
    console.error("[cron/payroll POST]", error);
    return apiError("Failed to generate month-end payroll", 500);
  }
}

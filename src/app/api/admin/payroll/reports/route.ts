import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import PayrollEntry from "@/lib/models/PayrollEntry";

export const runtime = "nodejs";

function toCsv(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map(row =>
      headers
        .map(h => {
          const raw = String(row[h] ?? "");
          const escaped = raw.replace(/"/g, "\"\"");
          return `"${escaped}"`;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const month = (searchParams.get("month") || "").trim();
    const format = (searchParams.get("format") || "").trim().toLowerCase();
    if (!/^\d{4}-\d{2}$/.test(month)) return apiError("Invalid month format", 422);

    const rows = await PayrollEntry.find({ month }).sort({ staffType: 1, staffName: 1 }).lean();

    const totalSalary = rows.reduce((a, r) => a + (r.monthlySalary ?? 0), 0);
    const totalDeduction = rows.reduce((a, r) => a + (r.deductionAmount ?? 0), 0);
    const totalNet = rows.reduce((a, r) => a + (r.netSalary ?? 0), 0);

    const reportRows = rows.map(r => ({
      month: r.month,
      staffName: r.staffName,
      role: r.staffType === "teacher" ? "Teacher" : "Senior Teacher",
      employeeId: r.employeeId,
      monthlySalary: r.monthlySalary,
      totalBatches: r.totalBatches,
      presentCount: r.presentCount,
      absentCount: r.absentCount,
      leaveCount: r.leaveCount,
      rejectedLeaveCount: r.rejectedLeaveCount,
      pendingLeaveCount: r.pendingLeaveCount,
      deductionAmount: r.deductionAmount,
      netSalary: r.netSalary,
      payrollStatus: r.payrollStatus,
    }));

    if (format === "excel") {
      const csv = toCsv(reportRows as Array<Record<string, string | number>>);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="payroll-report-${month}.csv"`,
        },
      });
    }

    return apiSuccess({
      month,
      summary: {
        totalStaff: rows.length,
        totalSalary,
        totalDeduction,
        totalNet,
      },
      rows: reportRows,
    });
  } catch (error) {
    console.error("[admin/payroll/reports GET]", error);
    return apiError("Failed to load payroll report", 500);
  }
}

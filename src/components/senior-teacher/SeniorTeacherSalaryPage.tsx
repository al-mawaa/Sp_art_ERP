"use client";

import { useEffect, useState } from "react";
import { Download, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";
import { toast } from "sonner";
import { downloadSalarySlipPdf } from "@/lib/payroll/salarySlipPdf";

type SalaryHistoryRow = {
  id: string;
  month: string;
  staffType: "teacher" | "senior_teacher";
  staffName: string;
  employeeId: string;
  monthlySalary: number;
  weekdayBatches: number;
  weekendBatches: number;
  totalBatches: number;
  salaryPerBatch: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  leaveCount: number;
  rejectedLeaveCount: number;
  pendingLeaveCount: number;
  deductionAmount: number;
  netSalary: number;
  payrollStatus: "Pending" | "Generated" | "Approved" | "Paid";
};

function money(value: number): string {
  return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function SeniorTeacherSalaryPage() {
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<SalaryHistoryRow | null>(null);
  const [history, setHistory] = useState<SalaryHistoryRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/senior-teacher/salary", { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load salary");
        setCurrent((json.data.current as SalaryHistoryRow | null) ?? null);
        setHistory((json.data.history as SalaryHistoryRow[]) ?? []);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="My Salary" subtitle="View current salary and payroll history" />

      {loading ? (
        <div className="card-soft p-8 text-sm text-muted-foreground">Loading salary details…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-soft p-4">
              <div className="text-xs text-muted-foreground">Current Month</div>
              <div className="text-lg font-bold">{current?.month ?? "—"}</div>
            </div>
            <div className="card-soft p-4">
              <div className="text-xs text-muted-foreground">Monthly Salary</div>
              <div className="text-lg font-bold">{current ? money(current.monthlySalary) : "—"}</div>
            </div>
            <div className="card-soft p-4">
              <div className="text-xs text-muted-foreground">Deduction</div>
              <div className="text-lg font-bold">{current ? money(current.deductionAmount) : "—"}</div>
            </div>
            <div className="card-soft p-4">
              <div className="text-xs text-muted-foreground">Net Salary</div>
              <div className="text-lg font-bold">{current ? money(current.netSalary) : "—"}</div>
              {current ? <div className="mt-1"><StatusPill status={current.payrollStatus} /></div> : null}
            </div>
          </div>

          <div className="card-soft p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <h3 className="font-display font-bold text-lg">Payroll History</h3>
            </div>
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground py-3">No payroll history available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 pr-2">Month</th>
                      <th className="py-2 pr-2">Salary</th>
                      <th className="py-2 pr-2">Deductions</th>
                      <th className="py-2 pr-2">Net</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 pr-2">Slip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(row => (
                      <tr key={row.id} className="border-b border-border/60">
                        <td className="py-2 pr-2">{row.month}</td>
                        <td className="py-2 pr-2">{money(row.monthlySalary)}</td>
                        <td className="py-2 pr-2">{money(row.deductionAmount)}</td>
                        <td className="py-2 pr-2 font-semibold">{money(row.netSalary)}</td>
                        <td className="py-2 pr-2"><StatusPill status={row.payrollStatus} /></td>
                        <td className="py-2 pr-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() =>
                              downloadSalarySlipPdf({
                                instituteName: "Little Brushes Art Academy",
                                ...row,
                              })
                            }
                          >
                            <Download className="w-3.5 h-3.5 mr-1" /> Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

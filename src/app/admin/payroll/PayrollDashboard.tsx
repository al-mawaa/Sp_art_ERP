"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusPill } from "@/components/shared/StatusPill";
import { StaffTypeBadge, type LeaveStaffType } from "@/components/leave/StaffTypeBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { downloadSalarySlipPdf } from "@/lib/payroll/salarySlipPdf";

type SalaryProfileRow = {
  id: string;
  staffType: "teacher" | "senior_teacher";
  staffId: string;
  staffName: string;
  employeeId: string;
  monthlySalary: number;
  joiningDate: string;
  status: "Active" | "Inactive";
};

type PayrollEntry = {
  id: string;
  month: string;
  staffType: "teacher" | "senior_teacher";
  staffId: string;
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
  remarks: string;
};

type PayrollResponse = {
  run: {
    id: string;
    month: string;
    payrollStatus: "Pending" | "Generated" | "Approved" | "Paid";
    summary: {
      totalStaff: number;
      totalMonthlySalary: number;
      totalDeductions: number;
      totalNetSalary: number;
    };
  } | null;
  entries: PayrollEntry[];
};

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function monthFromDateValue(value: string): string {
  const [y = "", m = ""] = value.split("-");
  if (!y || !m) return currentMonthValue();
  return `${y}-${m}`;
}

function money(value: number): string {
  return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function entryKey(staffType: string, staffId: string) {
  return `${staffType}:${staffId}`;
}

export function PayrollDashboard() {
  const [selectedDate, setSelectedDate] = useState(currentDateValue());
  const [month, setMonth] = useState(monthFromDateValue(currentDateValue()));
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<SalaryProfileRow[]>([]);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [run, setRun] = useState<PayrollResponse["run"]>(null);
  const [salaryDraft, setSalaryDraft] = useState<Record<string, string>>({});
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStaff, setFilterStaff] = useState<"All" | LeaveStaffType>("All");

  const entryByStaff = useMemo(() => {
    const map = new Map<string, PayrollEntry>();
    for (const entry of entries) {
      map.set(entryKey(entry.staffType, entry.staffId), entry);
    }
    return map;
  }, [entries]);

  const summary = useMemo(() => {
    if (run?.summary) return run.summary;
    return {
      totalStaff: entries.length,
      totalMonthlySalary: entries.reduce((a, e) => a + e.monthlySalary, 0),
      totalDeductions: entries.reduce((a, e) => a + e.deductionAmount, 0),
      totalNetSalary: entries.reduce((a, e) => a + e.netSalary, 0),
    };
  }, [entries, run]);

  const applyPayrollPayload = (payload: PayrollResponse) => {
    setRun(payload.run);
    setEntries(payload.entries ?? []);
  };

  const loadProfiles = useCallback(async () => {
    const res = await fetch("/api/admin/payroll/salary-profiles", { credentials: "include" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load salary profiles");
    setProfiles(json.data.profiles as SalaryProfileRow[]);
    setSalaryDraft(
      Object.fromEntries((json.data.profiles as SalaryProfileRow[]).map(p => [p.id, String(p.monthlySalary)])),
    );
  }, []);

  const loadPayroll = useCallback(async (signal?: AbortSignal) => {
    const res = await fetch(`/api/admin/payroll?month=${encodeURIComponent(month)}`, {
      credentials: "include",
      signal,
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 401) throw new Error("Session expired. Please log in again.");
      throw new Error(json.error || "Failed to load payroll");
    }
    applyPayrollPayload(json.data as PayrollResponse);
  }, [month]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      await Promise.all([loadProfiles(), loadPayroll(signal)]);
      setSelectedProfileIds([]);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadPayroll, loadProfiles]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const runAction = async (
    action: "generate" | "approve" | "paid",
    profileIds?: string[],
  ) => {
    const isBulk = !profileIds?.length;
    if (isBulk) setLoading(true);
    else setRowLoadingId(profileIds[0]);

    try {
      const res = await fetch("/api/admin/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          month,
          ...(profileIds?.length === 1 ? { profileId: profileIds[0] } : {}),
          ...(profileIds && profileIds.length > 1 ? { profileIds } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update payroll");
      toast.success(json.message || "Payroll updated");
      applyPayrollPayload(json.data as PayrollResponse);
      if (profileIds?.length) {
        setSelectedProfileIds(prev => prev.filter(id => !profileIds.includes(id)));
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
      setRowLoadingId(null);
    }
  };

  const updateProfileSalary = async (profileId: string) => {
    const raw = salaryDraft[profileId] ?? "0";
    const monthlySalary = Number(raw);
    if (Number.isNaN(monthlySalary) || monthlySalary < 0) {
      toast.error("Enter a valid salary amount");
      return;
    }
    try {
      const res = await fetch("/api/admin/payroll/salary-profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: profileId, monthlySalary }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update salary");
      toast.success(json.message || "Salary updated");
      setProfiles(json.data.profiles as SalaryProfileRow[]);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const toggleProfileSelection = (profileId: string, checked: boolean) => {
    setSelectedProfileIds(prev =>
      checked ? [...new Set([...prev, profileId])] : prev.filter(id => id !== profileId),
    );
  };

  const visibleProfiles = useMemo(() => {
    let filtered = profiles;
    if (filterStaff !== "All") {
      filtered = filtered.filter(p => p.staffType === filterStaff);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(p => {
        const entry = entryByStaff.get(entryKey(p.staffType, p.staffId));
        const staffTypeLabel = p.staffType === "teacher" ? "teacher" : "senior teacher sn. teacher";
        return (
          p.staffName.toLowerCase().includes(q) ||
          p.employeeId.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          staffTypeLabel.includes(q) ||
          (entry?.payrollStatus.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return filtered;
  }, [profiles, filterStaff, searchQuery, entryByStaff]);

  const applySearch = () => {
    setSearchQuery(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedProfileIds(checked ? visibleProfiles.map(p => p.id) : []);
  };

  const allSelected =
    visibleProfiles.length > 0 &&
    visibleProfiles.every(p => selectedProfileIds.includes(p.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR & Payroll"
        subtitle="Automated salary calculation for teachers and senior teachers"
      />

      <div className="card-soft p-4 flex flex-wrap gap-3 items-end">
        <div className="w-52">
          <Label className="text-xs text-muted-foreground">Payroll date</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={e => {
              setSelectedDate(e.target.value);
              setMonth(monthFromDateValue(e.target.value));
            }}
            className="rounded-xl mt-1"
          />
        </div>
        <Button
          className="rounded-xl gradient-primary text-white border-0"
          onClick={() => void runAction("generate")}
          disabled={loading}
        >
          Generate All
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={() => void runAction("approve")} disabled={loading}>
          Approve All
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={() => void runAction("paid")} disabled={loading}>
          Mark All Paid
        </Button>
        <Button variant="outline" className="rounded-xl ml-auto" onClick={() => void refresh()} disabled={loading}>
          <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-soft p-4"><div className="text-xs text-muted-foreground">Total Staff</div><div className="text-xl font-bold">{summary.totalStaff}</div></div>
        <div className="card-soft p-4"><div className="text-xs text-muted-foreground">Total Salary</div><div className="text-xl font-bold">{money(summary.totalMonthlySalary)}</div></div>
        <div className="card-soft p-4"><div className="text-xs text-muted-foreground">Total Deductions</div><div className="text-xl font-bold">{money(summary.totalDeductions)}</div></div>
        <div className="card-soft p-4">
          <div className="text-xs text-muted-foreground">Net Payout</div>
          <div className="text-xl font-bold">{money(summary.totalNetSalary)}</div>
          {run ? <div className="mt-2"><StatusPill status={run.payrollStatus} /></div> : null}
        </div>
      </div>

      <div className="card-soft p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display font-bold text-lg">Teacher Salary Master</h3>
          {selectedProfileIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{selectedProfileIds.length} selected</span>
              <Button
                size="sm"
                className="rounded-lg gradient-primary text-white border-0"
                disabled={loading}
                onClick={() => void runAction("generate", selectedProfileIds)}
              >
                Generate Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={loading}
                onClick={() => void runAction("approve", selectedProfileIds)}
              >
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={loading}
                onClick={() => void runAction("paid", selectedProfileIds)}
              >
                Mark Selected Paid
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 items-end border-b border-border pb-3">
          <div className="flex-1 min-w-[220px]">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="rounded-xl pl-9"
                  placeholder="Search by name, ID, role, status…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") applySearch();
                  }}
                />
              </div>
              <Button type="button" className="rounded-xl gradient-primary text-white border-0" onClick={applySearch}>
                <Search className="w-4 h-4 mr-1" />
                Search
              </Button>
              {searchQuery ? (
                <Button type="button" variant="outline" className="rounded-xl" onClick={clearSearch}>
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
          <div className="w-48">
            <Label className="text-xs text-muted-foreground">Staff type</Label>
            <Select
              value={filterStaff}
              onValueChange={v => setFilterStaff(v as "All" | LeaveStaffType)}
            >
              <SelectTrigger className="rounded-xl mt-1">
                <SelectValue placeholder="All staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All staff</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="senior_teacher">Sn. Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={checked => toggleSelectAll(checked === true)}
            aria-label="Select all visible staff"
          />
          <span className="text-xs text-muted-foreground">
            Select all{visibleProfiles.length !== profiles.length ? ` (${visibleProfiles.length} shown)` : ""}
          </span>
        </div>

        <div className="space-y-2">
          {visibleProfiles.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {searchQuery || filterStaff !== "All"
                ? "No staff match your search or filter."
                : "No salary profiles found."}
            </div>
          ) : null}
          {visibleProfiles.map(p => {
            const entry = entryByStaff.get(entryKey(p.staffType, p.staffId));
            const isRowLoading = rowLoadingId === p.id;
            const rowDisabled = loading || isRowLoading;

            return (
              <div key={p.id} className="border border-border/70 rounded-xl p-3 space-y-3">
                <div className="flex flex-wrap gap-3 items-start">
                  <Checkbox
                    checked={selectedProfileIds.includes(p.id)}
                    onCheckedChange={checked => toggleProfileSelection(p.id, checked === true)}
                    aria-label={`Select ${p.staffName}`}
                    className="mt-1"
                  />

                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{p.staffName}</div>
                      <StaffTypeBadge staffType={p.staffType} variant="short" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.employeeId}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      className="w-32 rounded-xl"
                      value={salaryDraft[p.id] ?? ""}
                      onChange={e => setSalaryDraft(prev => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <Button size="sm" className="rounded-lg" onClick={() => void updateProfileSalary(p.id)}>
                      Save Salary
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground ml-auto">{p.status}</div>
                </div>

                <div className="flex flex-wrap gap-4 items-center pl-7 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Deduction</span>
                    <div className="font-medium">{entry ? money(entry.deductionAmount) : "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Net</span>
                    <div className="font-semibold">{entry ? money(entry.netSalary) : "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Status</span>
                    <div className="mt-0.5">
                      {entry ? <StatusPill status={entry.payrollStatus} /> : <span className="text-xs text-muted-foreground">Not generated</span>}
                    </div>
                  </div>
                  {entry ? (
                    <div className="text-xs text-muted-foreground">
                      Batches {entry.totalBatches} · P {entry.presentCount} / A {entry.absentCount} / H {entry.halfDayCount}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 pl-7">
                  <Button
                    size="sm"
                    className="rounded-lg gradient-primary text-white border-0"
                    disabled={rowDisabled}
                    onClick={() => void runAction("generate", [p.id])}
                  >
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={rowDisabled || !entry}
                    onClick={() => void runAction("approve", [p.id])}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={rowDisabled || !entry}
                    onClick={() => void runAction("paid", [p.id])}
                  >
                    Mark Paid
                  </Button>
                  {entry ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() =>
                        downloadSalarySlipPdf({
                          instituteName: "Little Brushes Art Academy",
                          ...entry,
                        })
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Slip
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

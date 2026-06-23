"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Trophy,
  Loader2,
  Gift,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatInr } from "@/lib/enrollment/paymentCalculations";
import { cn } from "@/lib/utils";

type ClaimRow = {
  id: string;
  studentName: string;
  studentEmail: string;
  rewardTitle: string;
  rewardType: string;
  referralCount: number;
  claimStatus: string;
  address?: string;
  phoneNumber?: string;
  deliveryNotes?: string;
  createdAt: string;
};

type ReportData = {
  stats: {
    totalRewards: number;
    activeRewards: number;
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    shippedClaims: number;
    deliveredClaims: number;
    rejectedClaims: number;
  };
  claims: ClaimRow[];
  topReferrers: Array<{
    studentName: string;
    referralCode: string;
    totalReferrals: number;
    totalEarnings: number;
  }>;
};

const STATUS_COLORS: Record<string, string> = {
  claimed: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
};

export default function AdminReferralRewardsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionClaim, setActionClaim] = useState<ClaimRow | null>(null);
  const [actionStatus, setActionStatus] = useState<string>("approved");
  const [adminRemark, setAdminRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reward-claims", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredClaims =
    data?.claims.filter(c => statusFilter === "all" || c.claimStatus === statusFilter) ?? [];

  const openAction = (claim: ClaimRow, status: string) => {
    setActionClaim(claim);
    setActionStatus(status);
    setAdminRemark("");
  };

  const submitAction = async () => {
    if (!actionClaim) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/reward-claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          claimId: actionClaim.id,
          status: actionStatus,
          adminRemark: adminRemark || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      toast({ title: "Updated", description: `Claim marked as ${actionStatus}` });
      setActionClaim(null);
      load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Update failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referral Rewards"
        subtitle="Monitor reward claims, approve gifts, and track delivery"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending Claims", value: stats.pendingClaims, icon: Clock, color: "text-amber-600" },
          { label: "Approved", value: stats.approvedClaims, icon: CheckCircle2, color: "text-blue-600" },
          { label: "Shipped", value: stats.shippedClaims, icon: Truck, color: "text-indigo-600" },
          { label: "Delivered", value: stats.deliveredClaims, icon: Package, color: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{s.label}</p>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Gift className="h-5 w-5 text-violet-600" /> Reward Claims
            </h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 pr-3 font-medium">Student</th>
                  <th className="pb-3 pr-3 font-medium">Reward</th>
                  <th className="pb-3 pr-3 font-medium">Referrals</th>
                  <th className="pb-3 pr-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No claims found
                    </td>
                  </tr>
                )}
                {filteredClaims.map(c => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-900">{c.studentName}</p>
                      <p className="text-xs text-slate-500">{c.studentEmail}</p>
                    </td>
                    <td className="py-3 pr-3">{c.rewardTitle}</td>
                    <td className="py-3 pr-3">{c.referralCount}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                          STATUS_COLORS[c.claimStatus] ?? "bg-slate-100 text-slate-600",
                        )}
                      >
                        {c.claimStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.claimStatus === "claimed" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openAction(c, "approved")}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => openAction(c, "rejected")}>
                              Reject
                            </Button>
                          </>
                        )}
                        {c.claimStatus === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => openAction(c, "shipped")}>
                            Mark Shipped
                          </Button>
                        )}
                        {c.claimStatus === "shipped" && (
                          <Button size="sm" variant="outline" onClick={() => openAction(c, "delivered")}>
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-600" /> Top Referrers
          </h2>
          <div className="space-y-3">
            {data.topReferrers.map((r, i) => (
              <div key={r.referralCode} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="font-medium text-slate-900">
                    #{i + 1} {r.studentName}
                  </p>
                  <p className="text-xs font-mono text-violet-700">{r.referralCode}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-slate-900">{r.totalReferrals} refs</p>
                  <p className="text-emerald-700">{formatInr(r.totalEarnings)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={Boolean(actionClaim)} onOpenChange={() => setActionClaim(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">{actionStatus} Claim</DialogTitle>
          </DialogHeader>
          {actionClaim && (
            <div className="space-y-3 text-sm">
              <p>
                <strong>{actionClaim.studentName}</strong> — {actionClaim.rewardTitle}
              </p>
              {actionClaim.address && (
                <p className="text-slate-600">
                  <strong>Address:</strong> {actionClaim.address}
                </p>
              )}
              {actionClaim.phoneNumber && (
                <p className="text-slate-600">
                  <strong>Phone:</strong> {actionClaim.phoneNumber}
                </p>
              )}
              {actionStatus === "rejected" && (
                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <Input value={adminRemark} onChange={e => setAdminRemark(e.target.value)} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionClaim(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitAction} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

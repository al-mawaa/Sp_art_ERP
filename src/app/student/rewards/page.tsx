"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Gift,
  Loader2,
  Target,
  CheckCircle2,
  Lock,
  Truck,
  Package,
  Clock,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type RewardItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  rewardType: string;
  walletAmount: number;
  requiredReferrals: number;
  status: string;
  progress: number;
};

type DashboardData = {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  rewardsEarned: number;
  rewardsAvailable: number;
  rewardsUnlocked: number;
  nextReward: {
    title: string;
    requiredReferrals: number;
    currentReferrals: number;
    progress: number;
    remaining: number;
  } | null;
  catalog: RewardItem[];
};

const STATUS_STYLES: Record<string, string> = {
  locked: "bg-slate-100 text-slate-600",
  eligible: "bg-emerald-100 text-emerald-800",
  claimed: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-violet-100 text-violet-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        STATUS_STYLES[status] ?? STATUS_STYLES.locked,
      )}
    >
      {status}
    </span>
  );
}

function RewardIcon({ type }: { type: string }) {
  if (type === "wallet" || type === "cashback") return <Wallet className="h-8 w-8 text-emerald-600" />;
  if (type === "voucher") return <Gift className="h-8 w-8 text-violet-600" />;
  return <Package className="h-8 w-8 text-blue-600" />;
}

export default function StudentRewardsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimReward, setClaimReward] = useState<RewardItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/rewards", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load rewards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openClaim = (reward: RewardItem) => {
    setClaimReward(reward);
    setAddress("");
    setPhoneNumber("");
    setDeliveryNotes("");
    setClaimOpen(true);
  };

  const submitClaim = async () => {
    if (!claimReward) return;
    if (!address.trim() || !phoneNumber.trim()) {
      toast({ title: "Required fields", description: "Address and mobile number are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rewardId: claimReward.id,
          address,
          phoneNumber,
          deliveryNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Claim failed");
      toast({ title: "Claim submitted", description: "We will review your reward claim shortly." });
      setClaimOpen(false);
      load();
    } catch (err) {
      toast({
        title: "Claim failed",
        description: err instanceof Error ? err.message : "Unable to submit claim",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Rewards"
        subtitle="Earn gifts and cashback by referring new students to SP Art Hub"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Successful Referrals", value: data.successfulReferrals, icon: Target },
          { label: "Rewards Unlocked", value: data.rewardsUnlocked, icon: Trophy },
          { label: "Available to Claim", value: data.rewardsAvailable, icon: Gift },
          { label: "Rewards Earned", value: data.rewardsEarned, icon: CheckCircle2 },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{card.label}</p>
              <card.icon className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {data.nextReward && (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-violet-700 flex items-center gap-2">
                <Target className="h-4 w-4" /> Next Reward Target
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{data.nextReward.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {data.nextReward.currentReferrals} / {data.nextReward.requiredReferrals} referrals
                · {data.nextReward.remaining} more to unlock
              </p>
            </div>
            <div className="sm:w-48">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Progress</span>
                <span>{data.nextReward.progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/80 overflow-hidden border border-violet-200">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all"
                  style={{ width: `${data.nextReward.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Reward Catalog</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.catalog.map(reward => (
            <div
              key={reward.id}
              className={cn(
                "rounded-2xl border bg-white p-5 shadow-sm flex flex-col",
                reward.status === "eligible" ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200",
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                  {reward.image ? (
                    <img src={reward.image} alt="" className="h-10 w-10 object-contain" />
                  ) : (
                    <RewardIcon type={reward.rewardType} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{reward.title}</h3>
                    <StatusBadge status={reward.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{reward.category}</p>
                  {(reward.rewardType === "wallet" || reward.rewardType === "cashback") && reward.walletAmount > 0 && (
                    <p className="text-sm font-semibold text-emerald-700 mt-1">{formatInr(reward.walletAmount)}</p>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-600 mt-3 flex-1">{reward.description}</p>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Need {reward.requiredReferrals} referrals</span>
                  <span>{Math.min(data.successfulReferrals, reward.requiredReferrals)} / {reward.requiredReferrals}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      reward.status === "locked" ? "bg-slate-300" : "bg-gradient-to-r from-blue-500 to-indigo-600",
                    )}
                    style={{ width: `${reward.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4">
                {reward.status === "eligible" && (
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600" onClick={() => openClaim(reward)}>
                    Claim Reward
                  </Button>
                )}
                {reward.status === "locked" && (
                  <Button variant="outline" className="w-full" disabled>
                    <Lock className="mr-2 h-4 w-4" /> Locked
                  </Button>
                )}
                {reward.status === "claimed" && (
                  <p className="text-center text-xs text-amber-700 flex items-center justify-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Pending admin approval
                  </p>
                )}
                {reward.status === "approved" && (
                  <p className="text-center text-xs text-blue-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved — processing
                  </p>
                )}
                {reward.status === "shipped" && (
                  <p className="text-center text-xs text-indigo-700 flex items-center justify-center gap-1">
                    <Truck className="h-3.5 w-3.5" /> Shipped
                  </p>
                )}
                {reward.status === "delivered" && (
                  <p className="text-center text-xs text-violet-700 flex items-center justify-center gap-1">
                    <Package className="h-3.5 w-3.5" /> Delivered
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500 text-center">
        Share your referral code from{" "}
        <Link href="/student/referrals" className="text-blue-600 font-medium hover:underline">
          My Referrals
        </Link>{" "}
        to unlock more rewards.
      </p>

      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Claim Reward</DialogTitle>
          </DialogHeader>
          {claimReward && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{claimReward.title}</p>
                <p className="text-slate-500 mt-1">Referrals at claim: {data.successfulReferrals}</p>
              </div>
              <div className="space-y-2">
                <Label>Delivery Address *</Label>
                <Textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Full address with pincode"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <Input
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="10-digit mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Notes (optional)</Label>
                <Input
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="Landmark, preferred time, etc."
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClaimOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submitClaim} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

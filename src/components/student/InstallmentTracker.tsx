"use client";

import { cn } from "@/lib/utils";
import { Check, Clock, AlertTriangle } from "lucide-react";

interface InstallmentStep {
  termNo: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  paymentStatus: string;
}

interface InstallmentTrackerProps {
  installments: InstallmentStep[];
  className?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof Check; label: string }> = {
  paid: {
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    icon: Check,
    label: "Paid",
  },
  pending: {
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-300",
    icon: Clock,
    label: "Pending",
  },
  overdue: {
    color: "text-red-700",
    bg: "bg-red-100",
    border: "border-red-300",
    icon: AlertTriangle,
    label: "Overdue",
  },
  failed: {
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-300",
    icon: AlertTriangle,
    label: "Failed",
  },
};

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function InstallmentTracker({ installments, className }: InstallmentTrackerProps) {
  if (!installments || installments.length === 0) return null;

  return (
    <div className={cn("flex items-start gap-0", className)}>
      {installments.map((inst, idx) => {
        const key = (inst.paymentStatus ?? "pending").toLowerCase();
        const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.pending;
        const Icon = config.icon;
        const isLast = idx === installments.length - 1;

        return (
          <div key={inst.termNo} className="flex items-start flex-1 min-w-0">
            {/* Step node */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                  config.bg,
                  config.border,
                )}
              >
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="mt-1.5 text-center">
                <p className={cn("text-[10px] font-bold uppercase tracking-wide", config.color)}>
                  Term {inst.termNo}
                </p>
                <p className="text-[10px] font-semibold text-foreground">
                  {formatInr(inst.amount)}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {new Date(inst.dueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <span
                  className={cn(
                    "mt-0.5 inline-block rounded-full px-1.5 py-0 text-[9px] font-semibold border",
                    config.bg,
                    config.border,
                    config.color,
                  )}
                >
                  {config.label}
                </span>
              </div>
            </div>
            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 flex items-center pt-4">
                <div
                  className={cn(
                    "h-0.5 w-full",
                    key === "paid" ? "bg-emerald-300" : "bg-border",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface PaymentProgressBarProps {
  paid: number;
  total: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentProgressBar({
  paid,
  total,
  className,
  showLabel = true,
  size = "md",
}: PaymentProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const isComplete = pct >= 100;
  const isLow = pct < 30;

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {formatInr(paid)} / {formatInr(total)}
          </span>
          <span
            className={cn(
              "font-semibold",
              isComplete
                ? "text-emerald-600"
                : isLow
                  ? "text-red-600"
                  : "text-amber-600",
            )}
          >
            {pct}%
          </span>
        </div>
      )}
      <Progress
        value={pct}
        className={cn(
          size === "sm" ? "h-2" : "h-3",
          isComplete
            ? "[&>div]:bg-emerald-500"
            : isLow
              ? "[&>div]:bg-red-500"
              : "[&>div]:bg-amber-500",
        )}
      />
    </div>
  );
}

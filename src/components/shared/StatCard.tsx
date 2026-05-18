import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon: Icon, trend, tone = "primary",
}: {
  label: string; value: string | number; icon: LucideIcon;
  trend?: { value: string; up?: boolean };
  tone?: "primary" | "secondary" | "accent" | "success" | "info" | "warning" | "destructive";
}) {
  const toneMap = {
    primary: "bg-primary-soft text-primary",
    secondary: "bg-secondary-soft text-secondary",
    accent: "bg-accent-soft text-accent-foreground",
    success: "bg-success-soft text-success",
    info: "bg-info/15 text-info",
    warning: "bg-warning-soft text-warning",
    destructive: "bg-destructive-soft text-destructive",
  } as const;
  return (
    <div className="card-soft p-5 flex flex-col gap-4 transition-all hover:shadow-card">
      <div className="flex items-center justify-between">
        <div className={cn("rounded-md p-2", toneMap[tone])}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        {trend && (
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium tabular-nums", trend.up ? "text-success" : "text-destructive")}>
            {trend.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <div className="text-[26px] font-display font-semibold tracking-tight tabular-nums">{value}</div>
        <div className="text-[13px] text-muted-foreground font-medium mt-0.5">{label}</div>
      </div>
    </div>
  );
}

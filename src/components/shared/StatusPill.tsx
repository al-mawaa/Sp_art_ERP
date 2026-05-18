import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Active: "bg-success-soft text-success",
  Inactive: "bg-muted text-muted-foreground",
  Pending: "bg-accent-soft text-accent-foreground",
  Approved: "bg-success-soft text-success",
  Denied: "bg-destructive-soft text-destructive",
  Rejected: "bg-destructive-soft text-destructive",
  Paid: "bg-success-soft text-success",
  Overdue: "bg-destructive-soft text-destructive",
  "Low Stock": "bg-warning-soft text-warning",
  "In Stock": "bg-success-soft text-success",
  Success: "bg-success-soft text-success",
  Trial: "bg-info/15 text-info",
  Online: "bg-info/15 text-info",
  Cash: "bg-secondary-soft text-secondary",
  "Entry Allowed": "bg-success-soft text-success",
  "Pending Review": "bg-warning-soft text-warning",
  Scored: "bg-success-soft text-success",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", cls, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

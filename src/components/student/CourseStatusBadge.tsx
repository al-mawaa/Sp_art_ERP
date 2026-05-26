import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Completed: "bg-blue-100 text-blue-800 border-blue-200",
  Upcoming: "bg-amber-100 text-amber-900 border-amber-200",
  "Payment Pending": "bg-orange-100 text-orange-800 border-orange-200",
};

export function CourseStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STYLES[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}

import { cn } from "@/lib/utils";

export type LeaveStaffType = "teacher" | "senior_teacher";

const STYLES: Record<LeaveStaffType, { label: string; shortLabel: string; className: string }> = {
  teacher: {
    label: "Teacher",
    shortLabel: "Teacher",
    className: "bg-info/15 text-info border border-info/25",
  },
  senior_teacher: {
    label: "Senior Teacher",
    shortLabel: "Sn. Teacher",
    className: "bg-secondary-soft text-secondary border border-secondary/30",
  },
};

export function StaffTypeBadge({
  staffType,
  className,
  variant = "default",
}: {
  staffType: LeaveStaffType;
  className?: string;
  variant?: "default" | "short";
}) {
  const cfg = STYLES[staffType];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap",
        cfg.className,
        className,
      )}
    >
      {variant === "short" ? cfg.shortLabel : cfg.label}
    </span>
  );
}

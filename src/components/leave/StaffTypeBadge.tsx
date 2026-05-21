import { cn } from "@/lib/utils";

export type LeaveStaffType = "teacher" | "senior_teacher";

const STYLES: Record<LeaveStaffType, { label: string; className: string }> = {
  teacher: {
    label: "Teacher",
    className: "bg-info/15 text-info border border-info/25",
  },
  senior_teacher: {
    label: "Senior Teacher",
    className: "bg-secondary-soft text-secondary border border-secondary/30",
  },
};

export function StaffTypeBadge({
  staffType,
  className,
}: {
  staffType: LeaveStaffType;
  className?: string;
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
      {cfg.label}
    </span>
  );
}

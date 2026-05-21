/** Leave history status pill colors (Pending=yellow, Approved=green, Rejected=red) */
export function leaveStatusPillClass(status: string): string | undefined {
  if (status === "Pending") return "bg-warning-soft text-warning";
  if (status === "Approved") return "bg-success-soft text-success";
  if (status === "Rejected") return "bg-destructive-soft text-destructive";
  return undefined;
}

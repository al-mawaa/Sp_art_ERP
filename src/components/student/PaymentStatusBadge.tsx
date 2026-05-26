import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  partial: "bg-orange-100 text-orange-800 border-orange-200",
};

const LABELS: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  partial: "Partial Payment",
};

export function PaymentStatusBadge({ status }: { status: string | null }) {
  const key = (status || "pending").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        STYLES[key] ?? STYLES.pending,
      )}
    >
      {LABELS[key] ?? status ?? "Pending"}
    </span>
  );
}

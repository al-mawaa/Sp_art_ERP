import { getCategoryBadgeClass, getCategoryBadgeLabel } from "@/lib/queries/queryCategories";
import { cn } from "@/lib/utils";

export function QueryCategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        getCategoryBadgeClass(category),
        className,
      )}
    >
      {getCategoryBadgeLabel(category)}
    </span>
  );
}

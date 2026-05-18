import { Palette } from "lucide-react";

export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="grid place-items-center rounded-md bg-foreground text-background"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Palette className="w-1/2 h-1/2" strokeWidth={2.2} />
      </div>
      {withText && (
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold text-foreground tracking-tight">Little Brushes</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Art Academy</div>
        </div>
      )}
    </div>
  );
}

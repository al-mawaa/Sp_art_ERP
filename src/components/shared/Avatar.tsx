import { cn } from "@/lib/utils";

const palette = [
  "bg-primary/15 text-primary",
  "bg-secondary/15 text-secondary",
  "bg-success/15 text-success",
  "bg-info/15 text-info",
  "bg-accent/25 text-foreground",
];

export function Avatar({ name, size = 36, className, src }: { name: string; size?: number; className?: string; src?: string }) {
  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full shrink-0 ring-1 ring-border object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn("rounded-full grid place-items-center font-semibold shrink-0 ring-1 ring-border", palette[idx], className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

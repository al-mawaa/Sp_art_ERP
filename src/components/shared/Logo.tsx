export function Logo({ size = 32, withText = true, compact = false }: { size?: number; withText?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid place-items-center rounded-full bg-white p-1 shadow-lg"
        style={{ width: size * 1.5, height: size * 1.5 }}
      >
        <img
          src="/logoMain.png"
          alt="SP Art Hub Logo"
          style={{ width: size * 1.2, height: size * 1.2 }}
        />
      </div>
      {withText && (
        <div className="leading-tight">
          <div className={`font-display font-bold tracking-tight ${compact ? 'text-lg' : 'text-3xl'}`}>
            <span className="text-foreground">SP </span>
            <span className="text-red-600">Art</span>
            <span className="text-foreground"> Hub</span>
          </div>
          <div className={`uppercase tracking-widest text-muted-foreground font-medium mt-0.5 ${compact ? 'text-[10px]' : 'text-sm'}`}>
            ART • SKILL • SOUL
          </div>
        </div>
      )}
    </div>
  );
}

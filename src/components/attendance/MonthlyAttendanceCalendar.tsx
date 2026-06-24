"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type CalendarDayStatus = "Present" | "Absent" | "Half Day" | "Summary" | null;

export type MonthlyCalendarRecord = {
  date: string;
  status: string;
  summary?: {
    present: number;
    absent: number;
    halfDay: number;
  };
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function dayStatus(
  status: string | undefined,
): CalendarDayStatus {
  if (status === "Present") return "Present";
  if (status === "Absent") return "Absent";
  if (status === "Half Day") return "Half Day";
  return null;
}

function cellClass(status: CalendarDayStatus) {
  if (status === "Present") {
    return "bg-emerald-500 text-white shadow-md shadow-emerald-200/60 hover:bg-emerald-600";
  }
  if (status === "Absent") {
    return "bg-red-500 text-white shadow-md shadow-red-200/60 hover:bg-red-600";
  }
  if (status === "Half Day") {
    return "bg-amber-500 text-white shadow-md shadow-amber-200/60 hover:bg-amber-600";
  }
  return "bg-muted/50 text-muted-foreground border border-border/80 hover:bg-muted";
}

function statusLabel(status: CalendarDayStatus) {
  if (status === "Present") return "Present";
  if (status === "Absent") return "Absent";
  if (status === "Half Day") return "Half";
  return "—";
}

export function MonthlyAttendanceCalendar({
  month,
  records,
  loading,
}: {
  month: string;
  records: MonthlyCalendarRecord[];
  loading?: boolean;
}) {
  const { year, monthNumber, monthLabel, days, emptyDays, attendanceMap } = useMemo(() => {
    const [y, mo] = month.split("-").map(Number);
    const firstDay = new Date(y, mo - 1, 1).getDay();
    const daysInMonth = new Date(y, mo, 0).getDate();
    const map: Record<string, MonthlyCalendarRecord> = {};
    records.forEach(r => {
      const key = r.date.split("T")[0];
      map[key] = r;
    });
    return {
      year: y,
      monthNumber: mo,
      monthLabel: new Date(y, mo - 1, 1).toLocaleString("default", { month: "long", year: "numeric" }),
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      emptyDays: Array.from({ length: firstDay }),
      attendanceMap: map,
    };
  }, [month, records]);

  const [selectedRecord, setSelectedRecord] = useState<MonthlyCalendarRecord | null>(null);

  if (loading) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-lg mb-6" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-8 shadow-sm">
      <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-6">
        {monthLabel} calendar
      </h2>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-3 mb-2">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {emptyDays.map((_, i) => (
          <div key={`e-${i}`} className="aspect-square sm:aspect-[4/3] min-h-[3rem] sm:min-h-[4.5rem]" />
        ))}
        {days.map(day => {
          const dateStr = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const rec = attendanceMap[dateStr];

          if (!rec) {
            return (
              <div
                key={dateStr}
                className="aspect-square sm:aspect-[4/3] min-h-[3rem] sm:min-h-[4.5rem] rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 p-1 transition-all duration-200 bg-muted/50 text-muted-foreground border border-border/80"
              >
                <span className="text-sm sm:text-lg font-bold leading-none">{day}</span>
              </div>
            );
          }

          if (rec.summary) {
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedRecord(rec)}
                className="aspect-square sm:aspect-[4/3] min-h-[3rem] sm:min-h-[4.5rem] rounded-xl sm:rounded-2xl flex flex-col items-start p-1.5 sm:p-2 transition-all duration-200 bg-card border border-border/80 shadow-sm hover:border-primary/50 hover:shadow-md cursor-pointer text-left"
              >
                <span className="text-xs sm:text-sm font-bold leading-none mb-1 text-foreground">{day}</span>
                <div className="flex flex-col gap-0.5 w-full">
                  {rec.summary.present > 0 && (
                    <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span> P - {rec.summary.present}
                    </div>
                  )}
                  {rec.summary.absent > 0 && (
                    <div className="text-[9px] sm:text-[10px] font-semibold text-red-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"></span> A - {rec.summary.absent}
                    </div>
                  )}
                  {rec.summary.halfDay > 0 && (
                    <div className="text-[9px] sm:text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"></span> H - {rec.summary.halfDay}
                    </div>
                  )}
                </div>
              </button>
            );
          }

          const st = dayStatus(rec.status);
          return (
            <div
              key={dateStr}
              className={cn(
                "aspect-square sm:aspect-[4/3] min-h-[3rem] sm:min-h-[4.5rem] rounded-xl sm:rounded-2xl",
                "flex flex-col items-center justify-center gap-0.5 p-1 transition-all duration-200",
                cellClass(st),
              )}
              title={st ? `${dateStr}: ${st}` : dateStr}
            >
              <span className="text-sm sm:text-lg font-bold leading-none">{day}</span>
              <span className="text-[9px] sm:text-[10px] font-semibold opacity-90 truncate max-w-full px-0.5">
                {statusLabel(st)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm">
        <LegendDot className="bg-emerald-500" label="Present" />
        <LegendDot className="bg-red-500" label="Absent" />
        <LegendDot className="bg-amber-500" label="Half day" />
        <LegendDot className="bg-muted/50 border border-border" label="No attendance" />
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedRecord && new Date(selectedRecord.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord?.summary && (
            <div className="space-y-4 py-2 mt-2">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Present Batches
                </span>
                <span className="font-semibold text-emerald-600">{selectedRecord.summary.present}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span> Absent Batches
                </span>
                <span className="font-semibold text-red-600">{selectedRecord.summary.absent}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> Half Day Batches
                </span>
                <span className="font-semibold text-amber-600">{selectedRecord.summary.halfDay}</span>
              </div>
              <div className="flex justify-between items-center py-3 pt-5 mt-2 bg-muted/20 rounded-xl px-4 border border-border/60">
                <span className="text-base font-semibold text-foreground">Total Batches</span>
                <span className="text-lg font-bold text-primary">
                  {selectedRecord.summary.present + selectedRecord.summary.absent + selectedRecord.summary.halfDay}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-3.5 w-3.5 rounded-full shrink-0", className)} />
      <span className="text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

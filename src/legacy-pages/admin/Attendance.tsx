"use client";

import { useState } from "react";
import { Calendar, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/dataStore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Status = "Present" | "Absent" | "Late";

export default function Attendance() {
  const teachers = useStore(s => s.teachers);
  const [mode, setMode] = useState<"senior-teacher" | "teacher">("senior-teacher");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const list = mode === "senior-teacher"
    ? teachers.filter(t => t.isSenior).map(t => ({ id: t.id, name: t.name, sub: t.specialization }))
    : teachers.map(t => ({ id: t.id, name: t.name, sub: t.specialization }));

  const [marks, setMarks] = useState<Record<string, Status>>(() => Object.fromEntries(list.map(p => [p.id, "Present"])));
  const counts = { Present: 0, Absent: 0, Late: 0 } as Record<Status, number>;
  list.forEach(p => counts[marks[p.id] ?? "Present"]++);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Mark daily presence" action={
        <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Exported as CSV")}>
          <Download className="w-4 h-4 mr-1.5" />Export
        </Button>
      } />

      <div className="card-soft p-4 grid md:grid-cols-3 gap-3">
        <Tabs value={mode} onValueChange={(v: string) => setMode(v as "senior-teacher" | "teacher")}>
          <TabsList className="rounded-xl"><TabsTrigger value="senior-teacher">Sr-teacher</TabsTrigger><TabsTrigger value="teacher">Teachers</TabsTrigger></TabsList>
        </Tabs>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <div className="flex gap-2 items-center justify-end">
          <Pill label="Present" value={counts.Present} tone="bg-success-soft text-success" />
          <Pill label="Absent"  value={counts.Absent}  tone="bg-destructive-soft text-destructive" />
          <Pill label="Late"    value={counts.Late}    tone="bg-warning-soft text-warning" />
        </div>
      </div>

      <div className="card-soft divide-y divide-border/60">
        {list.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-3 sm:p-4">
            <Avatar name={p.name} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.sub}</div>
            </div>
            <div className="flex gap-1.5">
              {(["Present","Late","Absent"] as Status[]).map(st => (
                <button key={st} onClick={() => setMarks(m => ({ ...m, [p.id]: st }))}
                  className={cn(
                    "text-xs font-bold rounded-lg px-2.5 py-1.5 transition-all border",
                    marks[p.id] === st
                      ? st === "Present" ? "bg-success text-success-foreground border-transparent"
                      : st === "Late"    ? "bg-warning text-warning-foreground border-transparent"
                      : "bg-destructive text-destructive-foreground border-transparent"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  )}>{st}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button className="rounded-xl gradient-primary text-white border-0 shadow-pop" onClick={() => toast.success("Attendance saved!")}>Save attendance</Button>
      </div>
    </div>
  );
}
function Pill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label} {value}</span>;
}

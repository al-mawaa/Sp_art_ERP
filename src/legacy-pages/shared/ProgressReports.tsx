"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Award, Star, Clock, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Avatar } from "@/components/shared/Avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/dataStore";
import { CLASSES, makeAttendance } from "@/data/mockData";

function avgScore(scores: { duration: number; neatness: number; art: number }[]) {
  if (!scores.length) return 0;
  const t = scores.reduce((a, s) => a + s.duration + s.neatness + s.art, 0);
  return t / scores.length;
}

function gradeFor(pct: number) {
  if (pct >= 85) return { grade: "A+", tone: "text-success" };
  if (pct >= 70) return { grade: "A", tone: "text-success" };
  if (pct >= 55) return { grade: "B", tone: "text-info" };
  if (pct >= 40) return { grade: "C", tone: "text-warning" };
  return { grade: "—", tone: "text-muted-foreground" };
}

/* ---- Admin / shared: progress for ALL students + teachers ---- */
export function ProgressReports({ scope = "admin" }: { scope?: "admin" | "teacher" }) {
  const students = useStore(s => s.students);
  const teachers = useStore(s => s.teachers);
  const tests = useStore(s => s.drawingTests);

  const [tab, setTab] = useState<"students" | "teachers">("students");
  const [q, setQ] = useState("");
  const [klass, setKlass] = useState<string>("All");

  const studentRows = useMemo(() => students.map((s, i) => {
    const att = makeAttendance(i);
    const present = att.filter(a => a.status === "Present").length;
    const attPct = Math.round(present / att.length * 100);
    const myTests = tests.filter(t => t.studentId === s.id && t.studentScore);
    const drawingAvg = avgScore(myTests.map(t => t.studentScore!));
    const drawingPct = Math.round((drawingAvg / 30) * 100);
    const overall = Math.round(attPct * 0.5 + drawingPct * 0.5);
    return { s, attPct, drawingAvg, drawingPct, overall, count: myTests.length };
  }), [students, tests]);

  const teacherRows = useMemo(() => teachers.map(t => {
    const myTests = tests.filter(x => x.teacherName === t.name && x.teacherScore);
    const avg = avgScore(myTests.map(x => x.teacherScore!));
    const pct = Math.round((avg / 30) * 100);
    return { t, avg, pct, count: myTests.length };
  }), [teachers, tests]);

  const filteredStudents = studentRows
    .filter(r => klass === "All" || r.s.class === klass)
    .filter(r => !q || r.s.name.toLowerCase().includes(q.toLowerCase()) || r.s.badgeId.toLowerCase().includes(q.toLowerCase()));

  const filteredTeachers = teacherRows
    .filter(r => !q || r.t.name.toLowerCase().includes(q.toLowerCase()));

  const avgStudentOverall = filteredStudents.length
    ? Math.round(filteredStudents.reduce((a, r) => a + r.overall, 0) / filteredStudents.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Progress Reports" subtitle="Performance from attendance and drawing tests" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students tracked" value={filteredStudents.length} icon={TrendingUp} tone="primary" />
        <StatCard label="Avg overall" value={`${avgStudentOverall}%`} icon={Award} tone="success" />
        <StatCard label="Drawing tests" value={tests.length} icon={Star} tone="info" />
        <StatCard label="Pending reviews" value={tests.filter(t => t.status === "Pending Review").length} icon={Clock} tone="warning" />
      </div>

      {scope === "admin" && (
        <div className="flex gap-2">
          {(["students", "teachers"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-colors ${tab === t ? "gradient-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="card-soft p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name..." className="pl-9 rounded-xl" />
        </div>
        {(scope === "teacher" || tab === "students") && (
          <Select value={klass} onValueChange={setKlass}>
            <SelectTrigger className="rounded-xl sm:w-56"><SelectValue placeholder="Filter by class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All classes</SelectItem>
              {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {(scope === "teacher" || tab === "students") ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.length === 0 && (
            <div className="card-soft p-10 text-center text-muted-foreground col-span-full">No students match filters</div>
          )}
          {filteredStudents.map(r => {
            const g = gradeFor(r.overall);
            return (
              <div key={r.s.id} className="card-soft p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.s.name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{r.s.name}</div>
                    <div className="text-xs text-muted-foreground">{r.s.class} • {r.s.badgeId}</div>
                  </div>
                  <div className={`font-display font-bold text-2xl ${g.tone}`}>{g.grade}</div>
                </div>
                <Row label="Attendance" pct={r.attPct} />
                <Row label="Drawing avg" pct={r.drawingPct} hint={`${r.drawingAvg.toFixed(1)}/30 • ${r.count} tests`} />
                <Row label="Overall" pct={r.overall} bold />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.length === 0 && (
            <div className="card-soft p-10 text-center text-muted-foreground col-span-full">No teachers match search</div>
          )}
          {filteredTeachers.map(r => {
            const g = gradeFor(r.pct);
            return (
              <div key={r.t.id} className="card-soft p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.t.name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{r.t.name}</div>
                    <div className="text-xs text-muted-foreground">{r.t.specialization} • {r.t.experience}y exp</div>
                  </div>
                  <div className={`font-display font-bold text-2xl ${g.tone}`}>{g.grade}</div>
                </div>
                <Row label="Avg drawing rating" pct={r.pct} hint={`${r.avg.toFixed(1)}/30 • ${r.count} reviewed`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, pct, hint, bold }: { label: string; pct: number; hint?: string; bold?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={`text-muted-foreground ${bold ? "font-bold text-foreground" : ""}`}>{label}</span>
        <span className="font-mono font-bold tabular-nums">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
"use client";

import { useState, useMemo } from "react";
import { Star, Search, MessageSquareHeart, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore, actions, type ParentFeedback } from "@/store/dataStore";
import { toast } from "sonner";

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= value ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

const ROWS: { key: keyof ParentFeedback["ratings"]; label: string }[] = [
  { key: "teaching", label: "Quality of teaching" },
  { key: "communication", label: "Communication" },
  { key: "artisticGrowth", label: "Artistic growth" },
  { key: "classroom", label: "Classroom & discipline" },
  { key: "variety", label: "Variety of activities" },
  { key: "value", label: "Value for fees" },
];

export default function AdminFeedback() {
  const feedbacks = useStore(s => s.feedbacks);
  const teachers = useStore(s => s.teachers);
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState<ParentFeedback | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return feedbacks.filter(f =>
      (teacherFilter === "all" || f.teacherName === teacherFilter) &&
      (statusFilter === "all" || f.status === statusFilter) &&
      (!q || f.studentName.toLowerCase().includes(q) || f.parentName.toLowerCase().includes(q) || f.teacherName.toLowerCase().includes(q)),
    );
  }, [feedbacks, search, teacherFilter, statusFilter]);

  const newCount = feedbacks.filter(f => f.status === "New").length;
  const avgOverall = feedbacks.length
    ? (feedbacks.reduce((a, f) => a + Object.values(f.ratings).reduce((x, y) => x + y, 0) / 6, 0) / feedbacks.length).toFixed(1)
    : "—";
  const recommendRate = feedbacks.length
    ? Math.round((feedbacks.filter(f => f.recommend === "Yes").length / feedbacks.length) * 100) + "%"
    : "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Parent Feedback" subtitle="Reviews submitted by parents" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Feedback" value={feedbacks.length} icon={MessageSquareHeart} tone="info" />
        <StatCard label="New" value={newCount} icon={MessageSquareHeart} tone="accent" />
        <StatCard label="Avg Rating" value={`${avgOverall}/5`} icon={Star} tone="success" />
        <StatCard label="Would Recommend" value={recommendRate} icon={CheckCircle2} tone="success" />
      </div>

      <div className="card-soft p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by student, parent or teacher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Teacher" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teachers</SelectItem>
            {teachers.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Reviewed">Reviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="card-soft p-10 text-center text-muted-foreground">No feedback yet — parents can submit from the student portal.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(f => {
            const avg = (Object.values(f.ratings).reduce((a, b) => a + b, 0) / 6).toFixed(1);
            return (
              <button key={f.id} onClick={() => setOpen(f)} className="card-soft p-4 text-left hover:shadow-pop transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-bold">{f.parentName}</div>
                    <div className="text-xs text-muted-foreground">Parent of {f.studentName} • For {f.teacherName}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${f.status === "New" ? "bg-accent-soft text-accent-foreground" : "bg-success-soft text-success"}`}>{f.status}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Stars value={Math.round(Number(avg))} />
                  <span className="text-sm font-bold">{avg}/5</span>
                  <span className="text-xs text-muted-foreground ml-auto">{f.submittedAt}</span>
                </div>
                {f.appreciate && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">"{f.appreciate}"</p>}
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={o => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>Feedback from {open.parentName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><div className="text-muted-foreground">Student</div><div className="font-semibold">{open.studentName}</div></div>
                  <div><div className="text-muted-foreground">For Teacher</div><div className="font-semibold">{open.teacherName}</div></div>
                  <div><div className="text-muted-foreground">Submitted</div><div className="font-semibold">{open.submittedAt}</div></div>
                  <div><div className="text-muted-foreground">Recommends</div><div className="font-semibold">{open.recommend}</div></div>
                </div>

                <div>
                  <div className="font-semibold mb-2">Program Satisfaction</div>
                  <div className="card-soft divide-y divide-border/60">
                    {ROWS.map(r => (
                      <div key={r.key} className="p-2.5 flex items-center justify-between">
                        <span>{r.label}</span>
                        <div className="flex items-center gap-2"><Stars value={open.ratings[r.key]} /><span className="text-xs font-bold w-6 text-right">{open.ratings[r.key]}/5</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                {open.instructorImpression && <Field label="Instructor impression" value={open.instructorImpression} />}
                <Field label={`Child motivated? — ${open.motivated}`} value={open.motivatedExplain || "—"} />
                <Field label={`Well informed about progress? — ${open.informed}`} value={open.communicationSuggestions || "—"} />
                {open.appreciate && <Field label="Appreciates most" value={open.appreciate} />}
                {open.improve && <Field label="Areas to improve" value={open.improve} />}
                {open.additional && <Field label="Additional comments" value={open.additional} />}

                <div className="flex justify-end gap-2 pt-2">
                  {open.status === "New" && (
                    <Button className="rounded-xl gradient-primary text-white border-0" onClick={() => {
                      actions.markFeedbackReviewed(open.id);
                      toast.success("Marked as reviewed");
                      setOpen(null);
                    }}>
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />Mark as reviewed
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className="rounded-lg bg-muted/40 p-3 whitespace-pre-wrap">{value}</div>
    </div>
  );
}
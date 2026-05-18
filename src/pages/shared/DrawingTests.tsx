"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Image as ImageIcon, Star, Send, Award, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar } from "@/components/shared/Avatar";
import { StatusPill } from "@/components/shared/StatusPill";
import { StatCard } from "@/components/shared/StatCard";
import { useStore, actions, type DrawingTest, type DrawingScore } from "@/store/dataStore";
import { CLASSES } from "@/data/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ImagePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 flex items-center justify-center overflow-hidden relative"
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-muted-foreground">
            <Upload className="w-6 h-6 mx-auto mb-1" />
            <div className="text-xs font-semibold">Click to upload</div>
          </div>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0];
          if (f) onChange(await fileToDataUrl(f));
        }}
      />
    </div>
  );
}

/* ---------------- Teacher: submit a drawing test ---------------- */
export function TeacherDrawingTests() {
  const tests = useStore(s => s.drawingTests);
  const students = useStore(s => s.students);
  const teacherName = "Sneha Kulkarni";
  const myTests = tests.filter(t => t.teacherName === teacherName);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    studentId: students[0]?.id ?? "",
    className: CLASSES[0] as string,
    duration: 30,
    teacherImage: "",
    studentImage: "",
  });

  function reset() {
    setForm({ title: "", studentId: students[0]?.id ?? "", className: CLASSES[0], duration: 30, teacherImage: "", studentImage: "" });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.teacherImage || !form.studentImage) {
      toast.error("Add title and both drawings");
      return;
    }
    const stu = students.find(s => s.id === form.studentId);
    if (!stu) return;
    actions.submitDrawingTest({
      title: form.title,
      studentId: stu.id,
      studentName: stu.name,
      teacherName,
      className: form.className,
      teacherImage: form.teacherImage,
      studentImage: form.studentImage,
      durationMinutes: Number(form.duration) || 0,
    });
    toast.success("Sent to senior teacher for review!");
    setOpen(false);
    reset();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drawing Tests"
        subtitle="Submit student drawings for senior teacher review"
        action={
          <Button className="rounded-xl gradient-primary text-white border-0" onClick={() => setOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> New submission
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Submitted" value={myTests.length} icon={ImageIcon} tone="info" />
        <StatCard label="Pending" value={myTests.filter(t => t.status === "Pending Review").length} icon={Clock} tone="warning" />
        <StatCard label="Scored" value={myTests.filter(t => t.status === "Scored").length} icon={Award} tone="success" />
        <StatCard
          label="Avg my score"
          value={(() => {
            const scored = myTests.filter(t => t.teacherScore);
            if (!scored.length) return "—";
            const tot = scored.reduce((a, t) => a + (t.teacherScore!.duration + t.teacherScore!.neatness + t.teacherScore!.art), 0) / scored.length;
            return `${tot.toFixed(1)}/30`;
          })()}
          icon={Star}
          tone="primary"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {myTests.length === 0 && (
          <div className="card-soft p-10 text-center text-muted-foreground col-span-full">
            No drawing tests yet. Click "New submission" to send one.
          </div>
        )}
        {myTests.map(t => (
          <TestCard key={t.id} test={t} showStudent showBoth />
        ))}
      </div>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New drawing test</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Test title</Label>
                <Input className="rounded-xl" placeholder="e.g. Still life - apple" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select value={form.className} onValueChange={v => setForm(f => ({ ...f, className: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Student</Label>
                <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} • {s.badgeId}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Time taken (minutes)</Label>
                <Input type="number" min={1} className="rounded-xl" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <ImagePicker label="Teacher's drawing (reference)" value={form.teacherImage} onChange={v => setForm(f => ({ ...f, teacherImage: v }))} />
              <ImagePicker label="Student's drawing" value={form.studentImage} onChange={v => setForm(f => ({ ...f, studentImage: v }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary text-white border-0">
                <Send className="w-4 h-4 mr-1" /> Send to senior teacher
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Senior teacher: review queue + immediate scoring ---------------- */
export function SeniorDrawingReviews() {
  const tests = useStore(s => s.drawingTests);
  const pending = tests.filter(t => t.status === "Pending Review");
  const scored = tests.filter(t => t.status === "Scored");
  const [active, setActive] = useState<DrawingTest | null>(null);

  // Auto-open the first pending test so reviewer scores immediately
  // (only when user hasn't dismissed)
  const autoOpenId = useMemo(() => pending[0]?.id, [pending]);
  if (autoOpenId && !active && pending.length > 0) {
    // open lazily on next paint to avoid setState during render warnings
    queueMicrotask(() => setActive(pending[0]));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Drawing Reviews" subtitle="Score teacher and student drawings" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Pending" value={pending.length} icon={Clock} tone="warning" />
        <StatCard label="Scored" value={scored.length} icon={Award} tone="success" />
        <StatCard label="Total tests" value={tests.length} icon={ImageIcon} tone="info" />
      </div>

      <div>
        <h3 className="font-display font-bold text-lg mb-3">Pending review</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pending.length === 0 && <div className="card-soft p-10 text-center text-muted-foreground col-span-full">All caught up! 🎉</div>}
          {pending.map(t => (
            <button key={t.id} onClick={() => setActive(t)} className="text-left">
              <TestCard test={t} showStudent showTeacher />
            </button>
          ))}
        </div>
      </div>

      {scored.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-lg mb-3">Recently scored</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scored.slice(0, 6).map(t => (
              <button key={t.id} onClick={() => setActive(t)} className="text-left">
                <TestCard test={t} showStudent showTeacher showBoth />
              </button>
            ))}
          </div>
        </div>
      )}

      <ReviewDialog test={active} onClose={() => setActive(null)} />
    </div>
  );
}

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span className="font-semibold">{label}</span><span className="font-mono font-bold">{value}/10</span></div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 h-7 rounded-md text-[11px] font-bold transition-colors",
              n <= value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreCard({ title, score, onChange, readOnly }: { title: string; score: DrawingScore; onChange?: (s: DrawingScore) => void; readOnly?: boolean }) {
  const total = score.duration + score.neatness + score.art;
  return (
    <div className="card-soft p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="font-display font-bold">{title}</div>
        <div className="text-xs font-mono font-bold rounded-md bg-success/15 text-success px-2 py-1">{total}/30</div>
      </div>
      {readOnly ? (
        <div className="space-y-1.5 text-sm">
          <ReadRow label="Duration" v={score.duration} />
          <ReadRow label="Neatness" v={score.neatness} />
          <ReadRow label="Art" v={score.art} />
        </div>
      ) : (
        <div className="space-y-2">
          <ScoreSlider label="Duration" value={score.duration} onChange={v => onChange!({ ...score, duration: v })} />
          <ScoreSlider label="Neatness" value={score.neatness} onChange={v => onChange!({ ...score, neatness: v })} />
          <ScoreSlider label="Art" value={score.art} onChange={v => onChange!({ ...score, art: v })} />
        </div>
      )}
    </div>
  );
}

export default TeacherDrawingTests;

function ReadRow({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono font-bold">{v}/10</span></div>
  );
}

function ReviewDialog({ test, onClose }: { test: DrawingTest | null; onClose: () => void }) {
  const [studentScore, setStudentScore] = useState<DrawingScore>({ duration: 7, neatness: 7, art: 7 });
  const [teacherScore, setTeacherScore] = useState<DrawingScore>({ duration: 8, neatness: 8, art: 8 });
  const [notes, setNotes] = useState("");

  // Reset form when a new test is opened
  const idRef = useRef<string | null>(null);
  if (test && idRef.current !== test.id) {
    idRef.current = test.id;
    setStudentScore(test.studentScore ?? { duration: 7, neatness: 7, art: 7 });
    setTeacherScore(test.teacherScore ?? { duration: 8, neatness: 8, art: 8 });
    setNotes(test.reviewerNotes ?? "");
  }

  if (!test) return null;
  const isScored = test.status === "Scored";

  function save() {
    actions.scoreDrawingTest(test!.id, { studentScore, teacherScore, notes });
    toast.success("Scores saved — visible to teacher and student");
    onClose();
  }

  return (
    <Dialog open={!!test} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {test.title}
            <StatusPill status={isScored ? "Scored" : "Pending Review"} />
          </DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground -mt-2 mb-2">
          By <b>{test.teacherName}</b> • Student <b>{test.studentName}</b> • {test.className} • {test.durationMinutes} min • {test.submittedAt}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold mb-1 text-muted-foreground">Teacher's drawing</div>
            <img src={test.teacherImage} alt="teacher" className="w-full rounded-xl border border-border bg-muted/30 object-contain max-h-72" />
          </div>
          <div>
            <div className="text-xs font-semibold mb-1 text-muted-foreground">Student's drawing</div>
            <img src={test.studentImage} alt="student" className="w-full rounded-xl border border-border bg-muted/30 object-contain max-h-72" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <ScoreCard title={`Score teacher (${test.teacherName})`} score={teacherScore} onChange={setTeacherScore} readOnly={isScored} />
          <ScoreCard title={`Score student (${test.studentName})`} score={studentScore} onChange={setStudentScore} readOnly={isScored} />
        </div>

        <div className="space-y-1.5">
          <Label>Reviewer notes (optional)</Label>
          <Textarea rows={2} className="rounded-xl" value={notes} onChange={e => setNotes(e.target.value)} disabled={isScored} placeholder="Brief feedback for the teacher and student" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!isScored && (
            <Button className="gradient-primary text-white border-0" onClick={save}>
              <Star className="w-4 h-4 mr-1" /> Submit scores
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Student: my scores ---------------- */
export function StudentMyScores({ studentId }: { studentId: string }) {
  const tests = useStore(s => s.drawingTests).filter(t => t.studentId === studentId);
  const scored = tests.filter(t => t.status === "Scored" && t.studentScore);
  const avg = scored.length
    ? (scored.reduce((a, t) => a + t.studentScore!.duration + t.studentScore!.neatness + t.studentScore!.art, 0) / scored.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <PageHeader title="My Scores" subtitle="Drawing test results from your teacher" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Tests" value={tests.length} icon={ImageIcon} tone="info" />
        <StatCard label="Scored" value={scored.length} icon={Award} tone="success" />
        <StatCard label="Avg score" value={`${avg}/30`} icon={Star} tone="primary" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.length === 0 && (
          <div className="card-soft p-10 text-center text-muted-foreground col-span-full">
            No tests yet. Your teacher will share drawing tests here.
          </div>
        )}
        {tests.map(t => (
          <div key={t.id} className="card-soft p-4 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-display font-bold">{t.title}</div>
                <div className="text-xs text-muted-foreground">By {t.teacherName} • {t.submittedAt}</div>
              </div>
              <StatusPill status={t.status} />
            </div>
            <img src={t.studentImage} alt={t.title} className="w-full rounded-lg border border-border bg-muted/30 object-contain max-h-48" />
            {t.studentScore ? (
              <div className="space-y-1 text-sm pt-1 border-t border-border/60">
                <ReadRow label="Duration" v={t.studentScore.duration} />
                <ReadRow label="Neatness" v={t.studentScore.neatness} />
                <ReadRow label="Art" v={t.studentScore.art} />
                <div className="flex justify-between pt-1">
                  <span className="font-bold">Total</span>
                  <span className="font-mono font-bold text-success">{t.studentScore.duration + t.studentScore.neatness + t.studentScore.art}/30</span>
                </div>
                {t.reviewerNotes && <div className="text-xs italic text-muted-foreground pt-1">"{t.reviewerNotes}"</div>}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-2">Awaiting senior teacher review…</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Shared compact card ---------------- */
function TestCard({ test, showStudent, showTeacher, showBoth }: { test: DrawingTest; showStudent?: boolean; showTeacher?: boolean; showBoth?: boolean }) {
  const sTotal = test.studentScore ? test.studentScore.duration + test.studentScore.neatness + test.studentScore.art : null;
  const tTotal = test.teacherScore ? test.teacherScore.duration + test.teacherScore.neatness + test.teacherScore.art : null;
  return (
    <div className="card-soft p-4 space-y-3 hover:shadow-pop transition-shadow">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="font-display font-bold truncate">{test.title}</div>
          <div className="text-xs text-muted-foreground truncate">{test.className} • {test.durationMinutes} min</div>
        </div>
        <StatusPill status={test.status} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1">Teacher</div>
          <img src={test.teacherImage} alt="t" className="w-full h-24 object-cover rounded-lg border border-border" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1">Student</div>
          <img src={test.studentImage} alt="s" className="w-full h-24 object-cover rounded-lg border border-border" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs pt-2 border-t border-border/60">
        {showStudent && (
          <div className="flex items-center gap-1.5">
            <Avatar name={test.studentName} size={20} />
            <span className="font-semibold truncate max-w-[100px]">{test.studentName}</span>
          </div>
        )}
        {showTeacher && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Avatar name={test.teacherName} size={20} />
            <span className="font-semibold truncate max-w-[100px]">{test.teacherName}</span>
          </div>
        )}
      </div>
      {(showBoth || test.status === "Scored") && (sTotal !== null || tTotal !== null) && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
          <div className="rounded-lg bg-muted/50 p-2 text-center"><div className="text-muted-foreground">Student</div><div className="font-mono font-bold text-success">{sTotal ?? "—"}/30</div></div>
          <div className="rounded-lg bg-muted/50 p-2 text-center"><div className="text-muted-foreground">Teacher</div><div className="font-mono font-bold text-success">{tTotal ?? "—"}/30</div></div>
        </div>
      )}
    </div>
  );
}
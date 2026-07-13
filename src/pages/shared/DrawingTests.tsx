"use client";



import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import { Upload, Image as ImageIcon, Star, Send, Award, Clock, Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { Progress } from "@/components/ui/progress";

import { Avatar } from "@/components/shared/Avatar";

import { StatusPill } from "@/components/shared/StatusPill";

import { StatCard } from "@/components/shared/StatCard";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useStore, actions, type DrawingTest, type DrawingScore } from "@/store/dataStore";

import { useTeacherSessionGuard } from "@/components/teacher/useTeacherSessionGuard";

import { toast } from "sonner";

import { cn, formatPercentage } from "@/lib/utils";



function fileToDataUrl(file: File): Promise<string> {

  return new Promise((resolve, reject) => {

    const r = new FileReader();

    r.onload = () => resolve(String(r.result));

    r.onerror = reject;

    r.readAsDataURL(file);

  });

}



type TeacherDrawingTest = {

  id: string;

  teacherId: string;

  teacherName: string;

  batchId: string;

  batchName: string;

  courseName: string;

  batchMonth: string;

  studentId: string;

  studentName: string;

  testTitle: string;

  timeTaken: number;

  teacherDrawingImage: string;

  studentDrawingImage: string;

  status: 'Pending Senior Review' | 'Reviewed' | 'Approved' | 'Rejected';

  submittedAt: string;

  createdAt: string;

  performancePercentage?: number | null;

  evaluatedAt?: string | null;

  reviewerNotes?: string;

};



type ApiBatchResponse = { id?: string; batchName?: string; name?: string; batchTitle?: string };

type ApiStudentResponse = { id?: string; studentId?: string; name?: string; studentName?: string; badgeId?: string };

type BatchOption = { id: string; name: string };

type BatchStudentItem = { id: string; name: string; badgeId?: string };



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

export function TeacherDrawingTests({ taskId }: { taskId?: string } = {}) {

  const storeStudents = useStore(s => s.students);

  const [tests, setTests] = useState<TeacherDrawingTest[]>([]);

  const [loadingTests, setLoadingTests] = useState(false);

  const [testsError, setTestsError] = useState<string | null>(null);



  const [taskInfo, setTaskInfo] = useState<{ batchId: string; batchName: string; taskName: string; taskDate: string } | null>(null);

  const [taskError, setTaskError] = useState<string | null>(null);

  const [batches, setBatches] = useState<ApiBatchResponse[]>([]);

  const [batchStudents, setBatchStudents] = useState<BatchStudentItem[]>([]);

  const [loadingStudents, setLoadingStudents] = useState(false);



  const avgPerformance = useMemo(() => {

    const scoredTests = tests

      .map(test => test.performancePercentage)

      .filter((value): value is number => value !== null && value !== undefined);

    if (!scoredTests.length) return null;

    return scoredTests.reduce((sum, value) => sum + value, 0) / scoredTests.length;

  }, [tests]);

  const { sessionOk, checking } = useTeacherSessionGuard();



  const [open, setOpen] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  const [form, setForm] = useState({

    title: "",

    studentId: storeStudents[0]?.id ?? "",

    batchId: "",

    duration: 30,

    teacherImage: "",

    studentImage: "",

  });



  async function loadBatches() {

    try {

      const res = await fetch('/api/teacher/batches', { credentials: 'include' });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && Array.isArray(json.data?.batches)) {

        setBatches(json.data.batches);

      } else {

        setBatches([]);

      }

    } catch (e) {

      console.error('Failed to load batches', e);

      setBatches([]);

    }

  }



  function reset() {

    setEditingTestId(null);

    const defaultBatchId = taskInfo?.batchId ?? (batches[0]?.id || "");

    setForm({ title: "", studentId: batchStudents[0]?.id ?? storeStudents[0]?.id ?? "", batchId: defaultBatchId, duration: 30, teacherImage: "", studentImage: "" });

  }



  async function handleNewSubmission() {

    if (taskInfo?.batchId) {

      await loadStudentsForBatch(taskInfo.batchId);

      setForm(f => ({ ...f, batchId: taskInfo.batchId }));

    }

    setOpen(true);

  }



  function openEdit(test: TeacherDrawingTest) {

    setEditingTestId(test.id);

    setForm({

      title: test.testTitle,

      studentId: test.studentId,

      batchId: test.batchId,

      duration: test.timeTaken,

      teacherImage: test.teacherDrawingImage,

      studentImage: test.studentDrawingImage,

    });

    loadStudentsForBatch(test.batchId);

    setOpen(true);

  }



  async function submit(e: React.FormEvent) {

    e.preventDefault();

    if (!form.title || !form.studentImage) {

      toast.error("Add title and student drawing");

      return;

    }

    if (!form.batchId) {

      toast.error('Please select a batch');

      return;

    }

    const stu = batchStudents.find(s => s.id === form.studentId);

    if (!stu) {

      toast.error('Please select a student');

      return;

    }

    try {

      setLoadingSubmit(true);

      const isEdit = Boolean(editingTestId);

      const response = await fetch(editingTestId ? `/api/drawing-tests/${editingTestId}` : '/api/drawing-tests', {

        method: isEdit ? 'PUT' : 'POST',

        credentials: 'include',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          batchId: form.batchId,

          studentId: stu.id,

          taskId: taskId ?? null,

          testTitle: form.title,

          studentDrawingImage: form.studentImage,

          timeTaken: Number(form.duration) || 0,

        }),

      });



      const result = await response.json().catch(() => null);

      if (!response.ok) {

        console.error('Drawing test submit failed', response.status, result);

        toast.error(result?.error || `Submit failed (${response.status})`);

        return;

      }



      if (result?.success) {

        toast.success(editingTestId ? 'Drawing test updated successfully.' : 'Drawing test submitted successfully and sent to Senior Teacher.');

        setOpen(false);

        reset();

        // Reload tests for this specific task

        await loadTeacherTests(taskId);

      } else {

        toast.error(result?.error || 'Failed to submit');

      }

    } catch (err) {

      console.error('Drawing test submit error', err);

      toast.error('Failed to submit due to network or server error');

    } finally {

      setLoadingSubmit(false);

    }

  }



  const loadTaskInfo = useCallback(async () => {

    if (!taskId) return;

    setTaskError(null);

    try {

      const res = await fetch(`/api/drawing-tasks/${taskId}`, { credentials: 'include' });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json.data?.task) {

        const errorMessage = json?.error || `Task load failed (${res.status})`;

        console.error('loadTaskInfo failed', res.status, json);

        setTaskError(errorMessage);

        return;

      }



      const batchIdValue = json.data.task.batchId ? String(json.data.task.batchId) : '';

      if (!batchIdValue) {

        setTaskError('Task batch id is missing or invalid.');

        return;

      }



      setTaskInfo({

        batchId: batchIdValue,

        batchName: String(json.data.task.batchName || 'Unknown batch'),

        taskName: String(json.data.task.taskName || 'Drawing task'),

        taskDate: new Date(json.data.task.taskDate).toISOString(),

      });

      setForm(f => ({ ...f, batchId: batchIdValue }));

      await loadStudentsForBatch(batchIdValue);

    } catch (e) {

      console.error('Failed to load task info', e);

      setTaskError('Unable to load task information.');

    }

  }, [taskId]);



  const loadTeacherTests = useCallback(async (filterTaskId?: string) => {

    setLoadingTests(true);

    setTestsError(null);

    try {

      let apiUrl = '/api/drawing-tests/teacher';

      if (filterTaskId) {

        apiUrl += `?taskId=${encodeURIComponent(filterTaskId)}`;

      }

      const res = await fetch(apiUrl, { credentials: 'include' });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {

        console.error('loadTeacherTests failed', res.status, json);

        setTests([]);

        setLoadingTests(false);

        return;

      }

      setTests(Array.isArray(json.data?.tests) ? json.data.tests : []);

    } catch (e) {

      console.error('Failed to load teacher tests', e);

      setTests([]);

    } finally {

      setLoadingTests(false);

    }

  }, []);



  async function loadStudentsForBatch(batchId: string) {

    if (!batchId) return setBatchStudents([]);

    setLoadingStudents(true);

    try {

      const res = await fetch(`/api/teacher/batches/${batchId}/students`, { credentials: 'include' });

      const json = await res.json().catch(() => null);

      if (!res.ok) {

        console.error('loadStudentsForBatch failed', res.status, json);

        setLoadingStudents(false);

        return;

      }

      const typed = json as { success?: boolean; data?: { students?: ApiStudentResponse[] } } | null;

      if (typed?.success && Array.isArray(typed.data?.students)) {

        const students = typed.data.students

          .map((s): BatchStudentItem => ({

            id: s.id ? String(s.id) : s.studentId ? String(s.studentId) : '',

            name: s.name || s.studentName || '',

            badgeId: s.badgeId || undefined,

          }))

          .filter((s): s is BatchStudentItem => Boolean(s.id));

        setBatchStudents(students);

        setForm(f => ({

          ...f,

          studentId: students.find(s => s.id === f.studentId)?.id ?? students[0]?.id ?? f.studentId,

        }));

      } else {

        setBatchStudents([]);

      }

    } catch (e) {

      console.error('Failed to load students for batch', e);

      setBatchStudents([]);

    } finally {

      setLoadingStudents(false);

    }

  }



  useEffect(() => {

    if (!checking && sessionOk) {

      if (taskId) {

        // When viewing a specific task, only load submissions for that task

        loadTeacherTests(taskId);

        loadTaskInfo();

      } else {

        // When on general drawing tests page, load all submissions

        loadTeacherTests();

        loadBatches();

      }

    }

  }, [checking, sessionOk, taskId, loadTeacherTests, loadTaskInfo]);



  if (checking) {

    return (

      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">

        Verifying teacher session…

      </div>

    );

  }



  if (!sessionOk) {

    return null;

  }



  return (

    <div className="space-y-6">

      {taskId && (

        <div className="flex items-center gap-2">

          <Button variant="outline" onClick={() => window.location.href = '/teacher/drawing-tests'}>

            ← Back

          </Button>

        </div>

      )}

      <PageHeader

        title={taskInfo?.taskName || 'Drawing Tests'}

        subtitle={

          taskInfo

            ? `Task date: ${new Date(taskInfo.taskDate).toLocaleDateString()} · Batch: ${taskInfo.batchName}`

            : 'Submit student drawings for senior teacher review'

        }

        action={

          taskId ? (

            <Button

              className="rounded-xl gradient-primary text-white border-0"

              onClick={handleNewSubmission}

            >

              <Upload className="w-4 h-4 mr-1" /> New submission

            </Button>

          ) : null

        }

      />

      {taskError ? (

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">

          {taskError}

        </div>

      ) : null}



      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard label="Submitted" value={tests.length} icon={ImageIcon} tone="info" />

        <StatCard label="Pending review" value={tests.filter(t => t.status === "Pending Senior Review").length} icon={Clock} tone="warning" />

        <StatCard label="Reviewed" value={tests.filter(t => t.status !== "Pending Senior Review").length} icon={Award} tone="success" />

        <StatCard label="Student performance" value={avgPerformance !== null ? `${avgPerformance.toFixed(1)}%` : '—'} icon={Star} tone="primary" />

      </div>



      <div className="space-y-4">

        <div className="rounded-xl border border-border overflow-hidden">

          <Table>

            <TableHeader className="bg-slate-50">

              <TableRow>

                <TableHead>Status</TableHead>

                <TableHead>Student</TableHead>

                <TableHead>Batch</TableHead>

                <TableHead>Test Title</TableHead>

                <TableHead>Time</TableHead>

                <TableHead>Score</TableHead>

                <TableHead>Submitted</TableHead>

                <TableHead>Action</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {tests.length === 0 && (

                <TableRow>

                  <TableCell className="px-4 py-6 text-center text-muted-foreground" colSpan={8}>

                    {loadingTests ? 'Loading drawing tests…' : testsError ? testsError : 'No student submissions available. Click "New Submission" to upload student drawings.'}

                  </TableCell>

                </TableRow>

              )}

              {tests.map(test => (

                <TableRow key={test.id} className="hover:bg-slate-50">

                  <TableCell><StatusPill status={test.status} /></TableCell>

                  <TableCell className="font-medium whitespace-nowrap">{test.studentName}</TableCell>

                  <TableCell>{test.batchName}</TableCell>

                  <TableCell>{test.testTitle}</TableCell>

                  <TableCell>{test.timeTaken} min</TableCell>

                  <TableCell>{test.performancePercentage !== null && test.performancePercentage !== undefined ? formatPercentage(test.performancePercentage) : '—'}</TableCell>

                  <TableCell>{formatSubmittedAt(test.submittedAt)}</TableCell>

                  <TableCell>

                    <Button

                      type="button"

                      variant="outline"

                      size="sm"

                      className="rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1"

                      onClick={() => openEdit(test)}

                    >

                      <Pencil className="w-4 h-4" />

                      Edit

                    </Button>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </div>



      </div>



      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) reset(); }}>

        <DialogContent className="max-w-2xl">

          <DialogHeader>

            <DialogTitle>{editingTestId ? 'Edit drawing test' : 'New drawing test'}</DialogTitle>

          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">

            {!taskInfo && (

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">

                Select a batch to start adding submissions

              </div>

            )}

            <div className="grid sm:grid-cols-2 gap-3">

              <div className="space-y-1.5">

                <Label>Task title</Label>

                <Input className="rounded-xl" placeholder="e.g. Still life - apple" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

              </div>

              {!taskInfo && (

                <div className="space-y-1.5">

                  <Label>Batch</Label>

                  <Select

                    value={form.batchId}

                    onValueChange={async (v) => {

                      setForm(f => ({ ...f, batchId: v }));

                      await loadStudentsForBatch(v);

                    }}

                  >

                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a batch" /></SelectTrigger>

                    <SelectContent>

                      {batches.length === 0 && <SelectItem value="none" disabled>No batches available</SelectItem>}

                      {batches.map(batch => (

                        <SelectItem key={batch.id} value={String(batch.id)}>

                          {batch.batchName || batch.name || `Batch ${batch.id}`}

                        </SelectItem>

                      ))}

                    </SelectContent>

                  </Select>

                </div>

              )}

              <div className="space-y-1.5">

                <Label>Student</Label>

                <Select

                  value={form.studentId}

                  onValueChange={v => setForm(f => ({ ...f, studentId: v }))}

                  disabled={loadingStudents || batchStudents.length === 0}

                >

                  <SelectTrigger className="rounded-xl">

                    <SelectValue placeholder={loadingStudents ? 'Loading students…' : batchStudents.length === 0 ? 'No students available' : 'Select a student'}>

                      {batchStudents.find(s => String(s.id) === form.studentId)?.name || (loadingStudents ? 'Loading...' : 'Select a student')}

                    </SelectValue>

                  </SelectTrigger>

                  <SelectContent>

                    {batchStudents.length === 0 && <SelectItem value="none" disabled>{loadingStudents ? 'Loading students…' : 'No students in this batch'}</SelectItem>}

                    {batchStudents.map(s => (

                      <SelectItem key={String(s.id)} value={String(s.id)}>{s.name}{s.badgeId ? ` • ${s.badgeId}` : ''}</SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div className="space-y-1.5">

                <Label>Time taken (minutes)</Label>

                <Input type="number" min={1} className="rounded-xl" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />

              </div>

            </div>

            <div className="grid sm:grid-cols-1 gap-3">

              <ImagePicker label="Student's drawing" value={form.studentImage} onChange={v => setForm(f => ({ ...f, studentImage: v }))} />

            </div>

            <DialogFooter>

              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>

              <Button type="submit" className="gradient-primary text-white border-0" disabled={loadingSubmit}>

                <Send className="w-4 h-4 mr-1" /> {loadingSubmit ? 'Sending…' : 'Send to senior teacher'}

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



function formatSubmittedAt(value: string) {

  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

}



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

type StudentScoreRecord = {

  id: string;

  submissionId: string;

  taskId: string | null;

  testTitle: string;

  batchName: string;

  courseName: string;

  studentDrawingImage: string;

  studentName: string;

  teacherName: string;

  timeTaken: number;

  submittedAt: string | null;

  evaluation: {

    drawingMarks: number;

    coloringMarks: number;

    speedMarks: number;

    neatnessMarks: number;

    creativityMarks: number;

    accuracyMarks: number;

    obtainedMarks: number;

    maxMarks: number;

    performancePercentage: number;

    remarks: string;

    evaluatedAt: string | null;

  };

};



export function StudentMyScores({ studentId }: { studentId?: string }) {

  const [records, setRecords] = useState<StudentScoreRecord[]>([]);

  const [totalDrawingTests, setTotalDrawingTests] = useState(0);

  const [loadingRecords, setLoadingRecords] = useState(true);

  const [recordError, setRecordError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);



  useEffect(() => {

    let mounted = true;

    async function loadRecords() {

      setLoadingRecords(true);

      setRecordError(null);

      try {

        const res = await fetch('/api/student/evaluations', { credentials: 'include' });

        const json = await res.json().catch(() => null);

        if (!res.ok) {

          setRecordError(json?.error || `Failed to load scores (${res.status})`);

          setRecords([]);

          return;

        }

        setRecords(Array.isArray(json?.data?.evaluations) ? json.data.evaluations : []);

        setTotalDrawingTests(json?.data?.totalDrawingTests ?? 0);

      } catch (error) {

        console.error('[StudentMyScores] failed to fetch evaluations', error);

        setRecordError('Unable to load your score history.');

        setRecords([]);

      } finally {

        if (mounted) setLoadingRecords(false);

      }

    }



    loadRecords();

    return () => {

      mounted = false;

    };

  }, [studentId]);



  const averageScore = records.length

    ? (records.reduce((sum, record) => sum + (record.evaluation?.obtainedMarks ?? 0), 0) / records.length).toFixed(1)

    : '—';

  const averagePerformance = records.length

    ? records.reduce((sum, record) => sum + (record.evaluation?.performancePercentage ?? 0), 0) / records.length

    : null;



  return (

    <div className="space-y-6">

      <PageHeader title="My Scores" subtitle="Authenticated evaluation history for your account" />



      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <StatCard label="Total drawing tests" value={totalDrawingTests} icon={ImageIcon} tone="info" />

        <StatCard label="Evaluated tests" value={records.length} icon={Award} tone="success" />

        <StatCard label="Avg score" value={averageScore === '—' ? '—' : `${averageScore}/30`} icon={Star} tone="primary" />

      </div>



      <div className="rounded-3xl border border-border bg-muted/50 p-5">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <div>

            <p className="text-sm text-muted-foreground">Average evaluation performance</p>

            <p className="text-2xl font-semibold">{averagePerformance !== null ? formatPercentage(averagePerformance) : 'Awaiting reviews'}</p>

          </div>

          <div className="text-sm text-muted-foreground">

            {records.length} evaluated test{records.length !== 1 ? 's' : ''}

          </div>

        </div>

        <Progress value={averagePerformance ?? 0} />

      </div>



      {loadingRecords ? (

        <div className="rounded-xl border border-border/70 bg-muted/40 p-8 text-center text-sm text-muted-foreground">

          Loading your scores…

        </div>

      ) : recordError ? (

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">

          {recordError}

        </div>

      ) : records.length === 0 ? (

        <div className="rounded-xl border border-border/70 bg-muted/40 p-12 text-center">

          <div className="max-w-md mx-auto space-y-4">

            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">

              <Award className="w-8 h-8 text-muted-foreground" />

            </div>

            <h3 className="text-lg font-semibold">No evaluations yet</h3>

            <p className="text-sm text-muted-foreground">

              {totalDrawingTests === 0

                ? "You haven't submitted any drawing tests yet. Once you submit drawings and they are evaluated by your teacher, your scores will appear here."

                : `You have submitted ${totalDrawingTests} drawing test${totalDrawingTests !== 1 ? 's' : ''}, but none have been evaluated yet. Your teacher will evaluate them and the scores will appear here.`}

            </p>

          </div>

        </div>

      ) : (

        <div className="rounded-xl border border-border overflow-hidden bg-white">

          <div className="overflow-x-auto">

            <Table>

              <TableHeader className="bg-slate-50">

                <TableRow>

                  <TableHead>Test Title</TableHead>

                  <TableHead>Course Name</TableHead>

                  <TableHead>Batch Name</TableHead>

                  <TableHead>Accuracy</TableHead>

                  <TableHead>Coloring</TableHead>

                  <TableHead>Creativity</TableHead>

                  <TableHead>Drawing</TableHead>

                  <TableHead>Max Marks</TableHead>

                  <TableHead>Neatness</TableHead>

                  <TableHead>Obtained</TableHead>

                  <TableHead>Performance</TableHead>

                  <TableHead>Remarks</TableHead>

                  <TableHead>Speed</TableHead>

                  <TableHead>Action</TableHead>

                </TableRow>

              </TableHeader>

              <TableBody>

                {records.map(record => (

                  <TableRow key={record.id} className="hover:bg-slate-50">

                    <TableCell className="font-medium">{record.testTitle}</TableCell>

                    <TableCell>{record.courseName}</TableCell>

                    <TableCell>{record.batchName}</TableCell>

                    <TableCell>{record.evaluation.accuracyMarks}</TableCell>

                    <TableCell>{record.evaluation.coloringMarks}</TableCell>

                    <TableCell>{record.evaluation.creativityMarks}</TableCell>

                    <TableCell>{record.evaluation.drawingMarks}</TableCell>

                    <TableCell>{record.evaluation.maxMarks}</TableCell>

                    <TableCell>{record.evaluation.neatnessMarks}</TableCell>

                    <TableCell>{record.evaluation.obtainedMarks}</TableCell>

                    <TableCell>{formatPercentage(record.evaluation.performancePercentage)}</TableCell>

                    <TableCell className="max-w-[200px] truncate">{record.evaluation.remarks || '—'}</TableCell>

                    <TableCell>{record.evaluation.speedMarks}</TableCell>

                    <TableCell>

                      <Button

                        size="sm"

                        variant="outline"

                        onClick={() => setSelectedImage(record.studentDrawingImage)}

                        disabled={!record.studentDrawingImage}

                      >

                        View

                      </Button>

                    </TableCell>

                  </TableRow>

                ))}

              </TableBody>

            </Table>

          </div>

        </div>

      )}

      {selectedImage && (

        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>

          <DialogContent className="max-w-4xl">

            <DialogHeader>

              <DialogTitle>Student Drawing</DialogTitle>

            </DialogHeader>

            <div className="flex items-center justify-center bg-slate-100 rounded-lg p-4 min-h-[400px]">

              <img

                src={selectedImage}

                alt="Student Drawing"

                className="max-w-full max-h-[600px] object-contain"

              />

            </div>

          </DialogContent>

        </Dialog>

      )}

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
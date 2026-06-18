"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DrawingTaskItem = {
  id: string;
  taskDate: string;
  taskName: string;
  batchName?: string;
  courseName?: string;
  createdAt: string;
};

type BatchItem = {
  id: string;
  batchName?: string;
  name?: string;
};

export default function DrawingTasksPage() {
  const [tasks, setTasks] = useState<DrawingTaskItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [batchId, setBatchId] = useState("");
  const router = useRouter();

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/drawing-tasks', { credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && Array.isArray(json.data?.tasks)) {
        setTasks(json.data.tasks);
      } else {
        setTasks([]);
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

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

  useEffect(() => {
    loadTasks();
    loadBatches();
  }, []);

  async function createTask() {
    if (!batchId) {
      return;
    }
    try {
      const batch = batches.find(b => b.id === batchId);
      const res = await fetch('/api/drawing-tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: name, taskDate: date, batchId, batchName: batch?.batchName || batch?.name || '' }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json.data?.id) {
        setOpen(false);
        setName('');
        setDate('');
        setBatchId('');
        router.push(`/teacher/drawing-tests/${json.data.id}`);
      }
    } catch (e) {
      console.error('Create task failed', e);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drawing Tasks"
        subtitle="Create and manage drawing assessment tasks"
        action={<Button className="rounded-xl gradient-primary text-white border-0" onClick={() => setOpen(true)}>Create Task</Button>}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.length === 0 && (
          <div className="card-soft p-10 text-center text-muted-foreground col-span-full">No Drawing Tasks Created<br />Create your first drawing assessment task to start collecting student submissions.</div>
        )}
        {tasks.map(t => (
          <button key={t.id} onClick={() => router.push(`/teacher/drawing-tests/${t.id}`)} className={cn('card-soft p-4 rounded-lg text-left hover:shadow-pop transition-shadow')}>
            <div className="text-sm text-muted-foreground">{new Date(t.taskDate).toLocaleDateString()}</div>
            <div className="font-display font-bold text-lg mt-2">{t.taskName}</div>
            {t.batchName ? <div className="text-sm font-medium text-slate-700 mt-1">{t.batchName}</div> : null}
            {t.courseName ? <div className="text-sm text-slate-500">{t.courseName}</div> : null}
            <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Submitted</div>
                <div className="font-semibold">—</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pending Review</div>
                <div className="font-semibold">—</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Reviewed</div>
                <div className="font-semibold">—</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">Created {new Date(t.createdAt).toLocaleString()}</div>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={o => setOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Task Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Batch</Label>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={batchId}
                onChange={e => setBatchId(e.target.value)}
              >
                <option value="">Select a batch</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchName || batch.name || `Batch ${batch.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Task Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createTask} className="gradient-primary text-white border-0">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


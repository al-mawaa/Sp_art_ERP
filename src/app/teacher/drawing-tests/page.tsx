"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DrawingTaskItem = {
  id: string;
  taskDate: string;
  taskName: string;
  batchName?: string;
  courseName?: string;
  createdAt: string;
  submittedCount?: number;
  pendingCount?: number;
  reviewedCount?: number;
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
  const [editingTask, setEditingTask] = useState<DrawingTaskItem | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
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

  function resetForm() {
    setEditingTask(null);
    setName('');
    setDate('');
    setBatchId('');
  }

  function openEditTask(task: DrawingTaskItem) {
    setEditingTask(task);
    setName(task.taskName);
    setDate(new Date(task.taskDate).toISOString().slice(0, 10));
    setBatchId(task.batchName ? batches.find(b => b.batchName === task.batchName || b.name === task.batchName)?.id ?? '' : '');
    setOpen(true);
  }

  async function createTask() {
    if (!batchId) {
      return;
    }
    try {
      const batch = batches.find(b => b.id === batchId);
      const url = editingTask ? `/api/drawing-tasks/${editingTask.id}` : '/api/drawing-tasks';
      const method = editingTask ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: name, taskDate: date, batchId, batchName: batch?.batchName || batch?.name || '' }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setOpen(false);
        await loadTasks();
        if (editingTask && editingTask.id) {
          setEditingTask(null);
        } else if (json.data?.id) {
          router.push(`/teacher/drawing-tests/${json.data.id}`);
        }
        resetForm();
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
          <div
            key={t.id}
            onClick={() => router.push(`/teacher/drawing-tests/${t.id}`)}
            role="button"
            tabIndex={0}
            className={cn('card-soft p-4 rounded-lg text-left hover:shadow-pop transition-shadow cursor-pointer')}
          >
            <div className="text-sm text-muted-foreground">{new Date(t.taskDate).toLocaleDateString()}</div>
            <div className="font-display font-bold text-lg mt-2">{t.taskName}</div>
            {t.batchName ? <div className="text-sm font-medium text-slate-700 mt-1">{t.batchName}</div> : null}
            {t.courseName ? <div className="text-sm text-slate-500">{t.courseName}</div> : null}
            <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Submitted</div>
                <div className="font-semibold">{t.submittedCount ?? 0}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pending Review</div>
                <div className="font-semibold">{t.pendingCount ?? 0}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Reviewed</div>
                <div className="font-semibold">{t.reviewedCount ?? 0}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between gap-3">
              <span>Created {new Date(t.createdAt).toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={e => {
                    e.stopPropagation();
                    openEditTask(t);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
                  onClick={e => {
                    e.stopPropagation();
                    setDeleteTaskId(t.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={o => {
        setOpen(o);
        if (!o) {
          resetForm();
          setEditingTask(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
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
            <Button variant="outline" onClick={() => {
              setOpen(false);
              resetForm();
            }}>Cancel</Button>
            <Button onClick={createTask} className="gradient-primary text-white border-0">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTaskId} onOpenChange={o => { if (!o) setDeleteTaskId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Are you sure you want to delete this drawing task? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskId(null)}>Cancel</Button>
            <Button
              className="bg-destructive text-white border-0 hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTaskId) return;
                try {
                  const res = await fetch(`/api/drawing-tasks/${deleteTaskId}`, { method: 'DELETE', credentials: 'include' });
                  const json = await res.json().catch(() => null);
                  if (res.ok && json?.success) {
                    setDeleteTaskId(null);
                    await loadTasks();
                  } else {
                    console.error('Delete task failed', res.status, json);
                  }
                } catch (err) {
                  console.error('Delete task error', err);
                }
              }}
            >Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


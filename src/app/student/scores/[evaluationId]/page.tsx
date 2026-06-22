"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

function ReadRow({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between items-center">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-mono font-bold">{v}/5</div>
    </div>
  );
}

export default function StudentScoreDetailPage({ params }: { params: Promise<{ evaluationId: string }> }) {
  const { evaluationId } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/student/evaluations/${encodeURIComponent(evaluationId)}`, { credentials: 'include' });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || `Failed to load (${res.status})`);
          setData(null);
        } else {
          if (mounted) setData(json.data);
        }
      } catch (e) {
        console.error(e);
        setError('Unable to load evaluation details');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [evaluationId]);

  if (loading) return (
    <div className="space-y-3 p-6">
      <div className="h-6 w-1/3 bg-muted/40 rounded-md animate-pulse" />
      <div className="h-48 bg-muted/40 rounded-lg animate-pulse" />
      <div className="h-6 w-1/2 bg-muted/40 rounded-md animate-pulse" />
    </div>
  );
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">No data</div>;

  const { evaluation, submission } = data;

  function openPreview(url: string | null) {
    setPreviewImage(url);
    setPreviewOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Drawing Assessment" subtitle={submission?.testTitle || 'Evaluation details'} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-2 space-y-3">
          <div className="rounded-2xl border border-border p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{submission?.testTitle || 'Drawing test'}</div>
                <div className="text-sm text-muted-foreground">Evaluated: {evaluation.evaluatedAt ?? '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{evaluation.obtainedMarks}/{evaluation.maxMarks}</div>
                <div className="text-sm text-muted-foreground">{evaluation.performancePercentage}%</div>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 mt-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Your submission</div>
                <button onClick={() => openPreview(submission?.studentDrawingImage ?? null)} className="w-full">
                  <img src={submission?.studentDrawingImage} alt="student" className="w-full h-72 object-cover rounded-lg border shadow-sm" />
                </button>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Teacher reference</div>
                <button onClick={() => openPreview(submission?.teacherDrawingImage ?? null)} className="w-full">
                  <img src={submission?.teacherDrawingImage} alt="teacher" className="w-full h-72 object-cover rounded-lg border shadow-sm" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4 bg-white shadow-sm">
            <div className="text-sm font-semibold mb-3">Detailed breakdown</div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <div className="p-3 rounded-lg border bg-muted/30">
                <ReadRow label="Drawing Quality" v={evaluation.drawingMarks} />
                <Progress value={(evaluation.drawingMarks / 5) * 100} />
                <div className="text-xs text-muted-foreground mt-1">{Math.round((evaluation.drawingMarks / 5) * 100)}%</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <ReadRow label="Coloring" v={evaluation.coloringMarks} />
                <Progress value={(evaluation.coloringMarks / 5) * 100} />
                <div className="text-xs text-muted-foreground mt-1">{Math.round((evaluation.coloringMarks / 5) * 100)}%</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <ReadRow label="Speed" v={evaluation.speedMarks} />
                <Progress value={(evaluation.speedMarks / 5) * 100} />
                <div className="text-xs text-muted-foreground mt-1">{Math.round((evaluation.speedMarks / 5) * 100)}%</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <ReadRow label="Neatness" v={evaluation.neatnessMarks} />
                <Progress value={(evaluation.neatnessMarks / 5) * 100} />
                <div className="text-xs text-muted-foreground mt-1">{Math.round((evaluation.neatnessMarks / 5) * 100)}%</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <ReadRow label="Creativity" v={evaluation.creativityMarks} />
                <Progress value={(evaluation.creativityMarks / 5) * 100} />
                <div className="text-xs text-muted-foreground mt-1">{Math.round((evaluation.creativityMarks / 5) * 100)}%</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <ReadRow label="Accuracy" v={evaluation.accuracyMarks} />
                <Progress value={(evaluation.accuracyMarks / 5) * 100} />
                <div className="text-xs text-muted-foreground mt-1">{Math.round((evaluation.accuracyMarks / 5) * 100)}%</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border p-4 bg-white shadow-sm">
            <div className="text-sm text-muted-foreground">Remarks</div>
            <div className="mt-2 text-sm">{evaluation.remarks || 'No remarks provided'}</div>
          </div>
          <div className="rounded-2xl border border-border p-4 bg-white shadow-sm">
            <Button onClick={() => window.history.back()}>Back</Button>
          </div>
        </aside>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle>{submission?.testTitle || 'Preview'}</DialogTitle>
          <div className="p-4 bg-black">
            {previewImage ? (
              <img src={previewImage} alt="preview" className="w-full h-[70vh] object-contain bg-black" />
            ) : (
              <div className="p-8 text-white">No image</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ZoomIn, ZoomOut, RotateCcw, Download, X } from 'lucide-react';
import { formatPercentage } from '@/lib/utils';

interface EvaluationData {
  id: string;
  taskId: string;
  submissionId: string;
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
}

interface SubmissionData {
  id: string;
  testTitle: string;
  teacherDrawingImage: string;
  studentDrawingImage: string;
  timeTaken: number;
}

interface PageData {
  evaluation: EvaluationData;
  submission: SubmissionData | null;
}

function ReadRow({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between items-center">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-mono font-bold">{v}/5</div>
    </div>
  );
}

interface ImageViewerState {
  isOpen: boolean;
  imageUrl: string | null;
  title: string;
  zoom: number;
}

export default function StudentScoreDetailPage({ params }: { params: Promise<{ evaluationId: string }> }) {
  const { evaluationId } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PageData | null>(null);
  const [viewer, setViewer] = useState<ImageViewerState>({
    isOpen: false,
    imageUrl: null,
    title: '',
    zoom: 1,
  });

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

  const openImageViewer = (imageUrl: string | null, title: string) => {
    setViewer({
      isOpen: true,
      imageUrl,
      title,
      zoom: 1,
    });
  };

  const closeImageViewer = () => {
    setViewer({
      ...viewer,
      isOpen: false,
      zoom: 1,
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setViewer((prev) => ({
      ...prev,
      zoom: direction === 'in'
        ? Math.min(prev.zoom + 0.25, 3)
        : Math.max(prev.zoom - 0.25, 0.25),
    }));
  };

  const handleResetZoom = () => {
    setViewer((prev) => ({ ...prev, zoom: 1 }));
  };


  const downloadImage = () => {
    if (!viewer.imageUrl) return;
    const link = document.createElement('a');
    link.href = viewer.imageUrl;
    link.download = viewer.title || 'image';
    link.click();
  };

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
  const evaluatedDate = evaluation.evaluatedAt 
    ? new Date(evaluation.evaluatedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : 'Not evaluated';

  return (
    <div className="space-y-6">
      {/* Header Section with Summary and Remarks */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Summary Card */}
        <div className="md:col-span-2 lg:col-span-2 rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{submission?.testTitle || 'Drawing test'}</h1>
              <p className="text-sm text-gray-600 mt-1">Evaluated: {evaluatedDate}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-4xl font-bold text-gray-900">{evaluation.obtainedMarks}/{evaluation.maxMarks}</div>
              <div className="text-lg text-gray-600 font-medium mt-1">{formatPercentage(Number(evaluation.performancePercentage))}</div>
            </div>
          </div>
        </div>

        {/* Remarks Card */}
        <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Remarks</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {evaluation.remarks || 'No remarks provided'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Column - Content */}
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          {/* Your Submission Section */}
          <div className="relative rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Your Submission</h2>
            </div>
            <button
              onClick={() => openImageViewer(submission?.studentDrawingImage ?? null, 'Student Submission')}
              className="absolute top-6 right-6 z-10 rounded-full bg-white/90 p-2 shadow-md transition hover:scale-110"
              title="Zoom Student Submission"
            >
              <ZoomIn size={18} className="text-gray-700" />
            </button>
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-slate-100">
              {submission?.studentDrawingImage ? (
                <img
                  src={submission.studentDrawingImage}
                  alt="Student submission"
                  className="w-full h-[400px] object-contain rounded-lg bg-slate-100"
                />
              ) : (
                <div className="flex h-[400px] items-center justify-center text-gray-500">
                  No image available
                </div>
              )}
            </div>
          </div>

          {/* Detailed Breakdown Section */}
          <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-6">Detailed breakdown</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Drawing Quality', value: evaluation.drawingMarks },
                { label: 'Coloring', value: evaluation.coloringMarks },
                { label: 'Speed', value: evaluation.speedMarks },
                { label: 'Neatness', value: evaluation.neatnessMarks },
                { label: 'Creativity', value: evaluation.creativityMarks },
                { label: 'Accuracy', value: evaluation.accuracyMarks },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex flex-col">
                  <div className="text-xs font-medium text-gray-700 mb-2">{item.label}</div>
                  <div className="font-bold text-gray-900 mb-2">{item.value}/5</div>
                  <Progress value={(item.value / 5) * 100} className="h-2 mb-2" />
                  <div className="text-xs text-gray-600">{Math.round((item.value / 5) * 100)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <aside className="space-y-6">
          {/* Back Button Card */}
          <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
            <Button 
              onClick={() => window.history.back()} 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
            >
              Back
            </Button>
          </div>
        </aside>
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={viewer.isOpen} onOpenChange={closeImageViewer}>
        <DialogContent className="max-w-5xl p-0 border-0 bg-black">
          <div className="bg-black">
            {/* Header with Controls */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <DialogTitle className="text-white">{viewer.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom('in')}
                  className="p-2 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                </button>
                <button
                  onClick={() => handleZoom('out')}
                  className="p-2 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
                  title="Reset Zoom"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={downloadImage}
                  className="p-2 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
                  title="Download"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={closeImageViewer}
                  className="p-2 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div className="flex items-center justify-center bg-black min-h-96 p-4 overflow-auto">
              {viewer.imageUrl ? (
                <div className="flex items-center justify-center">
                  <img 
                    src={viewer.imageUrl} 
                    alt={viewer.title} 
                    style={{
                      transform: `scale(${viewer.zoom})`,
                      transition: 'transform 0.2s ease-in-out',
                      maxWidth: '100%',
                      maxHeight: '70vh',
                    }}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="text-gray-500 text-center">
                  <p>No image available</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

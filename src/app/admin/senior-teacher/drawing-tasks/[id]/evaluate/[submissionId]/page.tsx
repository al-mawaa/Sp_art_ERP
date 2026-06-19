"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Maximize2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  badgeId: string;
  teacherName: string;
  batchName: string;
  courseName: string;
  taskName: string;
  taskDate: string;
  submissionDate: string;
  teacherImage: string;
  studentImage: string;
  timeTaken: number;
}

interface Evaluation {
  id: string;
  drawingMarks: number;
  coloringMarks: number;
  speedMarks: number;
  neatnessMarks: number;
  creativityMarks: number;
  accuracyMarks: number;
  remarks: string;
  performancePercentage: number;
  evaluatedAt: string;
}

const CRITERIA = [
  { key: "drawing", label: "Drawing Quality", maxMarks: 5 },
  { key: "coloring", label: "Coloring", maxMarks: 5 },
  { key: "speed", label: "Speed", maxMarks: 5 },
  { key: "neatness", label: "Neatness", maxMarks: 5 },
  { key: "creativity", label: "Creativity", maxMarks: 5 },
  { key: "accuracy", label: "Accuracy", maxMarks: 5 },
];

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;
  const submissionId = params?.submissionId as string;

  const pathname = usePathname();
  const basePath = pathname?.startsWith("/admin") ? "/admin/senior-teacher" : "/senior-teacher";

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [marks, setMarks] = useState({
    drawing: 0,
    coloring: 0,
    speed: 0,
    neatness: 0,
    creativity: 0,
    accuracy: 0,
  });

  const [remarks, setRemarks] = useState("");

  const loadSubmissionDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/senior-teacher/drawing-tasks/submissions/${submissionId}`, {
        credentials: "include",
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && json.data) {
        setSubmission(json.data.submission);

        if (json.data.evaluation) {
          const evaluation = json.data.evaluation as Evaluation;
          setMarks({
            drawing: evaluation.drawingMarks,
            coloring: evaluation.coloringMarks,
            speed: evaluation.speedMarks,
            neatness: evaluation.neatnessMarks,
            creativity: evaluation.creativityMarks,
            accuracy: evaluation.accuracyMarks,
          });
          setRemarks(evaluation.remarks);
        }
      }
    } catch (error) {
      console.error("Failed to load submission", error);
      toast.error("Unable to load submission details.");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (!submissionId) return;
    loadSubmissionDetails();
  }, [submissionId, loadSubmissionDetails]);

  const totalObtained = Object.values(marks).reduce((sum, value) => sum + value, 0);
  const totalMaximum = CRITERIA.reduce((sum, criterion) => sum + criterion.maxMarks, 0);
  const performancePercentage = totalMaximum ? (totalObtained / totalMaximum) * 100 : 0;

  async function handleSubmit() {
    if (Object.values(marks).some(value => value < 0 || value > 5)) {
      toast.error("All marks must be between 0 and 5");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/senior-teacher/drawing-tasks/submissions/${submissionId}/evaluate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drawingMarks: marks.drawing,
          coloringMarks: marks.coloring,
          speedMarks: marks.speed,
          neatnessMarks: marks.neatness,
          creativityMarks: marks.creativity,
          accuracyMarks: marks.accuracy,
          remarks,
        }),
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        toast.success("Evaluation submitted successfully!");
        setTimeout(() => {
          router.push(`${basePath}/drawing-tasks/${taskId}`);
        }, 1200);
      } else {
        toast.error(json?.error || "Failed to submit evaluation");
      }
    } catch (error) {
      console.error("Submission error", error);
      toast.error("Failed to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." subtitle="Fetching submission details..." />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-6">
        <PageHeader title="Submission Not Found" subtitle="The submission you're looking for doesn't exist." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push(`${basePath}/drawing-tasks/${taskId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title={`Evaluate ${submission.studentName}`}
        subtitle={`${submission.taskName} · ${submission.batchName} · ${submission.courseName}`}
      />

      <Card className="p-4 rounded-xl border border-border bg-slate-50">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Student Name</p>
            <p className="text-sm font-medium mt-1">{submission.studentName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Badge ID</p>
            <p className="text-sm font-medium mt-1">{submission.badgeId || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Teacher Name</p>
            <p className="text-sm font-medium mt-1">{submission.teacherName}</p>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Teacher Reference Drawing</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setZoomedImage(submission.teacherImage)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <a href={submission.teacherImage} download>
                <button type="button" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                  <Download className="w-4 h-4" />
                </button>
              </a>
            </div>
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-white">
            <img
              src={submission.teacherImage}
              alt="Teacher Drawing"
              className="w-full aspect-square object-contain"
            />
          </div>
          <p className="text-xs text-muted-foreground">By {submission.teacherName}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Student Submitted Drawing</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setZoomedImage(submission.studentImage)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <a href={submission.studentImage} download>
                <button type="button" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                  <Download className="w-4 h-4" />
                </button>
              </a>
            </div>
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-white">
            <img
              src={submission.studentImage}
              alt="Student Drawing"
              className="w-full aspect-square object-contain"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted by {submission.studentName} on {new Date(submission.submissionDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={zoomedImage} alt="Zoomed" className="w-full rounded-lg" />
          </div>
        </div>
      )}

      <Card className="p-6 rounded-xl border border-border">
        <h3 className="font-semibold text-lg mb-4">Evaluation Form</h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {CRITERIA.map(criterion => (
            <div key={criterion.key}>
              <Label htmlFor={criterion.key} className="text-sm font-medium">
                {criterion.label}
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id={criterion.key}
                  type="number"
                  min="0"
                  max={criterion.maxMarks}
                  value={marks[criterion.key as keyof typeof marks]}
                  onChange={e => {
                    const value = Math.max(0, Math.min(criterion.maxMarks, Number(e.target.value) || 0));
                    setMarks(prev => ({ ...prev, [criterion.key]: value }));
                  }}
                  className="w-16 rounded-lg"
                />
                <span className="text-xs text-muted-foreground">/ {criterion.maxMarks}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <Label htmlFor="remarks" className="text-sm font-medium">
            Overall Remarks
          </Label>
          <Textarea
            id="remarks"
            placeholder="Enter your evaluation remarks..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="mt-1.5 rounded-lg min-h-[100px]"
          />
        </div>
      </Card>

      <Card className="p-4 rounded-xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Live Score Calculation</h3>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
          {CRITERIA.map(criterion => (
            <div key={criterion.key} className="bg-white rounded-lg p-2 text-center border border-border">
              <p className="text-xs text-muted-foreground font-medium">{criterion.label}</p>
              <p className="text-lg font-bold text-blue-600">{marks[criterion.key as keyof typeof marks]}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Obtained Marks</p>
            <p className="text-2xl font-bold">{totalObtained}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Maximum Marks</p>
            <p className="text-2xl font-bold">{totalMaximum}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Performance</p>
            <p className="text-2xl font-bold text-blue-600">{performancePercentage.toFixed(2)}%</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="bg-white rounded-full h-2 overflow-hidden border border-border">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${Math.min(performancePercentage, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push(`${basePath}/drawing-tasks/${taskId}`)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} className="gradient-primary text-white border-0">
          {submitting ? "Submitting..." : "Submit Evaluation"}
        </Button>
      </div>
    </div>
  );
}

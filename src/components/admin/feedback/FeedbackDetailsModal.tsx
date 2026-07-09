"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Star, User, GraduationCap, Calendar, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/shared/StatusPill";

type FeedbackItem = {
  id: string;
  studentName: string;
  studentId: string | null;
  teacherName: string;
  courseName: string;
  batchName: string;
  category: string;
  teachingRating: number;
  communicationRating: number;
  behaviourRating: number;
  knowledgeRating: number;
  practicalRating: number;
  overallRating: number;
  subject: string;
  message: string;
  status: "Submitted" | "Reviewed" | "Closed";
  adminRemark?: string;
  submittedDate: string;
};

export function FeedbackDetailsModal({
  isOpen,
  onClose,
  feedback,
  onUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  feedback: FeedbackItem;
  onUpdate: () => void;
}) {
  const [status, setStatus] = useState(feedback.status);
  const [adminRemark, setAdminRemark] = useState(feedback.adminRemark || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminRemark }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update");
      
      toast.success("Feedback updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error updating feedback");
    } finally {
      setSaving(false);
    }
  };

  const RatingRow = ({ label, rating }: { label: string; rating: number }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              rating >= star ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mt-2">
            <DialogTitle className="text-xl">Feedback Details</DialogTitle>
            <StatusPill status={feedback.status} />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Info Section */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Student</div>
                  <div className="font-medium">{feedback.studentName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Teacher</div>
                  <div className="font-medium">{feedback.teacherName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Course & Batch</div>
                  <div className="font-medium">{feedback.courseName} <span className="text-slate-400 font-normal">({feedback.batchName})</span></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Submitted</div>
                  <div className="font-medium">{format(new Date(feedback.submittedDate), "PPp")}</div>
                </div>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="font-medium text-sm">Update Status</h4>
              <Select value={status} onValueChange={(val: string) => setStatus(val as "Submitted" | "Reviewed" | "Closed")}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <h4 className="font-medium text-sm mt-4">Internal Remarks</h4>
              <Textarea
                placeholder="Add notes for admins..."
                value={adminRemark}
                onChange={(e) => setAdminRemark(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          {/* Feedback Section */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="mb-2">
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-semibold uppercase">{feedback.category}</span>
              </div>
              <h3 className="font-semibold text-lg text-slate-900">{feedback.subject}</h3>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                "{feedback.message}"
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold text-sm mb-3 text-slate-800">Ratings</h4>
              <RatingRow label="Teaching Quality" rating={feedback.teachingRating} />
              <RatingRow label="Communication" rating={feedback.communicationRating} />
              <RatingRow label="Behaviour" rating={feedback.behaviourRating} />
              <RatingRow label="Knowledge" rating={feedback.knowledgeRating} />
              <RatingRow label="Practical Guidance" rating={feedback.practicalRating} />
              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-violet-700">Overall Rating</span>
                <div className="flex gap-1 items-center">
                  <span className="font-bold text-lg">{feedback.overallRating}</span>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-slate-900">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

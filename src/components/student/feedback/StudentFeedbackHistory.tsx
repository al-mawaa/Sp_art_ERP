"use client";

import { useState, useEffect } from "react";
import { Loader2, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { StatusPill } from "@/components/shared/StatusPill";

type FeedbackHistoryItem = {
  id: string;
  teacherName: string;
  courseName: string;
  batchName: string;
  category: string;
  overallRating: number;
  status: "Submitted" | "Reviewed" | "Closed";
  submittedDate: string;
};

export function StudentFeedbackHistory() {
  const [history, setHistory] = useState<FeedbackHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/student/feedback");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load history");
        if (json.success) {
          setHistory(json.history);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error loading history");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
        You haven't submitted any feedback yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-4 py-3 rounded-tl-xl">Date</th>
            <th className="px-4 py-3">Teacher</th>
            <th className="px-4 py-3">Course / Batch</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-center">Rating</th>
            <th className="px-4 py-3 rounded-tr-xl">Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                {format(new Date(item.submittedDate), "MMM dd, yyyy")}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{item.teacherName}</td>
              <td className="px-4 py-3 text-slate-600">
                <div className="font-medium">{item.courseName}</div>
                <div className="text-xs opacity-75">{item.batchName}</div>
              </td>
              <td className="px-4 py-3 text-slate-600">{item.category}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md w-fit mx-auto border border-yellow-100">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold">{item.overallRating}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusPill status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

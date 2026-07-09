"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, Trash2, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/shared/StatusPill";
import { FeedbackDetailsModal } from "./FeedbackDetailsModal";

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

export function AdminFeedbackList({ onStatusChange }: { onStatusChange: () => void }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/feedback?";
      if (categoryFilter !== "all") url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (statusFilter !== "all") url += `status=${encodeURIComponent(statusFilter)}&`;
      
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.success) {
        setFeedbacks(json.feedbacks);
      } else {
        throw new Error(json.error || "Failed to load feedbacks");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error loading feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete");
      
      toast.success("Feedback deleted");
      loadFeedbacks();
      onStatusChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error deleting feedback");
    }
  };

  const handleStatusChangeAction = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update status");
      
      toast.success("Status updated");
      loadFeedbacks();
      onStatusChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error updating status");
    }
  };

  const handleView = (f: FeedbackItem) => {
    setSelectedFeedback(f);
    setIsModalOpen(true);
  };

  // Client-side search filtering
  const filteredFeedbacks = feedbacks.filter((f) => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return (
      f.studentName.toLowerCase().includes(lowerQ) ||
      f.teacherName.toLowerCase().includes(lowerQ) ||
      f.subject.toLowerCase().includes(lowerQ) ||
      f.courseName.toLowerCase().includes(lowerQ)
    );
  });

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search student, teacher, or subject..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span>{categoryFilter === "all" ? "All Categories" : categoryFilter}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Teaching Quality">Teaching Quality</SelectItem>
              <SelectItem value="Communication">Communication</SelectItem>
              <SelectItem value="Behaviour">Behaviour</SelectItem>
              <SelectItem value="Time Management">Time Management</SelectItem>
              <SelectItem value="Classroom Management">Classroom Management</SelectItem>
              <SelectItem value="Overall Experience">Overall Experience</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center p-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
          No feedback found matching your criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Course / Batch</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {format(new Date(f.submittedDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{f.studentName}</td>
                  <td className="px-4 py-3 text-slate-700">{f.teacherName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="font-medium">{f.courseName}</div>
                    <div className="text-xs opacity-75">{f.batchName}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.category}</td>
                  <td className="px-4 py-3 text-center font-semibold text-yellow-600">
                    {f.overallRating} / 5
                  </td>
                  <td className="px-4 py-3">
                    <Select value={f.status} onValueChange={(val) => handleStatusChangeAction(f.id, val)}>
                      <SelectTrigger className={`w-[120px] h-8 text-xs font-medium border-0 ${
                        f.status === "Closed" ? "bg-slate-100 text-slate-600" :
                        f.status === "Reviewed" ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Reviewed">Reviewed</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(f)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedFeedback && (
        <FeedbackDetailsModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          feedback={selectedFeedback}
          onUpdate={() => {
            loadFeedbacks();
            onStatusChange();
          }}
        />
      )}
    </div>
  );
}

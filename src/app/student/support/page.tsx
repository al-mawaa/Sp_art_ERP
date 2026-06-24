"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageSquarePlus, HelpCircle, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryStatusBadge } from "@/components/student/QueryStatusBadge";
import { StudentQueryRequestModal } from "@/components/student/StudentQueryRequestModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { StudentQueryDto } from "@/lib/student/studentQueryAccess";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StudentSupportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [queries, setQueries] = useState<StudentQueryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryOpen, setQueryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const loadQueries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/queries", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load queries");
      }
      setQueries(data.data.queries || []);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueries();
  }, []);

  const filteredQueries = queries.filter(query => {
    const matchesSearch = 
      query.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || query.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      profile_correction: "Profile Correction",
      switch_batch: "Switch Batch",
      course_change: "Course Change",
      fee_related: "Fee Related",
      attendance_correction: "Attendance Correction",
      other: "Other",
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
        Loading support queries…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto min-h-screen pb-10">
      <PageHeader 
        title="Support" 
        subtitle="View and manage your support queries"
        action={
          <Button
            variant="outline"
            className="rounded-xl border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => setQueryOpen(true)}
          >
            <MessageSquarePlus className="w-4 h-4 mr-1" /> New Query
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v: "all" | "pending" | "approved" | "rejected") => setStatusFilter(v)}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Query List */}
      {filteredQueries.length === 0 ? (
        <div className="text-center py-16">
          <HelpCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No queries found</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "You haven't submitted any support queries yet"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button
              variant="outline"
              className="rounded-xl border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => setQueryOpen(true)}
            >
              <MessageSquarePlus className="w-4 h-4 mr-1" /> Submit Your First Query
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map((query) => (
            <div
              key={query.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {getCategoryLabel(query.category)}
                    </span>
                    <QueryStatusBadge status={query.status} />
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{query.remarks}</p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  <div>Submitted: {formatDate(query.createdAt)}</div>
                  {query.updatedAt !== query.createdAt && (
                    <div>Updated: {formatDate(query.updatedAt)}</div>
                  )}
                </div>
              </div>

              {query.adminRemark && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Admin Remarks:</div>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{query.adminRemark}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <StudentQueryRequestModal
        open={queryOpen}
        onOpenChange={setQueryOpen}
        defaultName={user?.name || ""}
        defaultEmail={user?.email || ""}
        onSubmitted={() => {
          void loadQueries();
        }}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, Search, X, FileText, Download, ExternalLink, Trash2, CalendarX2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { StatusPill } from "@/components/shared/StatusPill";
import { StaffTypeBadge, type LeaveStaffType } from "@/components/leave/StaffTypeBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { batchFetch } from "@/lib/batch/batchFetch";
import { clearAdminSessionToken } from "@/lib/auth/admin-session-client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { messageFromUnknown } from "@/lib/errors/messageFromUnknown";
import { leaveStatusPillClass } from "@/lib/leave/leaveStatusStyles";

type LeaveRow = {
  id: string;
  staffType: LeaveStaffType;
  staffName: string;
  leaveType: string;
  from: string;
  to: string;
  reason: string;
  status: string;
  adminRemark: string;
  daysCount: number;
  documentUrl?: string;
  documentName?: string;
  documentType?: string;
  createdAt?: string;
};

function patchPath(row: LeaveRow) {
  return row.staffType === "senior_teacher"
    ? `/api/admin/leaves/senior-teacher/${row.id}`
    : `/api/admin/leaves/${row.id}`;
}

type ApiLeave = {
  id: string;
  teacherName?: string;
  seniorTeacherName?: string;
  leaveType: string;
  from: string;
  to: string;
  reason: string;
  status: string;
  adminRemark: string;
  daysCount: number;
  documentUrl?: string;
  documentName?: string;
  documentType?: string;
  createdAt?: string;
};

export function AdminLeavesPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Basic Search
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Advanced Filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterStaff, setFilterStaff] = useState<"All" | LeaveStaffType>("All");
  const [filterType, setFilterType] = useState("All");
  const [filterDocument, setFilterDocument] = useState("All");
  const [dateFilterType, setDateFilterType] = useState("Applied"); // Applied, Start, End
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("Newest");

  // Selections
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // UI Modals
  const [detail, setDetail] = useState<LeaveRow | null>(null);
  const [documentPreview, setDocumentPreview] = useState<LeaveRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    leave: LeaveRow;
    action: "approve" | "reject";
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ leave: LeaveRow } | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [remark, setRemark] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teacherRes, seniorRes] = await Promise.all([
        batchFetch(`/api/admin/leaves`),
        batchFetch(`/api/admin/leaves/senior-teacher`),
      ]);

      if (teacherRes.status === 401 || seniorRes.status === 401) {
        clearAdminSessionToken();
        logout();
        toast.error("Admin session expired. Please sign in again.");
        router.replace("/login");
        return;
      }

      const teacherJson = await parseJsonResponse<{ error?: string; data?: { leaves: ApiLeave[] } }>(teacherRes);
      const seniorJson = await parseJsonResponse<{ error?: string; data?: { leaves: ApiLeave[] } }>(seniorRes);

      if (!teacherRes.ok) throw new Error(teacherJson.error || "Failed to load teacher leaves");
      if (!seniorRes.ok) throw new Error(seniorJson.error || "Failed to load senior teacher leaves");

      const teacherRows: LeaveRow[] = (teacherJson.data?.leaves ?? []).map((l) => ({
        id: l.id,
        staffType: "teacher" as const,
        staffName: l.teacherName!,
        leaveType: l.leaveType,
        from: l.from,
        to: l.to,
        reason: l.reason,
        status: l.status,
        adminRemark: l.adminRemark,
        daysCount: l.daysCount,
        documentUrl: l.documentUrl,
        documentName: l.documentName,
        documentType: l.documentType,
        createdAt: l.createdAt,
      }));

      const seniorRows: LeaveRow[] = (seniorJson.data?.leaves ?? []).map((l) => ({
        id: l.id,
        staffType: "senior_teacher" as const,
        staffName: l.seniorTeacherName!,
        leaveType: l.leaveType,
        from: l.from,
        to: l.to,
        reason: l.reason,
        status: l.status,
        adminRemark: l.adminRemark,
        daysCount: l.daysCount,
        documentUrl: l.documentUrl,
        documentName: l.documentName,
        documentType: l.documentType,
        createdAt: l.createdAt,
      }));

      setRows([...teacherRows, ...seniorRows]);
      setSelectedIds(new Set());
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to load leave requests"));
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRows = useMemo(() => {
    let filtered = rows;

    // Advanced Filters
    if (filterStatus !== "All") filtered = filtered.filter(r => r.status === filterStatus);
    if (filterStaff !== "All") filtered = filtered.filter(r => r.staffType === filterStaff);
    if (filterType !== "All") filtered = filtered.filter(r => r.leaveType === filterType);
    if (filterDocument === "Yes") filtered = filtered.filter(r => !!r.documentUrl);
    if (filterDocument === "No") filtered = filtered.filter(r => !r.documentUrl);

    // Date Filters
    if (dateFrom || dateTo) {
      const dFrom = dateFrom ? new Date(dateFrom).getTime() : 0;
      const dTo = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity; // Include end of day
      
      filtered = filtered.filter(r => {
        let t = 0;
        if (dateFilterType === "Applied" && r.createdAt) t = new Date(r.createdAt).getTime();
        if (dateFilterType === "Start" && r.from) t = new Date(r.from).getTime();
        if (dateFilterType === "End" && r.to) t = new Date(r.to).getTime();
        return t >= dFrom && t <= dTo;
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        r =>
          r.staffName.toLowerCase().includes(q) ||
          r.leaveType.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.from.includes(q) ||
          r.to.includes(q),
      );
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const fa = new Date(a.from).getTime();
      const fb = new Date(b.from).getTime();

      switch (sortBy) {
        case "Newest": return cb - ca;
        case "Oldest": return ca - cb;
        case "PendingFirst": 
          if (a.status === "Pending" && b.status !== "Pending") return -1;
          if (b.status === "Pending" && a.status !== "Pending") return 1;
          return cb - ca;
        case "ApprovedFirst":
          if (a.status === "Approved" && b.status !== "Approved") return -1;
          if (b.status === "Approved" && a.status !== "Approved") return 1;
          return cb - ca;
        case "RejectedFirst":
          if (a.status === "Rejected" && b.status !== "Rejected") return -1;
          if (b.status === "Rejected" && a.status !== "Rejected") return 1;
          return cb - ca;
        case "LeaveDate":
          return fa - fb;
        default: return cb - ca;
      }
    });

    return filtered;
  }, [rows, filterStaff, filterStatus, filterType, filterDocument, dateFilterType, dateFrom, dateTo, searchQuery, sortBy]);

  const applySearch = () => setSearchQuery(searchInput.trim());
  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(visibleRows.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const runAction = async () => {
    if (!confirmAction) return;
    setProcessing(true);
    try {
      const res = await batchFetch(patchPath(confirmAction.leave), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: confirmAction.action, adminRemark: remark }),
      });
      const json = await parseJsonResponse<{ error?: string; message?: string }>(res);
      if (!res.ok) throw new Error(json.error || "Update failed");
      toast.success(json.message || `Leave ${confirmAction.action === "approve" ? "approved" : "rejected"}`);
      setConfirmAction(null);
      setRemark("");
      setDetail(null);
      void load();
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to update leave"));
    } finally {
      setProcessing(false);
    }
  };

  const deleteSingle = async () => {
    if (!confirmDelete) return;
    setProcessing(true);
    try {
      const res = await batchFetch(patchPath(confirmDelete.leave), { method: "DELETE" });
      const json = await parseJsonResponse<{ error?: string; message?: string }>(res);
      if (!res.ok) throw new Error(json.error || "Delete failed");
      toast.success("Leave request deleted");
      setConfirmDelete(null);
      void load();
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to delete leave"));
    } finally {
      setProcessing(false);
    }
  };

  const deleteBulk = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    try {
      const items = Array.from(selectedIds).map(id => {
        const row = rows.find(r => r.id === id);
        return { id, staffType: row?.staffType };
      }).filter(i => i.staffType);

      const res = await batchFetch("/api/admin/leaves/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await parseJsonResponse<{ error?: string; message?: string }>(res);
      if (!res.ok) throw new Error(json.error || "Bulk delete failed");
      toast.success(json.message || "Selected leaves deleted");
      setConfirmBulkDelete(false);
      setSelectedIds(new Set());
      void load();
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to delete leaves"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Review, approve, and manage leave requests securely"
      />

      <div className="card-soft p-5 flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[260px]">
            <Label className="text-xs text-muted-foreground font-medium mb-1.5 block">Search</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="rounded-xl pl-9 bg-muted/20 focus-visible:bg-background transition-colors border-border/60"
                  placeholder="Search by name, reason, dates…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") applySearch();
                  }}
                />
              </div>
              <Button type="button" className="rounded-xl gradient-primary text-white border-0 shadow-md hover:shadow-lg transition-all" onClick={applySearch}>
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
              {searchQuery && (
                <Button type="button" variant="outline" className="rounded-xl" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          <div className="w-[180px]">
            <Label className="text-xs text-muted-foreground font-medium mb-1.5 block">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="rounded-xl bg-muted/20 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Newest">Newest First</SelectItem>
                <SelectItem value="Oldest">Oldest First</SelectItem>
                <SelectItem value="PendingFirst">Pending First</SelectItem>
                <SelectItem value="ApprovedFirst">Approved First</SelectItem>
                <SelectItem value="RejectedFirst">Rejected First</SelectItem>
                <SelectItem value="LeaveDate">Leave Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-border/40">
          <div className="w-[140px]">
            <Label className="text-xs text-muted-foreground font-medium mb-1.5 block">Staff Type</Label>
            <Select value={filterStaff} onValueChange={v => setFilterStaff(v as "All" | LeaveStaffType)}>
              <SelectTrigger className="rounded-xl bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Staff</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="senior_teacher">Senior Teachers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Label className="text-xs text-muted-foreground font-medium mb-1.5 block">Leave Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="rounded-xl bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Sick">Sick</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Label className="text-xs text-muted-foreground font-medium mb-1.5 block">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="rounded-xl bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Label className="text-xs text-muted-foreground font-medium mb-1.5 block">Has Document</Label>
            <Select value={filterDocument} onValueChange={setFilterDocument}>
              <SelectTrigger className="rounded-xl bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Any</SelectItem>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Label className="text-xs text-muted-foreground font-medium mb-1.5 block">Date Filter By</Label>
            <Select value={dateFilterType} onValueChange={setDateFilterType}>
              <SelectTrigger className="rounded-xl bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Applied">Applied Date</SelectItem>
                <SelectItem value="Start">Start Date</SelectItem>
                <SelectItem value="End">End Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Label className="text-xs text-muted-foreground font-medium mb-1.5 block">From Date</Label>
            <Input type="date" className="rounded-xl bg-muted/20 border-border/60 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="w-[140px]">
            <Label className="text-xs text-muted-foreground font-medium mb-1.5 block">To Date</Label>
            <Input type="date" className="rounded-xl bg-muted/20 border-border/60 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <Checkbox 
            id="selectAll" 
            className="w-5 h-5 rounded-md"
            checked={visibleRows.length > 0 && selectedIds.size === visibleRows.length} 
            onCheckedChange={toggleSelectAll} 
          />
          <Label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
            Select All ({visibleRows.length})
          </Label>
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-4 bg-muted/50 px-4 py-2 rounded-xl border border-border/50 animate-in fade-in zoom-in-95">
            <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
            <Button size="sm" variant="destructive" className="rounded-lg shadow-sm" onClick={() => setConfirmBulkDelete(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="card-soft flex flex-col items-center justify-center p-16 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <CalendarX2 className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No leave requests found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {searchQuery || dateFrom || filterStatus !== "All" 
              ? "Try adjusting your filters or search terms to find what you're looking for." 
              : "There are currently no leave requests in the system."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleRows.map(l => {
            const isSelected = selectedIds.has(l.id);
            return (
              <div 
                key={`${l.staffType}-${l.id}`} 
                className={`card-soft flex flex-col gap-4 h-full transition-all duration-200 border-2 ${isSelected ? "border-primary/60 shadow-md bg-primary/[0.02]" : "border-transparent hover:border-border/60 hover:shadow-md"}`}
              >
                <div className="p-5 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        className="w-5 h-5 rounded-md mt-1" 
                        checked={isSelected}
                        onCheckedChange={(c) => toggleSelect(l.id, !!c)}
                      />
                      <Avatar name={l.staffName} size={42} />
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <StaffTypeBadge staffType={l.staffType} />
                        </div>
                        <h4 className="font-semibold leading-none">{l.staffName}</h4>
                      </div>
                    </div>
                    <StatusPill status={l.status} className={leaveStatusPillClass(l.status)} />
                  </div>
                </div>

                <div className="px-5 flex-1 text-sm space-y-3">
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Leave Type</span>
                        <span className="font-medium">{l.leaveType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Duration</span>
                        <span className="font-medium">{l.daysCount} day{l.daysCount === 1 ? "" : "s"}</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-muted-foreground block mb-0.5">Dates</span>
                        <span className="font-medium text-[13px]">{l.from} <span className="text-muted-foreground font-normal mx-1">to</span> {l.to}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <span className="text-muted-foreground font-medium text-xs block mb-1">Reason</span>
                    <p className="text-foreground/90 leading-relaxed line-clamp-2" title={l.reason}>
                      {l.reason || <span className="italic text-muted-foreground">No reason provided</span>}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/10 border-t border-border/40 rounded-b-2xl flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg h-8 px-3" onClick={() => setDetail(l)}>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                  </Button>
                  
                  {l.documentUrl && (
                    <Button variant="outline" size="sm" className="rounded-lg h-8 px-3" asChild>
                      <a href={`/api/view-pdf?url=${encodeURIComponent(l.documentUrl)}`} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Doc
                      </a>
                    </Button>
                  )}
                  
                  <div className="flex-1" />

                  {l.status === "Pending" && (
                    <>
                      <Button
                        size="sm"
                        className="rounded-lg h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => { setRemark(""); setConfirmAction({ leave: l, action: "approve" }); }}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setRemark(""); setConfirmAction({ leave: l, action: "reject" }); }}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 ml-1"
                    onClick={() => setConfirmDelete({ leave: l })}
                    title="Delete Leave"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Single Modal */}
      <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Leave Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this leave request for <strong className="text-foreground">{confirmDelete?.leave.staffName}</strong>? 
              This action cannot be undone and will permanently remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700 text-white" disabled={processing} onClick={e => { e.preventDefault(); void deleteSingle(); }}>
              {processing ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Modal */}
      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Multiple Records
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the <strong>{selectedIds.size} selected</strong> leave requests? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700 text-white" disabled={processing} onClick={e => { e.preventDefault(); void deleteBulk(); }}>
              {processing ? "Deleting..." : "Delete All Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve/Reject Modal */}
      <AlertDialog open={!!confirmAction} onOpenChange={o => !o && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "approve" ? "Approve leave request?" : "Reject leave request?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {confirmAction ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <StaffTypeBadge staffType={confirmAction.leave.staffType} />
                      <span className="font-medium text-foreground">{confirmAction.leave.staffName}</span>
                    </div>
                    <p>{confirmAction.leave.leaveType} — {confirmAction.leave.from} to {confirmAction.leave.to}.</p>
                  </>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Remarks (optional)</Label>
            <Textarea className="rounded-xl mt-1" rows={2} value={remark} onChange={e => setRemark(e.target.value)} placeholder="Note for the staff member…" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.action === "approve" ? "rounded-xl bg-emerald-600 hover:bg-emerald-700" : "rounded-xl bg-red-600 hover:bg-red-700"}
              disabled={processing}
              onClick={e => { e.preventDefault(); void runAction(); }}
            >
              {processing ? "Saving…" : confirmAction?.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Modal */}
      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Details</DialogTitle>
          </DialogHeader>
          {detail && (
            <dl className="text-sm space-y-3 pt-2">
              <div className="flex justify-between gap-2 items-center">
                <dt className="text-muted-foreground font-medium">Staff</dt>
                <dd className="flex flex-col items-end gap-1">
                  <StaffTypeBadge staffType={detail.staffType} />
                  <span className="font-medium">{detail.staffName}</span>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground font-medium">Type</dt>
                <dd className="font-medium">{detail.leaveType}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground font-medium">Dates</dt>
                <dd className="font-medium">{detail.from} → {detail.to} <span className="text-muted-foreground ml-1">({detail.daysCount} days)</span></dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium mb-1">Reason</dt>
                <dd className="bg-muted/30 p-3 rounded-lg leading-relaxed">{detail.reason || <span className="italic">No reason provided</span>}</dd>
              </div>
              <div className="flex justify-between gap-2 items-center pt-2 border-t border-border/40">
                <dt className="text-muted-foreground font-medium">Status</dt>
                <dd><StatusPill status={detail.status} className={leaveStatusPillClass(detail.status)} /></dd>
              </div>
              {detail.adminRemark && (
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Admin remarks</dt>
                  <dd className="bg-muted/30 p-3 rounded-lg">{detail.adminRemark}</dd>
                </div>
              )}
              {detail.documentUrl && (
                <div className="flex justify-between gap-2 items-center pt-2 border-t border-border/40">
                  <dt className="text-muted-foreground font-medium">Attached Document</dt>
                  <dd>
                    <Button variant="link" className="p-0 h-auto text-primary" asChild>
                      <a href={`/api/view-pdf?url=${encodeURIComponent(detail.documentUrl)}`} target="_blank" rel="noopener noreferrer">
                        {detail.documentName || "View Document"}
                      </a>
                    </Button>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, X as XIcon, FileText, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { messageFromUnknown } from "@/lib/errors/messageFromUnknown";
import { leaveStatusPillClass } from "@/lib/leave/leaveStatusStyles";

type LeaveRow = {
  id: string;
  type: string;
  from: string;
  to: string;
  reason: string;
  status: string;
  adminRemark?: string;
};

type Balance = { casual: number; sick: number; personal: number };

const BALANCE_UI = [
  { k: "Casual", key: "casual" as const, c: "text-info" },
  { k: "Sick", key: "sick" as const, c: "text-success" },
  { k: "Personal", key: "personal" as const, c: "text-secondary" },
];

export type LeaveApplyPageConfig = {
  apiPath: string;
  loginRoleLabel: string;
  title?: string;
  subtitle?: string;
};

export function LeaveApplyPage({
  apiPath,
  loginRoleLabel,
  title = "My Leaves",
  subtitle = "Apply and track",
}: LeaveApplyPageConfig) {
  const router = useRouter();
  const [form, setForm] = useState({ type: "Casual", from: "", to: "", reason: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRow[]>([]);
  const [balance, setBalance] = useState<Balance>({ casual: 6, sick: 8, personal: 3 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleAuthError = useCallback((res: Response) => {
    if (res.status === 401) {
      toast.error(`Please sign in again as ${loginRoleLabel}.`);
      router.push("/login");
      return true;
    }
    return false;
  }, [loginRoleLabel, router]);

  const deleteLeave = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this leave request?")) return;
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (handleAuthError(res)) return;
      const json = await parseJsonResponse<{ error?: string; message?: string }>(res);
      if (!res.ok) throw new Error(json.error || "Failed to delete");
      toast.success(json.message || "Leave deleted successfully");
      void load();
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to delete leave"));
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath, { credentials: "include" });
      if (handleAuthError(res)) return;
      const json = await parseJsonResponse<{
        error?: string;
        data?: { leaves: LeaveRow[]; balance: Balance };
      }>(res);
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setLeaveRequests(json.data?.leaves ?? []);
      if (json.data?.balance) setBalance(json.data.balance);
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to load leave data"));
    } finally {
      setLoading(false);
    }
  }, [apiPath, handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <div className="card-soft p-5">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Leave balance</div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {BALANCE_UI.map(b => (
                  <div
                    key={b.k}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40"
                  >
                    <span className="font-semibold text-sm">{b.k}</span>
                    <span className={`font-display font-bold text-xl ${b.c}`}>{balance[b.key]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 card-soft p-5">
          <h3 className="font-display font-bold mb-3">Apply for leave</h3>
          <form
            className="space-y-3"
            onSubmit={async e => {
              e.preventDefault();
              if (!form.from || !form.to) {
                toast.error("Pick dates");
                return;
              }
              setSubmitting(true);
              try {
                let documentUrl = "";
                let documentName = "";
                let documentType = "";

                if (selectedFile) {
                  const formData = new FormData();
                  formData.append("file", selectedFile);
                  formData.append("folder", "leaves");
                  const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                  });
                  if (!uploadRes.ok) {
                    const uploadErr = await uploadRes.json();
                    throw new Error(uploadErr.error || "Failed to upload document");
                  }
                  const uploadData = await uploadRes.json();
                  documentUrl = uploadData.url;
                  documentName = selectedFile.name;
                  documentType = "application/pdf";
                }

                const res = await fetch(apiPath, {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    leaveType: form.type,
                    fromDate: form.from,
                    toDate: form.to,
                    reason: form.reason,
                    ...(documentUrl ? { documentUrl, documentName, documentType } : {}),
                  }),
                });
                if (handleAuthError(res)) return;
                const json = await parseJsonResponse<{ error?: string; message?: string }>(res);
                if (!res.ok) throw new Error(json.error || "Submit failed");
                toast.success(json.message || "Leave request submitted!");
                setForm({ type: "Casual", from: "", to: "", reason: "" });
                setSelectedFile(null);
                void load();
              } catch (err) {
                toast.error(messageFromUnknown(err, "Failed to submit leave"));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={form.from}
                  onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={form.to}
                  onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea
                rows={3}
                className="rounded-xl"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Supporting Document (Optional)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  id="document-upload"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.type !== "application/pdf") {
                      toast.error("Only PDF files are allowed.");
                      e.target.value = "";
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("File size must be less than 5MB.");
                      e.target.value = "";
                      return;
                    }
                    setSelectedFile(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => document.getElementById("document-upload")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Browse PDF
                </Button>
                {selectedFile && (
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border text-sm max-w-full">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-red-500 transition-colors ml-1 shrink-0"
                      onClick={() => setSelectedFile(null)}
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <LoadingButton
              type="submit"
              isLoading={submitting}
              loadingText="Submitting..."
              className="w-full rounded-xl gradient-primary text-white border-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              Submit
            </LoadingButton>
          </form>
        </div>
      </div>

      <div>
        <h3 className="font-display font-bold text-lg mb-3">Leave history</h3>
        <div className="card-soft overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">No leave requests yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">From</th>
                  <th className="px-3 py-2 text-left">To</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map(l => (
                  <tr key={l.id} className="border-t border-border/60">
                    <td className="px-3 py-2">{l.type}</td>
                    <td className="px-3 py-2">{l.from}</td>
                    <td className="px-3 py-2">{l.to}</td>
                    <td className="px-3 py-2">{l.reason}</td>
                    <td className="px-3 py-2">
                      <StatusPill status={l.status} className={leaveStatusPillClass(l.status)} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {l.status === "Pending" && (
                        <LoadingButton
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => deleteLeave(l.id)}
                          isLoading={false}
                          loadingText="Deleting..."
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </LoadingButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
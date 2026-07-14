"use client";

import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle2, XCircle, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function InventoryRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionModal, setActionModal] = useState<"approve" | "reject" | "issue" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/inventory/requests");
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (e) {
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async () => {
    if (!selectedRequest || !actionModal) return;
    
    // Map action to status
    let status = "";
    if (actionModal === "approve") status = "Approved";
    else if (actionModal === "reject") status = "Rejected";
    else if (actionModal === "issue") status = "Issued";

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/requests/${selectedRequest._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Request ${status} successfully`);
        setActionModal(null);
        setSelectedRequest(null);
        setRemarks("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to update request");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { 
      key: "requester", 
      header: "Requester", 
      render: (r: any) => (
        <div>
          <span className="font-semibold">{r.requesterName}</span>
          <br />
          <span className="text-xs text-muted-foreground">{r.requesterType}</span>
        </div>
      ) 
    },
    { 
      key: "items", 
      header: "Items", 
      render: (r: any) => (
        <div className="flex flex-col gap-1 max-w-[200px]">
          {r.items.map((i: any, idx: number) => (
            <span key={idx} className="text-xs">
              {i.quantity}x {i.itemId?.itemName || "Unknown"}
            </span>
          ))}
        </div>
      ) 
    },
    { 
      key: "purpose", 
      header: "Purpose", 
      render: (r: any) => <div className="max-w-[200px] truncate" title={r.purpose}>{r.purpose}</div> 
    },
    { 
      key: "date", 
      header: "Requested On", 
      render: (r: any) => new Date(r.createdAt).toLocaleDateString("en-IN") 
    },
    { 
      key: "status", 
      header: "Status", 
      render: (r: any) => <StatusPill status={r.status} /> 
    },
    {
      key: "actions",
      header: "Actions",
      render: (r: any) => {
        if (r.status === "Requested" || r.status === "Pending") {
          return (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={() => { setSelectedRequest(r); setActionModal("approve"); }}
              >
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                onClick={() => { setSelectedRequest(r); setActionModal("reject"); }}
              >
                Reject
              </Button>
            </div>
          );
        } else if (r.status === "Approved") {
          return (
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => { setSelectedRequest(r); setActionModal("issue"); }}
            >
              <PackageOpen className="w-4 h-4 mr-1" /> Issue Items
            </Button>
          );
        }
        return <span className="text-xs text-muted-foreground">No actions</span>;
      }
    }
  ];

  if (loading) return <div>Loading requests...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" /> Inventory Requests
        </h2>
      </div>

      <div className="glass-card p-6">
        <DataTable columns={columns} rows={requests} searchKeys={["requesterName", "purpose"]} />
      </div>

      <Dialog open={!!actionModal} onOpenChange={(open) => !open && setActionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal === "approve" && "Approve Request"}
              {actionModal === "reject" && "Reject Request"}
              {actionModal === "issue" && "Issue Items to Requester"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {actionModal === "issue" && (
              <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-200 flex gap-2 items-start">
                <PackageOpen className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  Issuing these items will deduct the quantities from the current stock and generate an official Issue Receipt. Ensure you have the physical items ready to hand over.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Admin Remarks (Optional)</Label>
              <Input 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)} 
                placeholder={actionModal === "reject" ? "Reason for rejection..." : "Add any notes..."} 
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setActionModal(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleAction} 
                disabled={actionLoading}
                className={
                  actionModal === "approve" ? "bg-emerald-600 hover:bg-emerald-700" :
                  actionModal === "reject" ? "bg-red-600 hover:bg-red-700" :
                  "bg-blue-600 hover:bg-blue-700"
                }
              >
                {actionLoading ? "Processing..." : 
                  actionModal === "approve" ? "Approve" :
                  actionModal === "reject" ? "Reject" :
                  "Confirm & Issue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

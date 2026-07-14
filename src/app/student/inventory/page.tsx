"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Plus, ClipboardList, CheckCircle, Clock, XCircle, Box } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import RequestItemModal from "@/components/inventory/RequestItemModal";

interface RequestItem {
  itemId: {
    _id: string;
    itemName: string;
    itemCode: string;
    unit: string;
  };
  quantity: number;
}

interface InventoryRequest {
  _id: string;
  items: RequestItem[];
  purpose: string;
  status: "Requested" | "Pending" | "Approved" | "Rejected" | "Issued" | "Returned";
  createdAt: string;
}

interface IssueItem {
  itemId: {
    _id: string;
    itemName: string;
    itemCode: string;
    unit: string;
  };
  quantity: number;
  condition: string;
}

interface InventoryIssue {
  _id: string;
  issueNumber: string;
  items: IssueItem[];
  issueDate: string;
  status: "Issued" | "Partially_Returned" | "Returned";
}

export default function StudentInventoryPage() {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [issues, setIssues] = useState<InventoryIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "issues">("requests");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqRes, issueRes] = await Promise.all([
        fetch("/api/student/inventory/requests"),
        fetch("/api/student/inventory/issues")
      ]);

      const reqData = await reqRes.json();
      const issueData = await issueRes.json();

      if (reqData.success) setRequests(reqData.requests);
      if (issueData.success) setIssues(issueData.issues);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
      case "Issued":
        return "bg-emerald-100 text-emerald-800";
      case "Requested":
      case "Pending":
        return "bg-amber-100 text-amber-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Returned":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Inventory Management"
          subtitle="Request items from the school and track your issued supplies"
        />
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Request Items
        </Button>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2",
            activeTab === "requests" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          )}
          onClick={() => setActiveTab("requests")}
        >
          <ClipboardList className="w-4 h-4" />
          My Requests
        </button>
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2",
            activeTab === "issues" ? "bg-white text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          )}
          onClick={() => setActiveTab("issues")}
        >
          <Box className="w-4 h-4" />
          My Issued Items
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>
        ) : activeTab === "requests" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Items Requested</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No inventory requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-600">
                        {new Date(req.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs truncate" title={req.purpose}>{req.purpose}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {req.items.map((i, idx) => (
                            <span key={idx} className="text-gray-700">
                              {i.quantity}x {i.itemId?.itemName || "Unknown Item"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(req.status))}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Date Issued</th>
                  <th className="p-4">Issue Number</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      You have no issued items.
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-600">
                        {new Date(issue.issueDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-4 font-medium text-gray-700">
                        {issue.issueNumber}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {issue.items.map((i, idx) => (
                            <span key={idx} className="text-gray-700">
                              {i.quantity}x {i.itemId?.itemName || "Unknown Item"} 
                              <span className="text-gray-400 text-xs ml-1">({i.condition})</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(issue.status))}>
                          {issue.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RequestItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          toast({ title: "Success", description: "Request submitted successfully" });
          fetchData();
        }}
        apiEndpoint="/api/student/inventory"
      />
    </div>
  );
}

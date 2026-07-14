"use client";

import { useState, useEffect } from "react";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [retRes, issRes] = await Promise.all([
        fetch("/api/admin/inventory/returns").then(r => r.json()),
        fetch("/api/admin/inventory/issues").then(r => r.json()),
      ]);
      if (retRes.success) setReturns(retRes.returns);
      if (issRes.success) setIssues(issRes.issues.filter((i: any) => i.status !== "Returned"));
    } catch (e) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openReturnModal = (issue: any) => {
    setSelectedIssue(issue);
    setReturnItems(issue.items.map((i: any) => ({
      itemId: i.itemId._id || i.itemId,
      itemName: i.itemId.itemName || "Item",
      issuedQty: i.quantity,
      returnQty: i.quantity,
      condition: "Good"
    })));
    setIsModalOpen(true);
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    const payload = {
      issueId: selectedIssue._id,
      items: returnItems.map(i => ({
        itemId: i.itemId,
        quantity: Number(i.returnQty),
        condition: i.condition
      }))
    };

    const res = await fetch("/api/admin/inventory/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Items returned successfully");
      setIsModalOpen(false);
      fetchData();
    } else {
      toast.error(data.error);
    }
  };

  const columns = [
    { key: "issue", header: "Issue #", render: (r: any) => r.issueId?.issueNumber || "-" },
    { key: "items", header: "Items Count", render: (r: any) => r.items?.length || 0 },
    { key: "date", header: "Return Date", render: (r: any) => new Date(r.returnDate).toLocaleDateString() },
  ];

  const issueColumns = [
    { key: "issueNumber", header: "Issue #" },
    { key: "receiver", header: "Issued To", render: (r: any) => r.receiverName },
    { key: "actions", header: "Action", render: (r: any) => (
      <Button size="sm" onClick={() => openReturnModal(r)}>Process Return</Button>
    ) }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Undo2 className="w-5 h-5 text-primary" /> Return Inventory
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold mb-4">Pending Issues</h3>
          <DataTable columns={issueColumns} rows={issues} searchKeys={["issueNumber"]} />
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold mb-4">Recent Returns</h3>
          <DataTable columns={columns} rows={returns} searchKeys={[]} />
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Return - {selectedIssue?.issueNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReturn} className="space-y-4 mt-4">
            {returnItems.map((item, idx) => (
              <div key={idx} className="border p-3 rounded-lg space-y-2">
                <div className="font-bold">{item.itemName} (Issued: {item.issuedQty})</div>
                <div className="flex gap-4">
                  <div className="w-1/3 space-y-1">
                    <Label className="text-xs">Return Qty</Label>
                    <input 
                      type="number" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={item.returnQty} 
                      max={item.issuedQty}
                      onChange={e => {
                        const newArr = [...returnItems];
                        newArr[idx].returnQty = e.target.value;
                        setReturnItems(newArr);
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Condition</Label>
                    <Select value={item.condition} onValueChange={v => {
                      const newArr = [...returnItems];
                      newArr[idx].condition = v;
                      setReturnItems(newArr);
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            <Button type="submit" className="w-full mt-4 gradient-primary">Complete Return</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

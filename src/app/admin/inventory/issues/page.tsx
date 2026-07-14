"use client";

import { useState, useEffect } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function IssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  // We need lists of students/teachers to populate receiver, assuming endpoints exist. 
  // For now, we will use text inputs or placeholder for receivers if endpoints are not built yet.
  // Actually, ERP already has /api/admin/students, /api/admin/teachers. We can fetch them.
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    receiverType: "Student",
    receiverId: "",
    purpose: "",
    issueItems: [{ itemId: "", quantity: 1 }]
  });

  const fetchData = async () => {
    try {
      const [issueRes, itemsRes, stuRes] = await Promise.all([
        fetch("/api/admin/inventory/issues").then(r => r.json()),
        fetch("/api/admin/inventory/items").then(r => r.json()),
        fetch("/api/admin/students").then(r => r.json()).catch(() => ({ students: [] }))
      ]);
      if (issueRes.success) setIssues(issueRes.issues);
      if (itemsRes.success) setItems(itemsRes.items);
      if (stuRes.success || stuRes.students) setStudents(stuRes.students || []);
    } catch (e) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.receiverId || !form.issueItems[0].itemId) return toast.error("Receiver and item required");

    const payload = {
      receiverType: form.receiverType,
      receiverId: form.receiverId,
      purpose: form.purpose,
      items: form.issueItems.filter(i => i.itemId).map(i => ({ ...i, quantity: Number(i.quantity) }))
    };

    const res = await fetch("/api/admin/inventory/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Item issued successfully");
      setIsModalOpen(false);
      fetchData();
      setForm({
        receiverType: "Student", receiverId: "", purpose: "",
        issueItems: [{ itemId: "", quantity: 1 }]
      });
    } else {
      toast.error(data.error);
    }
  };

  const columns = [
    { key: "issueNumber", header: "Issue #", render: (r: any) => <span className="font-bold">{r.issueNumber}</span> },
    { key: "receiver", header: "Issued To", render: (r: any) => <div>{r.receiverName}<br/><span className="text-xs text-muted-foreground">{r.receiverType}</span></div> },
    { key: "items", header: "Items", render: (r: any) => r.items?.length || 0 },
    { key: "status", header: "Status", render: (r: any) => <StatusPill status={r.status} /> },
    { key: "date", header: "Issue Date", render: (r: any) => new Date(r.issueDate).toLocaleDateString() },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" /> Issue Inventory
        </h2>
        <Button onClick={() => setIsModalOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" /> New Issue
        </Button>
      </div>

      <div className="glass-card p-6">
        <DataTable columns={columns} rows={issues} searchKeys={["issueNumber", "receiverName"]} />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Receiver Type</Label>
                <Select value={form.receiverType} onValueChange={v => setForm({...form, receiverType: v, receiverId: ""})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="SeniorTeacher">Senior Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Receiver</Label>
                {form.receiverType === "Student" ? (
                  <Select value={form.receiverId} onValueChange={v => setForm({...form, receiverId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => <SelectItem key={s._id || s.id} value={s._id || s.id}>{s.fullName || s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Enter ID (Backend needed)" value={form.receiverId} onChange={e => setForm({...form, receiverId: e.target.value})} />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="e.g. Art Class Supplies" />
            </div>

            <div className="border-t pt-4 space-y-4">
              <Label className="font-bold">Items</Label>
              {form.issueItems.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-1">
                    <Select value={item.itemId} onValueChange={v => {
                      const newItems = [...form.issueItems];
                      newItems[idx].itemId = v;
                      setForm({...form, issueItems: newItems});
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger>
                      <SelectContent>
                        {items.filter(i => i.currentStock > 0).map(i => (
                          <SelectItem key={i._id} value={i._id}>{i.itemName} (Stock: {i.currentStock})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input type="number" min="1" value={item.quantity} onChange={e => {
                      const newItems = [...form.issueItems];
                      newItems[idx].quantity = Number(e.target.value);
                      setForm({...form, issueItems: newItems});
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full mt-4 gradient-primary">Issue Items</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

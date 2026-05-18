"use client";

import { useState } from "react";
import { Boxes, AlertTriangle, PackageCheck, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, actions } from "@/store/dataStore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

export default function Inventory() {
  const inventoryItems = useStore(s => s.inventory);
  const recentIssues = useStore(s => s.issues);
  const students = useStore(s => s.students);
  const [issueOpen, setIssueOpen] = useState(false);
  const [form, setForm] = useState({ studentId: "", itemId: "", qty: "1" });
  const totalItems = inventoryItems.reduce((s, i) => s + i.stock, 0);
  const low = inventoryItems.filter(i => i.status === "Low Stock").length;
  const issued = recentIssues.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Aprons, kits and supplies" action={
        <Button className="rounded-xl gradient-primary text-white border-0 shadow-pop" onClick={() => setIssueOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />Issue Item
        </Button>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Items" value={totalItems} icon={Boxes} tone="primary" />
        <StatCard label="Low Stock Alerts" value={low} icon={AlertTriangle} tone="warning" />
        <StatCard label="Items Issued (week)" value={issued} icon={PackageCheck} tone="success" />
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Item" },
          { key: "category", header: "Category" },
          { key: "stock", header: "Stock", render: r => <span className="font-bold">{r.stock}</span> },
          { key: "reorder", header: "Reorder pt" },
          { key: "status", header: "Status", render: r => <StatusPill status={r.status} /> },
        ]}
        rows={inventoryItems}
        searchKeys={["name", "category"]}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-soft p-5">
          <h3 className="font-display font-bold text-lg mb-4">Stock by item</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={inventoryItems.map(i => ({ name: i.name.split(" ")[0], stock: i.stock }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="stock" fill="hsl(var(--primary))" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card-soft p-5">
            <div className="text-xs text-muted-foreground font-semibold">Most issued</div>
            <div className="font-display font-bold text-xl mt-1">Sketch Book A4</div>
            <div className="text-sm text-success mt-1">42 units this month</div>
          </div>
          <div className="card-soft p-5">
            <div className="text-xs text-muted-foreground font-semibold">Wastage rate</div>
            <div className="font-display font-bold text-xl mt-1">2.4%</div>
            <div className="text-sm text-muted-foreground mt-1">↓ 0.6% vs last month</div>
          </div>
        </div>
      </div>

      <div className="card-soft p-5">
        <h3 className="font-display font-bold text-lg mb-3">Recent issue log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr>
              <th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-left">Qty</th>
            </tr></thead>
            <tbody>
              {recentIssues.map((r, i) => <tr key={i} className="border-t border-border/60">
                <td className="px-3 py-2">{r.date}</td><td className="px-3 py-2">{r.student}</td>
                <td className="px-3 py-2">{r.item}</td><td className="px-3 py-2 font-bold">{r.qty}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue inventory item</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={e => {
            e.preventDefault();
            const stu = students.find(s => s.id === form.studentId);
            if (!stu || !form.itemId) { toast.error("Pick student and item"); return; }
            actions.issueItem({ itemId: form.itemId, studentName: stu.name, qty: Number(form.qty) || 1 });
            toast.success("Item issued — stock updated!");
            setIssueOpen(false);
            setForm({ studentId: "", itemId: "", qty: "1" });
          }}>
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}><SelectTrigger><SelectValue placeholder="Pick student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Item</Label>
              <Select value={form.itemId} onValueChange={v => setForm(f => ({ ...f, itemId: v }))}><SelectTrigger><SelectValue placeholder="Pick item" /></SelectTrigger>
                <SelectContent>{inventoryItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Size</Label>
                <Select><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value="S">S</SelectItem><SelectItem value="M">M</SelectItem><SelectItem value="L">L</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full rounded-xl gradient-primary text-white border-0">Issue</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

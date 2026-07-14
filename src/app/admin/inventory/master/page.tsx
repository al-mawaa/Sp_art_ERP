"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Edit, Trash2 } from "lucide-react";
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

export default function MasterItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    itemName: "",
    categoryId: "",
    unit: "pcs",
    status: "Active",
    openingStock: "0",
    lowStockThreshold: "10"
  });

  const fetchData = async () => {
    try {
      const [itemsRes, catRes] = await Promise.all([
        fetch("/api/admin/inventory/items").then(r => r.json()),
        fetch("/api/admin/inventory/categories").then(r => r.json())
      ]);
      if (itemsRes.success) setItems(itemsRes.items);
      if (catRes.success) setCategories(catRes.categories);
    } catch (e) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName || !form.categoryId) return toast.error("Name and Category required");

    const res = await fetch("/api/admin/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        openingStock: Number(form.openingStock),
        currentStock: Number(form.openingStock),
        lowStockThreshold: Number(form.lowStockThreshold)
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Item added successfully");
      setIsModalOpen(false);
      fetchData();
      setForm({ itemName: "", categoryId: "", unit: "pcs", status: "Active", openingStock: "0", lowStockThreshold: "10" });
    } else {
      toast.error(data.error);
    }
  };

  const columns = [
    { key: "itemCode", header: "Code" },
    { key: "itemName", header: "Item Name", render: (r: any) => <span className="font-bold">{r.itemName}</span> },
    { key: "category", header: "Category", render: (r: any) => r.categoryId?.name || "-" },
    { key: "currentStock", header: "Stock", render: (r: any) => (
      <span className={`font-bold ${r.currentStock <= r.lowStockThreshold ? 'text-destructive' : 'text-success'}`}>
        {r.currentStock} {r.unit}
      </span>
    )},
    { key: "status", header: "Status", render: (r: any) => <StatusPill status={r.status} /> },
    { key: "actions", header: "Actions", render: () => (
      <div className="flex gap-2">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500"><Edit className="w-4 h-4" /></Button>
      </div>
    )}
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Master Items
        </h2>
        <Button onClick={() => setIsModalOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      <div className="glass-card p-6">
        <DataTable
          columns={columns}
          rows={items}
          searchKeys={["itemName", "itemCode"]}
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={form.itemName} onChange={e => setForm({...form, itemName: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={v => setForm({...form, categoryId: v})}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit (e.g. pcs, kg)</Label>
                <Input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Opening Stock</Label>
                <Input type="number" value={form.openingStock} onChange={e => setForm({...form, openingStock: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input type="number" value={form.lowStockThreshold} onChange={e => setForm({...form, lowStockThreshold: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full mt-4 gradient-primary">Save Item</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

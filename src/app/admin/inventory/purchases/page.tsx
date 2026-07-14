"use client";

import { useState, useEffect } from "react";
import { Plus, ShoppingCart, ListOrdered } from "lucide-react";
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

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    vendorId: "",
    invoiceNumber: "",
    status: "Received",
    poItems: [{ itemId: "", quantity: 1, unitPrice: 0, gstPercentage: 0, discount: 0 }]
  });

  const fetchData = async () => {
    try {
      const [poRes, vendorRes, itemsRes] = await Promise.all([
        fetch("/api/admin/inventory/purchases").then(r => r.json()),
        fetch("/api/admin/inventory/vendors").then(r => r.json()),
        fetch("/api/admin/inventory/items").then(r => r.json())
      ]);
      if (poRes.success) setPurchases(poRes.purchases);
      if (vendorRes.success) setVendors(vendorRes.vendors);
      if (itemsRes.success) setItems(itemsRes.items);
    } catch (e) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddItem = () => {
    setForm({
      ...form,
      poItems: [...form.poItems, { itemId: "", quantity: 1, unitPrice: 0, gstPercentage: 0, discount: 0 }]
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...form.poItems];
    (newItems[index] as any)[field] = value;
    setForm({ ...form, poItems: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorId || !form.poItems[0].itemId) return toast.error("Vendor and at least one item required");

    const payload = {
      vendorId: form.vendorId,
      invoiceNumber: form.invoiceNumber,
      status: form.status,
      items: form.poItems.filter(i => i.itemId).map(i => ({
        ...i,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        gstPercentage: Number(i.gstPercentage),
        discount: Number(i.discount),
        total: (Number(i.quantity) * Number(i.unitPrice))
      }))
    };

    const res = await fetch("/api/admin/inventory/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Purchase Order created successfully");
      setIsModalOpen(false);
      fetchData();
      setForm({
        vendorId: "", invoiceNumber: "", status: "Received",
        poItems: [{ itemId: "", quantity: 1, unitPrice: 0, gstPercentage: 0, discount: 0 }]
      });
    } else {
      toast.error(data.error);
    }
  };

  const columns = [
    { key: "poNumber", header: "PO/Invoice", render: (r: any) => <span className="font-bold">{r.invoiceNumber || "N/A"}</span> },
    { key: "vendor", header: "Vendor", render: (r: any) => r.vendorId?.name || "-" },
    { key: "items", header: "Items Count", render: (r: any) => r.items?.length || 0 },
    { key: "amount", header: "Amount", render: (r: any) => `₹${(r.totalAmount || 0).toLocaleString()}` },
    { key: "status", header: "Status", render: (r: any) => <StatusPill status={r.status} /> },
    { key: "date", header: "Date", render: (r: any) => new Date(r.purchaseDate).toLocaleDateString() },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" /> Purchase Orders
        </h2>
        <Button onClick={() => setIsModalOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" /> Create PO
        </Button>
      </div>

      <div className="glass-card p-6">
        <DataTable columns={columns} rows={purchases} searchKeys={["invoiceNumber"]} />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={form.vendorId} onValueChange={v => setForm({...form, vendorId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status (If 'Received', stock updates automatically)</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Ordered">Ordered</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold">Order Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>+ Add Item</Button>
              </div>
              
              {form.poItems.map((poItem, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Item</Label>
                    <Select value={poItem.itemId} onValueChange={v => handleItemChange(idx, "itemId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger>
                      <SelectContent>
                        {items.map(i => <SelectItem key={i._id} value={i._id}>{i.itemName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" value={poItem.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Price (₹)</Label>
                    <Input type="number" value={poItem.unitPrice} onChange={e => handleItemChange(idx, "unitPrice", e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">GST %</Label>
                    <Input type="number" value={poItem.gstPercentage} onChange={e => handleItemChange(idx, "gstPercentage", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full mt-4 gradient-primary">Save & Process PO</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Edit } from "lucide-react";
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
import { toast } from "sonner";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contactPerson: "", email: "", phone: "", address: "", gstNumber: "" });

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/admin/inventory/vendors").then(r => r.json());
      if (res.success) setVendors(res.vendors);
    } catch (e) {
      toast.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Vendor name required");

    const res = await fetch("/api/admin/inventory/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Vendor created successfully");
      setIsModalOpen(false);
      fetchVendors();
      setForm({ name: "", contactPerson: "", email: "", phone: "", address: "", gstNumber: "" });
    } else {
      toast.error(data.error);
    }
  };

  const columns = [
    { key: "name", header: "Vendor Name", render: (r: any) => <span className="font-bold">{r.name}</span> },
    { key: "contactPerson", header: "Contact Person" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "status", header: "Status", render: (r: any) => <StatusPill status={r.status} /> },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Vendors
        </h2>
        <Button onClick={() => setIsModalOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Vendor
        </Button>
      </div>

      <div className="glass-card p-6">
        <DataTable columns={columns} rows={vendors} searchKeys={["name", "contactPerson", "email"]} />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input value={form.gstNumber} onChange={e => setForm({...form, gstNumber: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <Button type="submit" className="w-full mt-4 gradient-primary">Save Vendor</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

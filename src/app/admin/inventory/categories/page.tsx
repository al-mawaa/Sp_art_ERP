"use client";

import { useState, useEffect } from "react";
import { Plus, Tags, Edit } from "lucide-react";
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/inventory/categories").then(r => r.json());
      if (res.success) setCategories(res.categories);
    } catch (e) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Category name required");

    const res = await fetch("/api/admin/inventory/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Category created successfully");
      setIsModalOpen(false);
      fetchCategories();
      setForm({ name: "", description: "" });
    } else {
      toast.error(data.error);
    }
  };

  const columns = [
    { key: "name", header: "Category Name", render: (r: any) => <span className="font-bold">{r.name}</span> },
    { key: "description", header: "Description" },
    { key: "isActive", header: "Status", render: (r: any) => <StatusPill status={r.isActive ? "Active" : "Inactive"} /> },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Tags className="w-5 h-5 text-primary" /> Categories
        </h2>
        <Button onClick={() => setIsModalOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="glass-card p-6">
        <DataTable columns={columns} rows={categories} searchKeys={["name"]} />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <Button type="submit" className="w-full mt-4 gradient-primary">Save Category</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Award, Loader2, Plus, Pencil, Trash2, Upload, X, ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatInr } from "@/lib/enrollment/paymentCalculations";

type Category = { id: string; name: string; slug: string; status: string };
type Reward = {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  rewardType: string;
  walletAmount: number;
  requiredReferrals: number;
  status: string;
  image?: string;
};

type ReportData = {
  categories: Category[];
  rewards: Reward[];
};

const REWARD_TYPES = [
  { value: "physical", label: "Physical Gift" },
  { value: "wallet", label: "Wallet Credit" },
  { value: "cashback", label: "Cashback" },
  { value: "voucher", label: "Voucher" },
];

export default function AdminGiftManagementPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewardDialog, setRewardDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    rewardType: "physical",
    walletAmount: "0",
    requiredReferrals: "1",
    status: "active",
    image: "",
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [categoryName, setCategoryName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rewards", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData({ categories: json.categories, rewards: json.rewards });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateReward = () => {
    setEditingReward(null);
    setForm({
      title: "",
      description: "",
      categoryId: data?.categories[0]?.id ?? "",
      rewardType: "physical",
      walletAmount: "0",
      requiredReferrals: "1",
      status: "active",
      image: "",
    });
    setImagePreview("");
    setRewardDialog(true);
  };

  const openEditReward = (r: Reward) => {
    setEditingReward(r);
    setForm({
      title: r.title,
      description: r.description ?? "",
      categoryId: r.categoryId,
      rewardType: r.rewardType,
      walletAmount: String(r.walletAmount ?? 0),
      requiredReferrals: String(r.requiredReferrals),
      status: r.status,
      image: r.image ?? "",
    });
    setImagePreview(r.image ?? "");
    setRewardDialog(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "rewards");

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setForm(f => ({ ...f, image: json.url }));
      setImagePreview(json.url);
      toast({ title: "Image uploaded successfully" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload image",
        variant: "destructive",
      });
      setImagePreview(form.image);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setForm(f => ({ ...f, image: "" }));
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveReward = async () => {
    if (!form.title.trim() || !form.categoryId) {
      toast({ title: "Title and category required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        entity: "reward",
        ...(editingReward ? { id: editingReward.id } : {}),
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        rewardType: form.rewardType,
        walletAmount: Number(form.walletAmount),
        requiredReferrals: Number(form.requiredReferrals),
        status: form.status,
        image: form.image,
      };
      const res = await fetch("/api/admin/rewards", {
        method: editingReward ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      toast({ title: editingReward ? "Reward updated" : "Reward created" });
      setRewardDialog(false);
      load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Save failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteReward = async (id: string) => {
    if (!confirm("Delete this reward?")) return;
    try {
      const res = await fetch(`/api/admin/rewards?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      toast({ title: "Reward deleted" });
      load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      });
    }
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ entity: "category", name: categoryName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast({ title: "Category created" });
      setCategoryDialog(false);
      setCategoryName("");
      load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gift Management"
        subtitle="Create reward categories, set referral thresholds, and manage the gift catalog"
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={openCreateReward} className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Plus className="mr-2 h-4 w-4" /> Add Reward
        </Button>
        <Button variant="outline" onClick={() => setCategoryDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {data.categories.map(c => (
            <span
              key={c.id}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-violet-600" /> Reward Catalog
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 pr-3 font-medium">Reward</th>
                <th className="pb-3 pr-3 font-medium">Category</th>
                <th className="pb-3 pr-3 font-medium">Type</th>
                <th className="pb-3 pr-3 font-medium">Referrals</th>
                <th className="pb-3 pr-3 font-medium">Value</th>
                <th className="pb-3 pr-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.rewards.map(r => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="py-3 pr-3 font-medium text-slate-900">{r.title}</td>
                  <td className="py-3 pr-3">{r.categoryName}</td>
                  <td className="py-3 pr-3 capitalize">{r.rewardType}</td>
                  <td className="py-3 pr-3">{r.requiredReferrals}</td>
                  <td className="py-3 pr-3">
                    {r.walletAmount > 0 ? formatInr(r.walletAmount) : "—"}
                  </td>
                  <td className="py-3 pr-3 capitalize">{r.status}</td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEditReward(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteReward(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reward Create/Edit Dialog */}
      <Dialog open={rewardDialog} onOpenChange={setRewardDialog}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Create Reward"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.rewardType} onValueChange={v => setForm(f => ({ ...f, rewardType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REWARD_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Required Referrals</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.requiredReferrals}
                  onChange={e => setForm(f => ({ ...f, requiredReferrals: e.target.value }))}
                />
              </div>
            </div>
            {(form.rewardType === "wallet" || form.rewardType === "cashback") && (
              <div className="space-y-2">
                <Label>Wallet / Cashback Amount (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.walletAmount}
                  onChange={e => setForm(f => ({ ...f, walletAmount: e.target.value }))}
                />
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Reward Image (optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative group rounded-xl border border-slate-200 overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Reward preview"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <span className="ml-1">Change</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={removeImage}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-1">Remove</span>
                    </Button>
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                      <span className="ml-2 text-sm font-medium text-violet-700">Uploading…</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                      <span className="text-sm font-medium">Uploading…</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs text-slate-400">PNG, JPG, WEBP up to 5MB</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialog(false)} disabled={saving || uploading}>Cancel</Button>
            <Button onClick={saveReward} disabled={saving || uploading}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Create Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

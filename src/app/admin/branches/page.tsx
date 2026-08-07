"use client";

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

type BranchForm = z.infer<typeof branchSchema>;
type BranchRow = {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
};

type BranchStatusFilter = 'All' | 'Active' | 'Inactive';

export default function AdminBranchesPage() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<BranchStatusFilter>('All');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BranchForm>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      status: 'Active',
    },
  });

  const filteredRows = useMemo(() => {
    return statusFilter === 'All'
      ? rows
      : rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/branches');
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to load branches');
      }
      setRows(result.branches ?? []);
    } catch (error) {
      console.error('Error loading branches:', error);
      toast.error('Unable to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // prevent background scroll when modal is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prev = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev || '';
    }
    return () => { document.body.style.overflow = prev || ''; };
  }, [open]);

  const clearForm = () => {
    form.reset({
      name: '',
      address: '',
      phone: '',
      status: 'Active',
    });
    setEditing(null);
  };

  const openAddBranch = () => {
    clearForm();
    setOpen(true);
  };

  const openEditBranch = (row: BranchRow) => {
    setEditing(row);
    form.reset({
      name: row.name,
      address: row.address,
      phone: row.phone,
      status: row.status,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this branch? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/branches/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Failed to delete branch');
        return;
      }
      setRows((prev) => prev.filter((row) => row.id !== id));
      toast.success(result.message || 'Branch deleted successfully');
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Failed to delete branch');
    }
  };

  const onSubmit = async (values: BranchForm) => {
    setSubmitting(true);
    try {
      const url = editing ? `/api/admin/branches/${editing.id}` : '/api/admin/branches';
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Failed to save branch');
        return;
      }

      toast.success(editing ? 'Branch updated successfully' : 'Branch created successfully');
      fetchBranches();
      setOpen(false);
      clearForm();
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error('Failed to save branch');
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = editing ? 'Edit Branch' : 'Add New Branch';
  const emptyStateText = statusFilter === 'All' ? 'No branches yet.' : `No ${statusFilter.toLowerCase()} branches found.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        subtitle="Manage academy branches and physical locations."
        action={
          <Button onClick={openAddBranch}>
            <Plus className="w-4 h-4" /> Add New Branch
          </Button>
        }
      />

      <div className="card-soft p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['All', 'Active', 'Inactive'] as BranchStatusFilter[]).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? 'secondary' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredRows.length} branch{filteredRows.length === 1 ? '' : 'es'} shown
        </div>
      </div>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading branches…</div>
        ) : (
          <DataTable
            columns={[
              { key: 'name', header: 'Branch Name' },
              { key: 'address', header: 'Address', render: row => row.address || '—' },
              { key: 'phone', header: 'Phone', render: row => row.phone || '—' },
              { key: 'status', header: 'Status', render: row => (
                <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${row.status === 'Active' ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted-foreground'}`}>
                  {row.status}
                </span>
              ) },
              { key: 'actions', header: 'Actions', render: row => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditBranch(row)}>
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(row.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              ) },
            ]}
            rows={filteredRows}
            searchKeys={['name', 'address', 'phone']}
            emptyMessage={emptyStateText}
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[78vh] overflow-y-auto mx-4 my-8 rounded-2xl p-6 shadow-xl bg-white">
          <DialogHeader className="sticky top-0 z-10 bg-white/90 -mx-6 px-0 py-2 backdrop-blur-sm">
            <DialogTitle className="ml-0">{modalTitle}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 mt-2" onSubmit={form.handleSubmit(onSubmit)}>
            
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name</Label>
              <Input id="name" className="rounded-xl" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" className="rounded-xl" placeholder="e.g. +91 9876543210" {...form.register('phone')} />
              {form.formState.errors.phone && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={3} className="rounded-xl resize-none" placeholder="Enter branch physical address" {...form.register('address')} />
              {form.formState.errors.address && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(val: 'Active' | 'Inactive') => form.setValue('status', val, { shouldValidate: true })}
              >
                <SelectTrigger id="status" className="rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.status.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <LoadingButton type="submit" isLoading={submitting} className="rounded-xl">
                Save Branch
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

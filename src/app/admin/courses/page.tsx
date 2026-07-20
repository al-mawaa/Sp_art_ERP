"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Plus, Pencil, Trash2, UploadCloud, ImagePlus, X, Loader2 } from 'lucide-react';
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

const courseSchema = z.object({
  courseTitle: z.string().min(1, 'Course title is required'),
  category: z.string().min(1, 'Course category is required'),
  courseCode: z.string().min(1, 'Course code is required'),
  image: z.string().optional(),
  duration: z.coerce.number().min(1, 'Duration is required'),
  totalFees: z.coerce.number().min(0, 'Total fees is required'),
  discountFees: z.coerce.number().min(0, 'Payable amount is required'),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().optional(),
  rulesAndRegulations: z.string().optional(),
  materials: z.string().optional(),
});

type CourseForm = z.infer<typeof courseSchema>;
type CourseRow = {
  id: string;
  courseTitle: string;
  category?: string;
  categorySlug?: string;
  courseCode: string;
  image?: string;
  instructor?: string;
  duration: number;
  totalFees: number;
  discountFees: number;
  discountPercentage: number;
  status: 'active' | 'inactive';
  notes?: string;
  rulesAndRegulations?: string;
  materialsRequired?: string;
  createdAt: string;
};

type CourseStatusFilter = 'All' | 'active' | 'inactive';

 

export default function AdminCoursesPage() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>('All');
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseTitle: '',
      category: '',
      courseCode: '',
      image: '',
      duration: 1,
      totalFees: 0,
      discountFees: 0,
      status: 'active',
      notes: '',
      rulesAndRegulations: '',
      materials: '',
    },
  });

  const totalFeesValue = Number(form.watch('totalFees') ?? 0);
  const discountFeesValue = Number(form.watch('discountFees') ?? 0);
  const discountPercentageValue = totalFeesValue > 0
    ? Math.max(0, Math.round(((totalFeesValue - discountFeesValue) / totalFeesValue) * 100))
    : 0;

  const filteredRows = useMemo(() => {
    const filtered = statusFilter === 'All'
      ? rows
      : rows.filter((row) => row.status === statusFilter);
    return filtered;
  }, [rows, statusFilter]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/courses');
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to load courses');
      }
      setRows(result.courses ?? []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Unable to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'course-images');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Image upload failed');
      }

      form.setValue('image', data.url);
      toast.success('Course image uploaded');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error((error as Error).message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };


  useEffect(() => {
    fetchCourses();
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
      courseTitle: '',
      category: '',
      courseCode: '',
      image: '',
      duration: 1,
      totalFees: 0,
      discountFees: 0,
      status: 'active',
      notes: '',
      rulesAndRegulations: '',
      materials: '',
    });
    setEditing(null);
  };

  const openAddCourse = () => {
    clearForm();
    setOpen(true);
  };

  const openEditCourse = (row: CourseRow) => {
    setEditing(row);
    form.reset({
      courseTitle: row.courseTitle,
      category: row.category ?? '',
      courseCode: row.courseCode,
      image: row.image ?? '',
      duration: row.duration,
      totalFees: row.totalFees,
      discountFees: row.discountFees,
      status: row.status,
      notes: row.notes ?? '',
      rulesAndRegulations: row.rulesAndRegulations ?? '',
      materials: row.materialsRequired ?? '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Failed to delete course');
        return;
      }
      setRows((prev) => prev.filter((row) => row.id !== id));
      toast.success(result.message || 'Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const onSubmit = async (values: CourseForm) => {
    setSubmitting(true);
    try {
      const discountPercentage = values.totalFees > 0
        ? Math.max(0, Math.round(((values.totalFees - values.discountFees) / values.totalFees) * 100))
        : 0;

      const payload = {
        courseTitle: values.courseTitle,
        category: values.category,
        courseCode: values.courseCode,
        image: values.image || undefined,
        duration: Number(values.duration),
        totalFees: Number(values.totalFees),
        discountFees: Number(values.discountFees),
        discountPercentage,
        status: values.status,
        notes: values.notes || undefined,
        rulesAndRegulations: values.rulesAndRegulations || undefined,
        materials: values.materials || undefined,
      };
      const url = editing ? `/api/courses/${editing.id}` : '/api/courses';
      const method = editing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Failed to save course');
        setSubmitting(false);
        return;
      }

      const newCourse: CourseRow = {
        id: result.course.id,
        courseTitle: result.course.courseTitle,
        category: result.course.category,
        categorySlug: result.course.categorySlug,
        courseCode: result.course.courseCode,
        image: result.course.image,
        duration: result.course.duration,
        totalFees: result.course.totalFees,
        discountFees: result.course.discountFees,
        discountPercentage: result.course.discountPercentage,
        status: result.course.status,
        notes: result.course.notes,
        rulesAndRegulations: result.course.rulesAndRegulations,
        materialsRequired: result.course.materialsRequired,
        createdAt: result.course.createdAt,
      };

      if (editing) {
        setRows((prev) => prev.map((row) => (row.id === editing.id ? newCourse : row)));
        toast.success('Course updated successfully');
      } else {
        setRows((prev) => [newCourse, ...prev]);
        toast.success('Course created successfully');
      }

      setOpen(false);
      clearForm();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = editing ? 'Edit Course' : 'Add New Course';
  const emptyStateText = statusFilter === 'All' ? 'No courses yet.' : `No ${statusFilter.toLowerCase()} courses found.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        subtitle="Manage course offerings and pricing for the academy."
        action={
          <Button onClick={openAddCourse}>
            <Plus className="w-4 h-4" /> Add New Course
          </Button>
        }
      />

      <div className="card-soft p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['All', 'active', 'inactive'] as CourseStatusFilter[]).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? 'secondary' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'All' ? status : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredRows.length} course{filteredRows.length === 1 ? '' : 's'} shown
        </div>
      </div>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading courses…</div>
        ) : (
          <DataTable
            columns={[
              { key: 'courseTitle', header: 'Course' },
              { key: 'courseCode', header: 'Code' },
              { key: 'duration', header: 'Duration', render: row => `${row.duration} months` },
              { key: 'totalFees', header: 'Total Fees', render: row => `₹${row.totalFees.toFixed(2)}` },
              { key: 'discountFees', header: 'Payable amount', render: row => `₹${row.discountFees.toFixed(2)}` },
              { key: 'discountPercentage', header: 'Discount %', render: row => `${row.discountPercentage}%` },
              { key: 'status', header: 'Status', render: row => (
                <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${row.status === 'active' ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted-foreground'}`}>
                  {row.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              ) },
              { key: 'actions', header: 'Actions', render: row => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditCourse(row)}>
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(row.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              ) },
            ]}
            rows={filteredRows}
            searchKeys={['courseTitle', 'courseCode']}
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
            {/* Image banner at top */}
            <div className="w-full">
              <Label className="mb-2 text-sm font-semibold">Course Banner</Label>
              <div
                onDrop={handleImageDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative group w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-white p-3 transition hover:shadow-lg hover:scale-[1.01]"
                style={{ transitionProperty: 'box-shadow, transform' }}
              >
                {form.watch('image') ? (
                  <div className="relative h-28 sm:h-40 w-full rounded-lg overflow-hidden">
                    <img src={form.watch('image')} alt="Course banner" className="object-cover w-full h-full" />
                    <button type="button" onClick={() => form.setValue('image', '')} className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-white/80 p-1 shadow">
                      <X className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-28 sm:h-40 w-full flex-col items-center justify-center gap-3 rounded-lg">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                      <ImagePlus className="h-7 w-7" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold">Upload Course Banner</div>
                      <div className="text-xs text-slate-500">Drag & drop a banner, or browse to upload</div>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="inline-flex h-10 items-center gap-2 rounded-lg px-3"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <UploadCloud className="h-4 w-4 text-slate-700" />
                    <span className="text-sm">{uploadingImage ? 'Uploading…' : 'Upload'}</span>
                  </Button>
                  {form.watch('image') && (
                    <Button type="button" variant="ghost" className="h-10 rounded-lg px-3" onClick={() => form.setValue('image', '')}>
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </div>
            </div>

            {/* Two-column responsive form */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="courseTitle">Course Title</Label>
                <Input id="courseTitle" className="h-11 rounded-lg shadow-sm" {...form.register('courseTitle')} />
                {form.formState.errors.courseTitle && <p className="text-xs text-red-500">{form.formState.errors.courseTitle.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Course Category</Label>
                <Input id="category" className="h-11 rounded-lg shadow-sm" {...form.register('category')} />
                {form.formState.errors.category && <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="courseCode">Course Code</Label>
                <Input id="courseCode" className="h-11 rounded-lg shadow-sm" {...form.register('courseCode')} />
                {form.formState.errors.courseCode && <p className="text-xs text-red-500">{form.formState.errors.courseCode.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (months)</Label>
                <Input id="duration" type="number" className="h-11 rounded-lg shadow-sm" min={1} step={1} {...form.register('duration', { valueAsNumber: true })} />
                {form.formState.errors.duration && <p className="text-xs text-red-500">{form.formState.errors.duration.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="totalFees">Total Fees</Label>
                <Input id="totalFees" type="number" className="h-11 rounded-lg shadow-sm" min={0} step={0.01} {...form.register('totalFees', { valueAsNumber: true })} />
                {form.formState.errors.totalFees && <p className="text-xs text-red-500">{form.formState.errors.totalFees.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="discountFees">Payable amount</Label>
                <Input id="discountFees" type="number" className="h-11 rounded-lg shadow-sm" min={0} step={0.01} {...form.register('discountFees', { valueAsNumber: true })} />
                {form.formState.errors.discountFees && <p className="text-xs text-red-500">{form.formState.errors.discountFees.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="discountPercentage">Discount (%)</Label>
                <Input id="discountPercentage" className="h-11 rounded-lg shadow-sm" value={`${discountPercentageValue}% OFF`} readOnly />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive')}>
                  <SelectTrigger id="status" className="h-11 rounded-lg shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && <p className="text-xs text-red-500">{form.formState.errors.status.message}</p>}
              </div>

              <div className="sm:col-span-2 grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" className="min-h-[96px] rounded-lg shadow-sm" {...form.register('notes')} />
              </div>

              <div className="sm:col-span-2 grid gap-2">
                <Label htmlFor="rulesAndRegulations">Rules & Regulations</Label>
                <Textarea
                  id="rulesAndRegulations"
                  className="min-h-[120px] rounded-lg shadow-sm"
                  placeholder="Enter course rules and regulations"
                  {...form.register('rulesAndRegulations')}
                />
              </div>

              <div className="sm:col-span-2 grid gap-2">
                <Label htmlFor="materials">Materials</Label>
                <Textarea
                  id="materials"
                  className="min-h-[120px] rounded-lg shadow-sm"
                  placeholder="Enter materials, tools, books, kits, or supplies required for this course"
                  {...form.register('materials')}
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-lg px-4 h-10" onClick={() => { setOpen(false); clearForm(); }} disabled={submitting}>
                Cancel
              </Button>
              <LoadingButton type="submit" className="rounded-lg px-5 h-10" isLoading={submitting} loadingText="Saving...">
                Save Course
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

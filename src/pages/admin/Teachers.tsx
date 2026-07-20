'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useForm, Controller, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Eye, UploadCloud, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';

const STATUSES = ['Active', 'Inactive'] as const;

const teacherFormSchema = z.object({
  photo: z.string().optional(),
  badgeId: z.string().min(1, 'Badge ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  age: z.coerce.number().min(1, 'Age is required'),
  email: z.string().email('Email is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  phone: z.string().optional(),
  schoolCollege: z.string().min(1, 'School / college is required'),
  parentGuardianDetails: z.string().min(1, 'Parent / guardian details are required'),
  address: z.string().min(1, 'Address is required'),
  className: z.string().min(1, 'Class is required'),
  currentSubjectCourse: z.string().min(1, 'Current subject / course is required'),
  experience: z.coerce.number().min(0, 'Experience is required'),
  specialization: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
  qualification: z.string().optional(),
  joiningDate: z.string().optional(),
  bio: z.string().optional(),
  teacherDocuments: z.object({
    aadhaarCard: z.object({
      fileName: z.string().optional(),
      fileUrl: z.string().optional(),
      fileType: z.string().optional(),
      uploadedAt: z.string().optional(),
    }).optional(),
    panCard: z.object({
      fileName: z.string().optional(),
      fileUrl: z.string().optional(),
      fileType: z.string().optional(),
      uploadedAt: z.string().optional(),
    }).optional(),
    offerLetter: z.object({
      fileName: z.string().optional(),
      fileUrl: z.string().optional(),
      fileType: z.string().optional(),
      uploadedAt: z.string().optional(),
    }).optional(),
    incrementLetter: z.object({
      fileName: z.string().optional(),
      fileUrl: z.string().optional(),
      fileType: z.string().optional(),
      uploadedAt: z.string().optional(),
    }).optional(),
  }).optional(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

type Teacher = {
  id: string;
  photo?: string;
  badgeId: string;
  fullName: string;
  dob?: string;
  age?: number;
  email: string;
  bloodGroup?: string;
  gender?: string;
  phone?: string;
  schoolCollege?: string;
  parentGuardianDetails?: string;
  address?: string;
  className?: string;
  currentSubjectCourse?: string;
  experience?: number;
  specialization?: string;
  status: 'Active' | 'Inactive';
  qualification?: string;
  joiningDate?: string;
  bio?: string;
  teacherDocuments?: {
    aadhaarCard?: {
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
      uploadedAt?: string;
    };
    panCard?: {
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
      uploadedAt?: string;
    };
    offerLetter?: {
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
      uploadedAt?: string;
    };
    incrementLetter?: {
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
      uploadedAt?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
};

const defaultValues: TeacherFormValues = {
  photo: '',
  badgeId: '',
  fullName: '',
  dob: '',
  age: 1,
  email: '',
  bloodGroup: '',
  gender: 'Male',
  phone: '',
  schoolCollege: '',
  parentGuardianDetails: '',
  address: '',
  className: '',
  currentSubjectCourse: '',
  experience: 0,
  specialization: '',
  status: 'Active',
  qualification: '',
  joiningDate: '',
  bio: '',
  teacherDocuments: {
    aadhaarCard: { fileName: '', fileUrl: '', fileType: '', uploadedAt: '' },
    panCard: { fileName: '', fileUrl: '', fileType: '', uploadedAt: '' },
    offerLetter: { fileName: '', fileUrl: '', fileType: '', uploadedAt: '' },
    incrementLetter: { fileName: '', fileUrl: '', fileType: '', uploadedAt: '' },
  },
};

const formatDateInputValue = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const mapTeacherToForm = (teacher: Teacher): TeacherFormValues => ({
  photo: teacher.photo ?? '',
  badgeId: teacher.badgeId ?? '',
  fullName: teacher.fullName,
  dob: formatDateInputValue(teacher.dob),
  age: teacher.age ?? 1,
  email: teacher.email,
  bloodGroup: teacher.bloodGroup ?? '',
  gender: (teacher.gender as 'Male' | 'Female' | 'Other') ?? 'Male',
  phone: teacher.phone ?? '',
  schoolCollege: teacher.schoolCollege ?? '',
  parentGuardianDetails: teacher.parentGuardianDetails ?? '',
  address: teacher.address ?? '',
  className: teacher.className ?? '',
  currentSubjectCourse: teacher.currentSubjectCourse ?? '',
  experience: teacher.experience ?? 0,
  specialization: teacher.specialization ?? '',
  status: teacher.status ?? 'Active',
  qualification: teacher.qualification ?? '',
  joiningDate: formatDateInputValue(teacher.joiningDate),
  bio: teacher.bio ?? '',
  teacherDocuments: teacher.teacherDocuments || {
    aadhaarCard: { fileName: '', fileUrl: '', fileType: '', uploadedAt: '' },
    panCard: { fileName: '', fileUrl: '', fileType: '', uploadedAt: '' },
    offerLetter: { fileName: '', fileUrl: '', fileType: '', uploadedAt: '' },
    incrementLetter: { fileName: '', fileUrl: '', fileType: '', uploadedAt: '' },
  },
});

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<Record<string, boolean>>({});

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const watchedDob = watch('dob');
  const photoValue = watch('photo');
  const aadhaarCardValue = watch('teacherDocuments.aadhaarCard.fileUrl');
  const panCardValue = watch('teacherDocuments.panCard.fileUrl');
  const offerLetterValue = watch('teacherDocuments.offerLetter.fileUrl');
  const incrementLetterValue = watch('teacherDocuments.incrementLetter.fileUrl');
  const itemsPerPage = 6;

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teachers');
      const data = await response.json();
      setTeachers(data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    if (!watchedDob) return;
    const date = new Date(watchedDob);
    if (Number.isNaN(date.getTime())) return;
    const age = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (age > 0) {
      setValue('age', age, { shouldValidate: false });
    }
  }, [watchedDob, setValue]);

  const openAddTeacher = () => {
    setEditingTeacher(null);
    reset(defaultValues);
    setFormOpen(true);
  };

  const openEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    reset(mapTeacherToForm(teacher));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTeacher(null);
    reset(defaultValues);
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'teacher-photos');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setValue('photo', data.url);
    } catch (error) {
      console.error('Photo upload error:', error);
      // Fallback to data URL if upload fails
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setValue('photo', reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDocumentUpload = async (event: ChangeEvent<HTMLInputElement>, fieldName: 'teacherDocuments.aadhaarCard.fileUrl' | 'teacherDocuments.panCard.fileUrl' | 'teacherDocuments.offerLetter.fileUrl' | 'teacherDocuments.incrementLetter.fileUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, JPG, JPEG, or PNG files only.');
      return;
    }

    // Validate file size (5 MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 5 MB. Please upload a smaller file.');
      return;
    }

    const docKey = fieldName;
    setUploadingDoc(prev => ({ ...prev, [docKey]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'teacher-documents');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setValue(fieldName as Path<TeacherFormValues>, data.url);
      setValue(fieldName.replace('.fileUrl', '.fileName') as Path<TeacherFormValues>, file.name);
      setValue(fieldName.replace('.fileUrl', '.fileType') as Path<TeacherFormValues>, file.type);
      setValue(fieldName.replace('.fileUrl', '.uploadedAt') as Path<TeacherFormValues>, new Date().toISOString());
      toast.success('Document uploaded successfully.');
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploadingDoc(prev => ({ ...prev, [docKey]: false }));
    }
  };

  const onSubmit = async (values: TeacherFormValues) => {
    const isEdit = Boolean(editingTeacher?.id);
    const url = isEdit ? `/api/teachers/${editingTeacher?.id}` : '/api/teachers';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save teacher');
      }

      toast.success(isEdit ? 'Teacher updated successfully.' : 'Teacher added successfully.');
      closeForm();
      await fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast.error((error as Error).message || 'Unable to save teacher.');
    }
  };

  const filteredTeachers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesQuery =
        !query ||
        teacher.fullName.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query) ||
        teacher.specialization.toLowerCase().includes(query);

      const matchesStatus = filterStatus === 'All' || teacher.status === filterStatus;

      return matchesQuery && matchesStatus;
    });
  }, [teachers, searchQuery, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / itemsPerPage));
  const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} talented art instructors`}
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr] items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-11 rounded-2xl"
              placeholder="Search by name, email, or specialization..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Select
            value={filterStatus}
            onValueChange={(value) => {
              setFilterStatus(value as 'All' | 'Active' | 'Inactive');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="rounded-2xl w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      <div className="rounded-3xl bg-white p-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading teachers...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {teachers.length === 0
              ? 'No teachers found. Add a teacher to populate the table.'
              : 'No matching teachers found. Adjust your search or filters.'}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-3xl bg-white">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-0">
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Photo</TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Name</TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Badge ID</TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Specialization</TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Subject / Course</TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Experience</TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {paginatedTeachers.map((teacher) => (
                    <TableRow key={teacher.id} className="border-0 hover:bg-slate-50 transition-colors">
                      <TableCell className="px-6 py-5">
                        <Avatar name={teacher.fullName} src={teacher.photo} size={40} />
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="font-semibold text-slate-900">{teacher.fullName}</div>
                        <div className="text-xs text-muted-foreground">{teacher.email}</div>
                      </TableCell>
                      <TableCell className="px-6 py-5 font-mono text-sm text-slate-600">{teacher.badgeId || '—'}</TableCell>
                      <TableCell className="px-6 py-5 text-slate-700">{teacher.specialization}</TableCell>
                      <TableCell className="px-6 py-5 text-slate-700">{teacher.currentSubjectCourse || '—'}</TableCell>
                      <TableCell className="px-6 py-5 text-slate-700">{teacher.experience ?? 0} yrs</TableCell>
                      <TableCell className="px-6 py-5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          teacher.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {teacher.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setViewTeacher(teacher)}>
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button variant="secondary" size="sm" className="h-8 px-3 text-xs" onClick={() => openEditTeacher(teacher)}>
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={formOpen} onOpenChange={(opened) => { if (!opened) closeForm(); }}>
        <SheetContent className="w-full sm:max-w-[60rem] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingTeacher ? 'Edit Teacher' : 'Add Teacher'}</SheetTitle>
          </SheetHeader>

          <form className="grid gap-6 py-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="space-y-6 rounded-[32px] border border-slate-200 bg-slate-50 p-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <div className="mb-4 text-sm font-semibold text-slate-900">Photo</div>
                  <div className="mx-auto h-36 w-36 overflow-hidden rounded-[28px] bg-slate-100">
                    {photoValue ? (
                      <img src={photoValue} alt="Teacher photo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">Preview</div>
                    )}
                  </div>
                  <LoadingButton type="button" variant="outline" className="mt-6 w-full" onClick={() => document.getElementById('teacher-photo-input')?.click()} isLoading={uploadingPhoto} loadingText="Uploading...">
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Upload photo
                  </LoadingButton>
                  <input id="teacher-photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <div className="mb-4 text-sm font-semibold text-slate-900">Teacher Documents</div>
                  
                  <div className="space-y-4">
                    {/* Aadhaar Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">Aadhaar Card</span>
                      </div>
                      <div className="mb-2 text-xs text-slate-600">
                        {aadhaarCardValue ? (
                          <span className="text-emerald-600 font-medium">File uploaded</span>
                        ) : (
                          <span className="text-slate-400">No file selected</span>
                        )}
                      </div>
                      <LoadingButton
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-9 text-xs"
                        onClick={() => document.getElementById('aadhaar-card-input')?.click()}
                        isLoading={uploadingDoc['teacherDocuments.aadhaarCard.fileUrl']}
                        loadingText="Uploading..."
                      >
                        <UploadCloud className="w-3 h-3 mr-2" />
                        Upload Aadhaar Card
                      </LoadingButton>
                      <input
                        id="aadhaar-card-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'teacherDocuments.aadhaarCard.fileUrl')}
                      />
                    </div>

                    {/* PAN Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">PAN Card</span>
                      </div>
                      <div className="mb-2 text-xs text-slate-600">
                        {panCardValue ? (
                          <span className="text-emerald-600 font-medium">File uploaded</span>
                        ) : (
                          <span className="text-slate-400">No file selected</span>
                        )}
                      </div>
                      <LoadingButton
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-9 text-xs"
                        onClick={() => document.getElementById('pan-card-input')?.click()}
                        isLoading={uploadingDoc['teacherDocuments.panCard.fileUrl']}
                        loadingText="Uploading..."
                      >
                        <UploadCloud className="w-3 h-3 mr-2" />
                        Upload PAN Card
                      </LoadingButton>
                      <input
                        id="pan-card-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'teacherDocuments.panCard.fileUrl')}
                      />
                    </div>

                    {/* Offer Letter */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">Offer Letter</span>
                      </div>
                      <div className="mb-2 text-xs text-slate-600">
                        {offerLetterValue ? (
                          <span className="text-emerald-600 font-medium">File uploaded</span>
                        ) : (
                          <span className="text-slate-400">No file selected</span>
                        )}
                      </div>
                      <LoadingButton
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-9 text-xs"
                        onClick={() => document.getElementById('offer-letter-input')?.click()}
                        isLoading={uploadingDoc['teacherDocuments.offerLetter.fileUrl']}
                        loadingText="Uploading..."
                      >
                        <UploadCloud className="w-3 h-3 mr-2" />
                        Upload Offer Letter
                      </LoadingButton>
                      <input
                        id="offer-letter-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'teacherDocuments.offerLetter.fileUrl')}
                      />
                    </div>

                    {/* Increment Letter */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">Increment Letter</span>
                      </div>
                      <div className="mb-2 text-xs text-slate-600">
                        {incrementLetterValue ? (
                          <span className="text-emerald-600 font-medium">File uploaded</span>
                        ) : (
                          <span className="text-slate-400">No file selected</span>
                        )}
                      </div>
                      <LoadingButton
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-9 text-xs"
                        onClick={() => document.getElementById('increment-letter-input')?.click()}
                        isLoading={uploadingDoc['teacherDocuments.incrementLetter.fileUrl']}
                        loadingText="Uploading..."
                      >
                        <UploadCloud className="w-3 h-3 mr-2" />
                        Upload Increment Letter
                      </LoadingButton>
                      <input
                        id="increment-letter-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'teacherDocuments.incrementLetter.fileUrl')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" {...register('fullName')} />
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="badgeId">Badge ID</Label>
                    <Input id="badgeId" {...register('badgeId')} disabled={editingTeacher !== null} />
                    {errors.badgeId && <p className="text-sm text-destructive">{errors.badgeId.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register('phone')} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" {...register('dob')} />
                    {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" min={1} {...register('age', { valueAsNumber: true })} />
                    {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Input id="bloodGroup" {...register('bloodGroup')} />
                    {errors.bloodGroup && <p className="text-sm text-destructive">{errors.bloodGroup.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schoolCollege">School / College</Label>
                    <Input id="schoolCollege" {...register('schoolCollege')} />
                    {errors.schoolCollege && <p className="text-sm text-destructive">{errors.schoolCollege.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="parentGuardianDetails">Parent / Guardian</Label>
                    <Input id="parentGuardianDetails" {...register('parentGuardianDetails')} />
                    {errors.parentGuardianDetails && <p className="text-sm text-destructive">{errors.parentGuardianDetails.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" rows={4} {...register('address')} />
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="className">Class</Label>
                    <Input id="className" {...register('className')} />
                    {errors.className && <p className="text-sm text-destructive">{errors.className.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currentSubjectCourse">Subject / Course</Label>
                    <Input id="currentSubjectCourse" {...register('currentSubjectCourse')} />
                    {errors.currentSubjectCourse && <p className="text-sm text-destructive">{errors.currentSubjectCourse.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input id="specialization" {...register('specialization')} />
                    {errors.specialization && <p className="text-sm text-destructive">{errors.specialization.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Input id="experience" type="number" min={0} {...register('experience', { valueAsNumber: true })} />
                    {errors.experience && <p className="text-sm text-destructive">{errors.experience.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input id="qualification" {...register('qualification')} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input id="joiningDate" type="date" {...register('joiningDate')} />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" rows={4} {...register('bio')} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <Button variant="outline" type="button" onClick={closeForm} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <LoadingButton type="submit" className="bg-primary text-white px-6 py-3" isLoading={isSubmitting} loadingText={editingTeacher ? 'Updating...' : 'Saving...'}>
                      {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
                    </LoadingButton>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(viewTeacher)} onOpenChange={(opened) => { if (!opened) setViewTeacher(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
          </DialogHeader>
          {viewTeacher && (
            <div className="grid gap-6 py-4">
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center sm:flex-row sm:text-left">
                <Avatar name={viewTeacher.fullName} src={viewTeacher.photo} size={72} />
                <div>
                  <div className="text-xl font-semibold text-slate-950">{viewTeacher.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    {viewTeacher.specialization}
                  </div>
                  <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900">
                    {viewTeacher.status}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Contact</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div>Email: {viewTeacher.email}</div>
                    <div>Phone: {viewTeacher.phone || 'N/A'}</div>
                    <div>Address: {viewTeacher.address || 'N/A'}</div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Profile</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div>DOB: {viewTeacher.dob || 'N/A'}</div>
                    <div>Age: {viewTeacher.age ?? 'N/A'}</div>
                    <div>Blood Group: {viewTeacher.bloodGroup || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Academic</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div>School / College: {viewTeacher.schoolCollege || 'N/A'}</div>
                    <div>Class: {viewTeacher.className || 'N/A'}</div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Work</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div>Subject / Course: {viewTeacher.currentSubjectCourse || 'N/A'}</div>
                    <div>Specialization: {viewTeacher.specialization}</div>
                    <div>Experience: {viewTeacher.experience ?? 0} yrs</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Documents</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {viewTeacher.teacherDocuments?.aadhaarCard?.fileUrl ? (
                    <a
                      href={viewTeacher.teacherDocuments.aadhaarCard.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Aadhaar Card</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>Aadhaar Card - Not uploaded</span>
                    </div>
                  )}
                  {viewTeacher.teacherDocuments?.panCard?.fileUrl ? (
                    <a
                      href={viewTeacher.teacherDocuments.panCard.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>PAN Card</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>PAN Card - Not uploaded</span>
                    </div>
                  )}
                  {viewTeacher.teacherDocuments?.offerLetter?.fileUrl ? (
                    <a
                      href={viewTeacher.teacherDocuments.offerLetter.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Offer Letter</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>Offer Letter - Not uploaded</span>
                    </div>
                  )}
                  {viewTeacher.teacherDocuments?.incrementLetter?.fileUrl ? (
                    <a
                      href={viewTeacher.teacherDocuments.incrementLetter.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Increment Letter</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>Increment Letter - Not uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

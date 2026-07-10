"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Plus, Search, Pencil, Eye, UploadCloud, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/shared/Avatar";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface SeniorTeacherItem {
  id: string;
  badgeId: string;
  fullName: string;
  email: string;
  phone: string;
  dob?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  schoolCollege?: string;
  parentGuardianDetails?: string;
  address: string;
  className?: string;
  currentSubjectCourse?: string;
  specialization: string;
  yearsOfExperience: number;
  role?: string;
  qualification: string;
  joiningDate: string;
  salary?: number;
  bio?: string;
  profileImage?: string;
  status: "Active" | "Inactive";
  assignedClasses: number;
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
}

type SeniorTeacherForm = {
  id?: string;
  badgeId: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  age: number;
  gender: string;
  bloodGroup: string;
  schoolCollege: string;
  parentGuardianDetails: string;
  address: string;
  className: string;
  currentSubjectCourse: string;
  specialization: string;
  yearsOfExperience: number;
  role?: string;
  qualification: string;
  joiningDate: string;
  salary?: number;
  bio: string;
  profileImage: string;
  status: "Active" | "Inactive";
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
};

const SPECIALIZATIONS = ["Watercolor", "Oil Painting", "Sketching", "Digital Art", "Sculpture"];
const ROLES = ["Senior Faculty", "Lead Instructor", "Department Head"];
const STATUSES = ["Active", "Inactive"] as const;

const defaultForm: SeniorTeacherForm = {
  badgeId: "",
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  age: 0,
  gender: "",
  bloodGroup: "",
  schoolCollege: "",
  parentGuardianDetails: "",
  address: "",
  className: "",
  currentSubjectCourse: "",
  specialization: "",
  yearsOfExperience: 1,
  role: "",
  qualification: "",
  joiningDate: "",
  salary: undefined,
  bio: "",
  profileImage: "",
  status: "Active",
  teacherDocuments: {
    aadhaarCard: { fileName: "", fileUrl: "", fileType: "", uploadedAt: "" },
    panCard: { fileName: "", fileUrl: "", fileType: "", uploadedAt: "" },
    offerLetter: { fileName: "", fileUrl: "", fileType: "", uploadedAt: "" },
    incrementLetter: { fileName: "", fileUrl: "", fileType: "", uploadedAt: "" },
  },
};

const formatDateInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const mapTeacherToForm = (teacher: SeniorTeacherItem): SeniorTeacherForm => ({
  id: teacher.id,
  badgeId: teacher.badgeId ?? "",
  fullName: teacher.fullName ?? "",
  email: teacher.email ?? "",
  phone: teacher.phone ?? "",
  dob: formatDateInputValue(teacher.dob),
  age: teacher.age ?? 0,
  gender: teacher.gender ?? "",
  bloodGroup: teacher.bloodGroup ?? "",
  schoolCollege: teacher.schoolCollege ?? "",
  parentGuardianDetails: teacher.parentGuardianDetails ?? "",
  address: teacher.address ?? "",
  className: teacher.className ?? "",
  currentSubjectCourse: teacher.currentSubjectCourse ?? "",
  specialization: teacher.specialization ?? "",
  yearsOfExperience: teacher.yearsOfExperience ?? 1,
  role: teacher.role ?? "",
  qualification: teacher.qualification ?? "",
  joiningDate: formatDateInputValue(teacher.joiningDate),
  salary: teacher.salary,
  bio: teacher.bio ?? "",
  profileImage: teacher.profileImage ?? "",
  status: teacher.status ?? "Active",
  teacherDocuments: teacher.teacherDocuments || {
    aadhaarCard: { fileName: "", fileUrl: "", fileType: "", uploadedAt: "" },
    panCard: { fileName: "", fileUrl: "", fileType: "", uploadedAt: "" },
    offerLetter: { fileName: "", fileUrl: "", fileType: "", uploadedAt: "" },
    incrementLetter: { fileName: "", fileUrl: "", fileType: "", uploadedAt: "" },
  },
});

const buildTeacherPayload = (form: SeniorTeacherForm) => ({
  badgeId: form.badgeId,
  fullName: form.fullName,
  email: form.email,
  phone: form.phone || undefined,
  dob: form.dob || undefined,
  age: form.age || undefined,
  gender: form.gender || undefined,
  bloodGroup: form.bloodGroup || undefined,
  schoolCollege: form.schoolCollege || undefined,
  parentGuardianDetails: form.parentGuardianDetails || undefined,
  address: form.address || undefined,
  className: form.className || undefined,
  currentSubjectCourse: form.currentSubjectCourse || undefined,
  specialization: form.specialization,
  yearsOfExperience: form.yearsOfExperience,
  qualification: form.qualification || undefined,
  joiningDate: form.joiningDate || undefined,
  bio: form.bio || undefined,
  profileImage: form.profileImage || undefined,
  status: form.status,
  teacherDocuments: form.teacherDocuments,
});

export default function SeniorTeachersPage() {
  const [teachers, setTeachers] = useState<SeniorTeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState("All");
  const [role, setRole] = useState("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewTeacher, setViewTeacher] = useState<SeniorTeacherItem | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<SeniorTeacherItem | null>(null);
  const [form, setForm] = useState<SeniorTeacherForm>(defaultForm);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/senior-teachers");
      const data = await response.json();
      setTeachers(data.teachers || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Failed to load senior teachers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    if (!form.dob) return;
    const date = new Date(form.dob);
    if (Number.isNaN(date.getTime())) return;
    const age = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (age !== form.age) {
      setForm((current) => ({ ...current, age }));
    }
  }, [form.dob, form.age]);

  const openAddTeacher = () => {
    setEditingTeacher(null);
    setForm(defaultForm);
    setSheetOpen(true);
  };

  const openEditTeacher = (teacher: SeniorTeacherItem) => {
    setEditingTeacher(teacher);
    setForm(mapTeacherToForm(teacher));
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingTeacher(null);
    setForm(defaultForm);
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, JPEG, or PNG files only.');
      return;
    }

    // Validate file size (5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 5 MB. Please upload a smaller file.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "senior-teacher-profiles");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setForm((current) => ({ ...current, profileImage: data.url }));
      toast.success('Photo uploaded successfully.');
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error('Failed to upload photo. Please try again.');
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

    // Validate file size (5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 5 MB. Please upload a smaller file.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'senior-teacher-documents');

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
      const docType = fieldName.split('.')[1];
      setForm((current) => ({
        ...current,
        teacherDocuments: {
          ...current.teacherDocuments,
          [docType]: {
            fileName: file.name,
            fileUrl: data.url,
            fileType: file.type,
            uploadedAt: new Date().toISOString(),
          },
        },
      }));
      toast.success('Document uploaded successfully.');
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error('Failed to upload document. Please try again.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildTeacherPayload(form);
    const isEdit = Boolean(editingTeacher?.id);
    const url = isEdit ? `/api/senior-teachers/${editingTeacher!.id}` : "/api/senior-teachers";
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to save senior teacher");
      }

      toast.success(isEdit ? "Senior teacher updated successfully" : "Senior teacher added successfully");
      closeSheet();
      await fetchTeachers();
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast.error((error as Error).message || "Unable to save senior teacher");
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesQuery =
        !query ||
        teacher.fullName.toLowerCase().includes(query.toLowerCase()) ||
        teacher.email.toLowerCase().includes(query.toLowerCase()) ||
        teacher.specialization.toLowerCase().includes(query.toLowerCase());

      const matchesSpec = specialization === "All" || teacher.specialization === specialization;
      const matchesRole = role === "All" || teacher.role === role;
      return matchesQuery && matchesSpec && matchesRole;
    });
  }, [teachers, query, specialization, role]);

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Senior Teachers"
        subtitle={`${teachers.length} senior art instructors`}
      />

      <div className="card-soft p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email or specialization..."
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={specialization} onValueChange={(value) => {
          setSpecialization(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="rounded-xl sm:w-48">
            <SelectValue placeholder="Specialization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All specializations</SelectItem>
            {SPECIALIZATIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={(value) => {
          setRole(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="rounded-xl sm:w-48">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading senior teachers...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {teachers.length === 0 ? "No senior teachers yet. Add a senior teacher to get started." : "No matching senior teachers found."}
          </div>
        ) : (
          <>
            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Teacher",
                  render: (row) => {
                    const teacher = row as unknown as SeniorTeacherItem;
                    return (
                      <div className="flex items-center gap-3">
                        <Avatar name={teacher.fullName} src={teacher.profileImage} />
                        <div>
                          <div className="font-bold">{teacher.fullName}</div>
                          <div className="text-xs text-muted-foreground">{teacher.email || "N/A"}</div>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: "badgeId",
                  header: "Badge ID",
                  render: (row) => {
                    const teacher = row as unknown as SeniorTeacherItem;
                    return <span className="font-mono text-sm">{teacher.badgeId}</span>;
                  },
                },
                { key: "specialization", header: "Specialization" },
                {
                  key: "yearsOfExperience",
                  header: "Experience",
                  render: (row) => `${(row as unknown as SeniorTeacherItem).yearsOfExperience} years`,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => (
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        (row as unknown as SeniorTeacherItem).status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {(row as unknown as SeniorTeacherItem).status}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (row) => {
                    const teacher = row as unknown as SeniorTeacherItem;
                    return (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditTeacher(teacher)}>
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setViewTeacher(teacher)}>
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              rows={paginatedTeachers as unknown as Record<string, string | number | boolean>[]}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 p-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingTeacher ? "Edit Senior Teacher" : "Add Senior Teacher"}</SheetTitle>
          </SheetHeader>
          <form className="grid gap-6 py-4" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-[280px_1fr]">
              {/* Left Column - Photo and Documents */}
              <div className="space-y-4">
                {/* Photo Upload */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 mb-3">Photo</div>
                  <div className="mx-auto h-32 w-32 overflow-hidden rounded-3xl bg-slate-100 mb-3">
                    {form.profileImage ? (
                      <img src={form.profileImage} alt="Teacher" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" className="w-full h-9 text-xs" onClick={() => document.getElementById("teacher-photo-input")?.click()}>
                    Upload Photo
                  </Button>
                  <input
                    id="teacher-photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                {/* Teacher Documents */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 mb-3">Documents</div>
                  <div className="space-y-3">
                    {/* Aadhaar Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-900">Aadhaar Card</span>
                      </div>
                      <div className="mb-2 text-xs text-slate-600">
                        {form.teacherDocuments?.aadhaarCard?.fileUrl ? (
                          <span className="text-emerald-600 font-medium">File uploaded</span>
                        ) : (
                          <span className="text-slate-400">No file selected</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => document.getElementById('aadhaar-card-input')?.click()}
                      >
                        <UploadCloud className="w-3 h-3 mr-2" />
                        Upload
                      </Button>
                      <input
                        id="aadhaar-card-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'teacherDocuments.aadhaarCard.fileUrl')}
                      />
                    </div>

                    {/* PAN Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-900">PAN Card</span>
                      </div>
                      <div className="mb-2 text-xs text-slate-600">
                        {form.teacherDocuments?.panCard?.fileUrl ? (
                          <span className="text-emerald-600 font-medium">File uploaded</span>
                        ) : (
                          <span className="text-slate-400">No file selected</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => document.getElementById('pan-card-input')?.click()}
                      >
                        <UploadCloud className="w-3 h-3 mr-2" />
                        Upload
                      </Button>
                      <input
                        id="pan-card-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'teacherDocuments.panCard.fileUrl')}
                      />
                    </div>

                    {/* Offer Letter */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-900">Offer Letter</span>
                      </div>
                      <div className="mb-2 text-xs text-slate-600">
                        {form.teacherDocuments?.offerLetter?.fileUrl ? (
                          <span className="text-emerald-600 font-medium">File uploaded</span>
                        ) : (
                          <span className="text-slate-400">No file selected</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => document.getElementById('offer-letter-input')?.click()}
                      >
                        <UploadCloud className="w-3 h-3 mr-2" />
                        Upload
                      </Button>
                      <input
                        id="offer-letter-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'teacherDocuments.offerLetter.fileUrl')}
                      />
                    </div>

                    {/* Increment Letter */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-900">Increment Letter</span>
                      </div>
                      <div className="mb-2 text-xs text-slate-600">
                        {form.teacherDocuments?.incrementLetter?.fileUrl ? (
                          <span className="text-emerald-600 font-medium">File uploaded</span>
                        ) : (
                          <span className="text-slate-400">No file selected</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => document.getElementById('increment-letter-input')?.click()}
                      >
                        <UploadCloud className="w-3 h-3 mr-2" />
                        Upload
                      </Button>
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

              {/* Right Column - Form Fields */}
              <div className="space-y-4">
                {/* Row 1: Full Name, Badge ID */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="badgeId">Badge ID</Label>
                    <Input
                      id="badgeId"
                      value={form.badgeId}
                      onChange={(e) => setForm((current) => ({ ...current, badgeId: e.target.value }))}
                      disabled={editingTeacher !== null}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Email, Phone */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Row 3: Date of Birth, Age */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={form.dob}
                      onChange={(e) => setForm((current) => ({ ...current, dob: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={form.age || ""}
                      onChange={(e) => setForm((current) => ({ ...current, age: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                {/* Row 4: Blood Group, Gender */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Input
                      id="bloodGroup"
                      value={form.bloodGroup}
                      onChange={(e) => setForm((current) => ({ ...current, bloodGroup: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={form.gender} onValueChange={(value) => setForm((current) => ({ ...current, gender: value }))}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 5: School / College, Qualification */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="schoolCollege">School / College</Label>
                    <Input
                      id="schoolCollege"
                      value={form.schoolCollege}
                      onChange={(e) => setForm((current) => ({ ...current, schoolCollege: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input
                      id="qualification"
                      value={form.qualification}
                      onChange={(e) => setForm((current) => ({ ...current, qualification: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Row 6: Parent / Guardian (Full Width) */}
                <div className="grid gap-2">
                  <Label htmlFor="parentGuardianDetails">Parent / Guardian</Label>
                  <Input
                    id="parentGuardianDetails"
                    value={form.parentGuardianDetails}
                    onChange={(e) => setForm((current) => ({ ...current, parentGuardianDetails: e.target.value }))}
                  />
                </div>

                {/* Row 7: Address (Full Width) */}
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                  />
                </div>

                {/* Row 8: Class, Subject / Course, Specialization (Text Field) */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="className">Class</Label>
                    <Input
                      id="className"
                      value={form.className}
                      onChange={(e) => setForm((current) => ({ ...current, className: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currentSubjectCourse">Subject / Course</Label>
                    <Input
                      id="currentSubjectCourse"
                      value={form.currentSubjectCourse}
                      onChange={(e) => setForm((current) => ({ ...current, currentSubjectCourse: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={form.specialization}
                      onChange={(e) => setForm((current) => ({ ...current, specialization: e.target.value }))}
                      placeholder="e.g., Oil Painting, Watercolor"
                    />
                  </div>
                </div>

                {/* Row 9: Years of Experience, Joining Date */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      value={form.yearsOfExperience}
                      onChange={(e) => setForm((current) => ({ ...current, yearsOfExperience: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => setForm((current) => ({ ...current, joiningDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Row 10: Bio (Full Width) */}
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))}
                  />
                </div>

                {/* Row 11: Status */}
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => setForm((current) => ({ ...current, status: value as "Active" | "Inactive" }))}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={closeSheet}>
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto rounded-xl gradient-primary text-white border-0 shadow-pop">
                {editingTeacher ? "Update Senior Teacher" : "Add Senior Teacher"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={!!viewTeacher} onOpenChange={(open) => !open && setViewTeacher(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Senior Teacher Profile</DialogTitle>
          </DialogHeader>
          {viewTeacher && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center justify-between gap-4 p-4 rounded-3xl border border-border bg-background">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 rounded-3xl overflow-hidden bg-muted">
                    {viewTeacher.profileImage ? (
                      <img src={viewTeacher.profileImage} alt={viewTeacher.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <Avatar name={viewTeacher.fullName} />
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{viewTeacher.fullName}</div>
                    <div className="text-sm text-muted-foreground">{viewTeacher.email || "No email provided"}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-muted px-2 py-1">{viewTeacher.specialization}</span>
                      <span className="rounded-full bg-muted px-2 py-1">{viewTeacher.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border bg-background p-5">
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Personal details</div>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="font-medium">Badge ID:</span> {viewTeacher.badgeId || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">DOB:</span> {formatDateInputValue(viewTeacher.dob) || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Age:</span> {viewTeacher.age ?? "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Gender:</span> {viewTeacher.gender || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Blood group:</span> {viewTeacher.bloodGroup || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {viewTeacher.phone || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Address:</span> {viewTeacher.address || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-border bg-background p-5">
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Education details</div>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="font-medium">School / College:</span> {viewTeacher.schoolCollege || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Qualification:</span> {viewTeacher.qualification || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Parent / Guardian:</span> {viewTeacher.parentGuardianDetails || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border bg-background p-5">
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Professional details</div>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="font-medium">Specialization:</span> {viewTeacher.specialization || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Experience:</span> {viewTeacher.yearsOfExperience || "N/A"} years
                    </div>
                    <div>
                      <span className="font-medium">Class:</span> {viewTeacher.className || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Subject / Course:</span> {viewTeacher.currentSubjectCourse || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-border bg-background p-5">
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Employment details</div>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="font-medium">Joining date:</span> {formatDateInputValue(viewTeacher.joiningDate) || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {viewTeacher.status || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Assigned Classes:</span> {viewTeacher.assignedClasses || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background p-5">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Bio</div>
                <div className="text-sm">{viewTeacher.bio || "No bio provided"}</div>
              </div>

              <div className="rounded-3xl border border-border bg-background p-5">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Documents</div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="font-medium">Aadhaar Card</span>
                    </div>
                    {viewTeacher.teacherDocuments?.aadhaarCard?.fileUrl ? (
                      <Button size="sm" variant="outline" onClick={() => window.open(viewTeacher.teacherDocuments!.aadhaarCard!.fileUrl, '_blank')}>
                        View Document
                      </Button>
                    ) : (
                      <span className="text-slate-400">Not uploaded</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="font-medium">PAN Card</span>
                    </div>
                    {viewTeacher.teacherDocuments?.panCard?.fileUrl ? (
                      <Button size="sm" variant="outline" onClick={() => window.open(viewTeacher.teacherDocuments!.panCard!.fileUrl, '_blank')}>
                        View Document
                      </Button>
                    ) : (
                      <span className="text-slate-400">Not uploaded</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="font-medium">Offer Letter</span>
                    </div>
                    {viewTeacher.teacherDocuments?.offerLetter?.fileUrl ? (
                      <Button size="sm" variant="outline" onClick={() => window.open(viewTeacher.teacherDocuments!.offerLetter!.fileUrl, '_blank')}>
                        View Document
                      </Button>
                    ) : (
                      <span className="text-slate-400">Not uploaded</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="font-medium">Increment Letter</span>
                    </div>
                    {viewTeacher.teacherDocuments?.incrementLetter?.fileUrl ? (
                      <Button size="sm" variant="outline" onClick={() => window.open(viewTeacher.teacherDocuments!.incrementLetter!.fileUrl, '_blank')}>
                        View Document
                      </Button>
                    ) : (
                      <span className="text-slate-400">Not uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

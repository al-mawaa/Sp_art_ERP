"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, MessageSquarePlus, Pencil, Save, UploadCloud, User } from "lucide-react";
import { StudentQueryRequestModal } from "@/components/student/StudentQueryRequestModal";
import { QueryStatusBadge } from "@/components/student/QueryStatusBadge";
import type { StudentQueryDto } from "@/lib/student/studentQueryAccess";
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import type { StudentProfileDto } from "@/lib/student-portal";

export type StudentProfileData = StudentProfileDto;

const HOW_YOU_KNOW_US_OPTIONS = [
  "Social Media",
  "Google Search",
  "Friend / Relative",
  "School",
  "Newspaper",
  "Walk In",
  "Existing Student",
  "Other",
] as const;

type FormState = {
  fullName: string;
  phone: string;
  age: string;
  gender: string;
  profileImage: string;
  dob: string;
  bloodGroup: string;
  school: string;
  college: string;
  occupation: string;
  fatherName: string;
  fatherMobile: string;
  fatherOccupation: string;
  motherName: string;
  motherMobile: string;
  motherOccupation: string;
  address: string;
  howYouKnowUs: string;
};

function profileToForm(p: StudentProfileData): FormState {
  return {
    fullName: p.fullName,
    phone: p.phone,
    age: p.age != null ? String(p.age) : "",
    gender: p.gender || "",
    profileImage: p.profileImage,
    dob: p.dob || "",
    bloodGroup: p.bloodGroup || "",
    school: p.school || "",
    college: p.college || "",
    occupation: p.occupation || "",
    fatherName: p.fatherName || "",
    fatherMobile: p.fatherMobile || "",
    fatherOccupation: p.fatherOccupation || "",
    motherName: p.motherName || "",
    motherMobile: p.motherMobile || "",
    motherOccupation: p.motherOccupation || "",
    address: p.address || "",
    howYouKnowUs: p.howYouKnowUs || "",
  };
}

function formatDisplayDate(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (year && month && day) return `${day}-${month}-${year}`;
  return value;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs uppercase tracking-wide">{label}</Label>
      <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm font-medium">
        {value || "—"}
      </div>
    </div>
  );
}

export function StudentProfilePage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const [canEditProfile, setCanEditProfile] = useState(false);
  const [latestQuery, setLatestQuery] = useState<StudentQueryDto | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/profile", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load profile");
      }
      const p = data.data.profile as StudentProfileData;
      setProfile(p);
      setForm(profileToForm(p));
      setCanEditProfile(Boolean(data.data.canEditProfile));
      setLatestQuery((data.data.latestQuery as StudentQueryDto | null) ?? null);
      if (user?.email !== p.email || user?.name !== p.fullName) {
        login("student", p.email, p.fullName);
      }
    } catch (error) {
      toast.error((error as Error).message);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [login, router, user?.email, user?.name]);

  const refreshQueryStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/student/queries", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setCanEditProfile(Boolean(data.data?.canEditProfile));
        setLatestQuery((data.data?.latestQuery as StudentQueryDto | null) ?? null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "student-profiles");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm(f => (f ? { ...f, profileImage: data.url } : f));
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error((error as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form || !profile) return;
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        profileImage: form.profileImage,
        age: form.age ? Number(form.age) : null,
        dob: form.dob || null,
        bloodGroup: form.bloodGroup.trim(),
        school: form.school.trim(),
        college: form.college.trim(),
        occupation: form.occupation.trim(),
        fatherName: form.fatherName.trim(),
        fatherMobile: form.fatherMobile.trim(),
        fatherOccupation: form.fatherOccupation.trim(),
        motherName: form.motherName.trim(),
        motherMobile: form.motherMobile.trim(),
        motherOccupation: form.motherOccupation.trim(),
        address: form.address.trim(),
        howYouKnowUs: form.howYouKnowUs,
      };
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      const updated = data.data.profile as StudentProfileData;
      setProfile(prev =>
        prev
          ? {
              ...updated,
              classes: prev.classes,
              batchName: prev.batchName,
              batchTiming: prev.batchTiming,
              courseName: prev.courseName,
              teacherName: prev.teacherName,
            }
          : updated,
      );
      setForm(profileToForm(updated));
      login("student", updated.email, updated.fullName);
      setEditing(false);
      setCanEditProfile(false);
      void refreshQueryStatus();
      toast.success(data.message || "Profile saved");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profile) setForm(profileToForm(profile));
    setEditing(false);
  };

  if (loading || !profile || !form) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
        Loading your profile…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto min-h-screen pb-10">
      <PageHeader 
        title="My Profile" 
        subtitle="View and update your student details"
        action={
          <Button
            variant="outline"
            className="rounded-xl border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => setQueryOpen(true)}
          >
            <MessageSquarePlus className="w-4 h-4 mr-1" /> Request Query Form
          </Button>
        }
      />

      <div className="card-soft overflow-hidden">
        <div className="gradient-mint text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="h-28 w-28 rounded-3xl border-4 border-white/30 bg-white/20 overflow-hidden flex items-center justify-center">
              {form.profileImage ? (
                <img src={form.profileImage} alt={profile.fullName} className="h-full w-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white/80" />
              )}
            </div>
            {editing && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1" />
                  {uploading ? "Uploading…" : "Upload"}
                </Button>
              </>
            )}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="text-xs uppercase tracking-widest font-bold opacity-90">Student portal</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">{profile.fullName}</h1>
            <p className="opacity-90 text-sm mt-1">{profile.email}</p>
            <p className="opacity-75 text-xs mt-2 font-mono">ID: {profile.studentId}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
            {latestQuery && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Latest query:</span>
                <QueryStatusBadge status={latestQuery.status} />
                {latestQuery.status === "pending" && (
                  <span className="text-xs text-muted-foreground">
                    Edit Profile unlocks after admin approval
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <Button
                  className="rounded-xl gradient-primary text-white border-0"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
              </>
            ) : canEditProfile ? (
              <Button
                className="rounded-xl gradient-primary text-white border-0"
                onClick={() => setEditing(true)}
                title="Edit your profile"
              >
                <Pencil className="w-4 h-4 mr-1" /> Edit Profile
              </Button>
            ) : null}
            <Button variant="outline" className="rounded-xl" onClick={() => router.push("/student/dashboard")}>
              <Home className="w-4 h-4 mr-1" /> Home
            </Button>

          </div>

          <StudentQueryRequestModal
            open={queryOpen}
            onOpenChange={setQueryOpen}
            defaultName={profile.fullName}
            defaultEmail={profile.email}
            onSubmitted={() => {
              void refreshQueryStatus();
              void loadProfile();
            }}
          />

          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <h3 className="font-display font-bold text-lg">Personal details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {editing ? (
                <>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="fullName">Student name</Label>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <ReadOnlyField label="Badge ID" value={profile.studentId} />
                  <ReadOnlyField label="Email" value={profile.email} />
                  <div className="space-y-1.5">
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={form.dob}
                      onChange={e => setForm({ ...form, dob: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min={1}
                      max={120}
                      value={form.age}
                      onChange={e => setForm({ ...form, age: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bloodGroup">Blood group</Label>
                    <Input
                      id="bloodGroup"
                      value={form.bloodGroup}
                      onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <Select
                      value={form.gender || "unset"}
                      onValueChange={v => setForm({ ...form, gender: v === "unset" ? "" : v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Not specified</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </>
              ) : (
                <>
                  <ReadOnlyField label="Student name" value={profile.fullName} />
                  <ReadOnlyField label="Badge ID" value={profile.studentId} />
                  <ReadOnlyField label="Email" value={profile.email} />
                  <ReadOnlyField label="Date of birth" value={formatDisplayDate(profile.dob)} />
                  <ReadOnlyField label="Age" value={profile.age != null ? String(profile.age) : ""} />
                  <ReadOnlyField label="Blood group" value={profile.bloodGroup} />
                  <ReadOnlyField label="Gender" value={profile.gender} />
                  <ReadOnlyField label="Phone" value={profile.phone} />
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <h3 className="font-display font-bold text-lg">Education & occupation</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {editing ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="school">School</Label>
                    <Input
                      id="school"
                      value={form.school}
                      onChange={e => setForm({ ...form, school: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="college">College</Label>
                    <Input
                      id="college"
                      value={form.college}
                      onChange={e => setForm({ ...form, college: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={form.occupation}
                      onChange={e => setForm({ ...form, occupation: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </>
              ) : (
                <>
                  <ReadOnlyField label="School" value={profile.school} />
                  <ReadOnlyField label="College" value={profile.college} />
                  <ReadOnlyField label="Occupation" value={profile.occupation} />
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <h3 className="font-display font-bold text-lg">Parent / guardian details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {editing ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fatherName">Father&apos;s name</Label>
                    <Input
                      id="fatherName"
                      value={form.fatherName}
                      onChange={e => setForm({ ...form, fatherName: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fatherMobile">Father&apos;s mobile</Label>
                    <Input
                      id="fatherMobile"
                      value={form.fatherMobile}
                      onChange={e => setForm({ ...form, fatherMobile: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="motherName">Mother&apos;s name</Label>
                    <Input
                      id="motherName"
                      value={form.motherName}
                      onChange={e => setForm({ ...form, motherName: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="motherMobile">Mother&apos;s mobile</Label>
                    <Input
                      id="motherMobile"
                      value={form.motherMobile}
                      onChange={e => setForm({ ...form, motherMobile: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fatherOccupation">Father occupation</Label>
                    <Input
                      id="fatherOccupation"
                      value={form.fatherOccupation}
                      onChange={e => setForm({ ...form, fatherOccupation: e.target.value })}
                      className="rounded-xl"
                      placeholder="Enter father's occupation"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="motherOccupation">Mother occupation</Label>
                    <Input
                      id="motherOccupation"
                      value={form.motherOccupation}
                      onChange={e => setForm({ ...form, motherOccupation: e.target.value })}
                      className="rounded-xl"
                      placeholder="Enter mother's occupation"
                    />
                  </div>
                </>
              ) : (
                <>
                  <ReadOnlyField label="Father's name" value={profile.fatherName} />
                  <ReadOnlyField label="Father's mobile" value={profile.fatherMobile} />
                  <ReadOnlyField label="Mother's name" value={profile.motherName} />
                  <ReadOnlyField label="Mother's mobile" value={profile.motherMobile} />
                  <ReadOnlyField label="Father occupation" value={profile.fatherOccupation} />
                  <ReadOnlyField label="Mother occupation" value={profile.motherOccupation} />
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <h3 className="font-display font-bold text-lg">Address & referral</h3>
            <div className="grid gap-4">
              {editing ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      className="rounded-xl min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>How you came to know us</Label>
                    <Select
                      value={form.howYouKnowUs || "unset"}
                      onValueChange={v => setForm({ ...form, howYouKnowUs: v === "unset" ? "" : v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Not specified</SelectItem>
                        {HOW_YOU_KNOW_US_OPTIONS.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <ReadOnlyField label="Address" value={profile.address} />
                  <ReadOnlyField label="How you came to know us" value={profile.howYouKnowUs} />
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <h3 className="font-display font-bold text-lg">Class & course</h3>
            {profile.classes.length === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Batch name" value={profile.batchName} />
                <ReadOnlyField label="Batch timing" value={profile.batchTiming} />
                <ReadOnlyField label="Course name" value={profile.courseName} />
                <ReadOnlyField label="Teacher name" value={profile.teacherName} />
              </div>
            ) : (
              <div className="space-y-4">
                {profile.classes.map((cls, index) => (
                  <div key={cls.id} className="rounded-2xl border border-border/80 bg-white/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Batch {index + 1}</div>
                        <div className="text-xs text-muted-foreground">{cls.batchName}</div>
                      </div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {cls.batchTiming || "No schedule"}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ReadOnlyField label="Course name" value={cls.courseName} />
                      <ReadOnlyField label="Teacher name" value={cls.teacherName || "—"} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfilePage;

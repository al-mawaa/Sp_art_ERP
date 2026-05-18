"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

const SPECIALIZATIONS = [
  "Watercolor",
  "Sketching",
  "Clay Art",
  "Acrylic",
  "Oil Painting",
  "Digital Art",
  "Calligraphy",
];

const ROLES = [
  "Senior Faculty",
  "Head Instructor",
  "Master Trainer",
  "Workshop Mentor",
  "Senior Teacher",
];

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  specialization: z.enum(["Watercolor", "Sketching", "Clay Art", "Acrylic", "Oil Painting", "Digital Art", "Calligraphy"]),
  yearsOfExperience: z.coerce.number().min(0, "Enter years of experience"),
  role: z.enum(["Senior Faculty", "Head Instructor", "Master Trainer", "Workshop Mentor", "Senior Teacher"]),
  qualification: z.string().min(2, "Qualification is required"),
  address: z.string().min(5, "Address is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  salary: z.coerce.number().min(0, "Salary must be a number"),
  bio: z.string().optional(),
  profileImage: z.unknown().optional(),
});

export type SeniorTeacherModalFormValues = z.infer<typeof formSchema>;

export interface SeniorTeacherCreated {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  yearsOfExperience: number;
  role: string;
  qualification: string;
  address: string;
  joiningDate: string;
  salary: number;
  bio?: string;
  profileImage?: string;
  status: "Active" | "Inactive";
  assignedClasses: number;
  createdAt: string;
  updatedAt: string;
}

interface AddSeniorTeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (teacher: SeniorTeacherCreated) => void;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AddSeniorTeacherModal({ open, onOpenChange, onCreated }: AddSeniorTeacherModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SeniorTeacherModalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      specialization: "Watercolor",
      yearsOfExperience: 1,
      role: "Senior Faculty",
      qualification: "",
      address: "",
      joiningDate: "",
      salary: 0,
      bio: "",
    },
  });

  const profileImageFiles = watch("profileImage") as FileList | undefined;

  async function onSubmit(values: SeniorTeacherModalFormValues) {
    setSubmitting(true);
    try {
      let profileImage = "";
      const file = values.profileImage && values.profileImage[0];
      if (file instanceof File) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'senior-teacher-profiles');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          profileImage = uploadData.url;
        } else {
          // Fallback to data URL if upload fails
          profileImage = await readFileAsDataURL(file);
        }
      }

      const response = await fetch("/api/senior-teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          profileImage,
          status: "Active",
          assignedClasses: 0,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Unable to create senior teacher");
      }

      toast.success("Senior teacher added successfully");
      onCreated(result.teacher);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Failed to add senior teacher");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Add new senior teacher</SheetTitle>
        </SheetHeader>
        <form className="space-y-5 mt-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input placeholder="Enter name" {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="name@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+91 1234567890" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Specialization</Label>
              <Controller
                name="specialization"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pick" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.specialization && <p className="text-xs text-destructive">{errors.specialization.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Years of Experience</Label>
              <Input type="number" min={0} {...register("yearsOfExperience", { valueAsNumber: true })} />
              {errors.yearsOfExperience && <p className="text-xs text-destructive">{errors.yearsOfExperience.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pick" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(roleItem => (
                        <SelectItem key={roleItem} value={roleItem}>{roleItem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Qualification</Label>
              <Input {...register("qualification")} />
              {errors.qualification && <p className="text-xs text-destructive">{errors.qualification.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Joining Date</Label>
              <Input type="date" {...register("joiningDate")} />
              {errors.joiningDate && <p className="text-xs text-destructive">{errors.joiningDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Salary</Label>
              <Input type="number" min={0} step={100} {...register("salary", { valueAsNumber: true })} />
              {errors.salary && <p className="text-xs text-destructive">{errors.salary.message}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Textarea rows={3} placeholder="Full address" {...register("address")} />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Bio / About Teacher</Label>
              <Textarea rows={4} placeholder="About this senior teacher" {...register("bio")} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Profile Image Upload</Label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm cursor-pointer hover:bg-muted/80 w-full">
                  <ImageIcon className="w-4 h-4" />
                  <span>{profileImageFiles?.length ? profileImageFiles[0].name : "Choose image"}</span>
                  <input type="file" accept="image/*" className="hidden" {...register("profileImage")} />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto rounded-xl gradient-primary text-white border-0" disabled={submitting}>
              {submitting ? "Saving..." : "Add Senior Teacher"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

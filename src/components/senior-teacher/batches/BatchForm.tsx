"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, X, BookOpen, Calendar, MapPin, Users, Clock } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { batchWriteSchema, type BatchWriteInput } from "@/lib/validators/batch";
import type { SerializedBatch } from "@/lib/batch/types";
import { batchFetch } from "@/lib/batch/batchFetch";
import { useBatchRoutes } from "@/lib/batch/useBatchRoutes";
import { messageFromUnknown } from "@/lib/errors/messageFromUnknown";

type TeacherBrief = { id: string; fullName: string; email: string; isSenior?: boolean };

const WEEKDAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const emptyDefaults: BatchWriteInput = {
  batchName: "",
  courseName: "",
  batchType: "Weekday",
  batchDay: "",
  batchTime: "",
  startMonth: "",
  endMonth: "",
  branch: "",
  batchCapacity: 24,
  description: "",
  students: [],
  teacherIds: [],
};

function batchToFormInput(b: SerializedBatch): BatchWriteInput {
  return {
    batchName: b.batchName,
    courseName: b.courseName,
    batchType: b.batchType || "Weekday",
    batchDay: b.batchDay,
    batchTime: b.batchTime,
    startMonth: b.startMonth,
    endMonth: b.endMonth,
    branch: b.branch,
    batchCapacity: b.batchCapacity,
    description: b.description || "",
    teacherIds: [...(b.teacherIds || []), ...(b.seniorTeacherIds || [])],
    students: b.students.map(s => ({
      studentId: s.id || "",
      studentName: s.studentName,
      studentEmail: s.studentEmail || "",
      phone: s.phone || "",
      course: s.course || "",
      batchDay: s.batchDay || "",
      batchTime: s.batchTime || "",
      startMonth: s.startMonth || "",
      endMonth: s.endMonth || "",
    })),
  };
}

export function BatchForm({ mode, batchId, initial }: { mode: "create" | "edit"; batchId?: string; initial?: SerializedBatch | null }) {
  const router = useRouter();
  const routes = useBatchRoutes();
  const [teacherList, setTeacherList] = useState<TeacherBrief[]>([]);
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [studentModal, setStudentModal] = useState(false);
  const [studentList, setStudentList] = useState<Array<{ id: string; name?: string; fullName?: string; email?: string; badgeId?: string; phone?: string; currentCourse?: string; currentCourses?: string[]; batchDays?: string; batchTime?: string }>>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");

  const form = useForm<BatchWriteInput>({
    resolver: zodResolver(batchWriteSchema),
    defaultValues: initial ? batchToFormInput(initial) : emptyDefaults,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "students" });

  const courseName = form.watch("courseName");

  const batchDayValue = form.watch("batchDay") || "";
  const selectedBatchDays = batchDayValue
    .split(",")
    .map(day => day.trim())
    .filter(Boolean);

  const onInvalid = () => {
    toast.error("Please fill in all required batch fields.");
  };

  useEffect(() => {
    if (initial) {
      form.reset(batchToFormInput(initial));
    }
  }, [initial, form]);

  useEffect(() => {
    (async () => {
      try {
        const res = await batchFetch("/api/senior-teacher/teachers?brief=1");
        const json = await res.json();
        if (res.ok && json.data?.teachers) setTeacherList(json.data.teachers);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/courses");
        const json = await res.json();
        if (res.ok && Array.isArray(json.courses)) {
          const options: string[] = Array.from(
            new Set(
              json.courses
                .map((course): string | undefined =>
                  course && typeof course.courseTitle === "string" ? course.courseTitle : undefined,
                )
                .filter((title): title is string => typeof title === "string"),
            ),
          );
          const currentCourse = form.getValues("courseName");
          if (currentCourse && !options.includes(currentCourse)) {
            options.unshift(currentCourse);
          }
          options.sort();
          setCourseOptions(options);
        }
      } catch (err) {
        console.error("Failed to load course options", err);
      }
    })();
  }, [form]);

  const teacherIds = form.watch("teacherIds") || [];

  const toggleTeacher = (id: string) => {
    const cur = form.getValues("teacherIds") || [];
    if (cur.includes(id)) {
      form.setValue(
        "teacherIds",
        cur.filter(x => x !== id),
        { shouldValidate: true },
      );
    } else {
      form.setValue("teacherIds", [...cur, id], { shouldValidate: true });
    }
  };

  const addDraftStudent = () => {
    // Deprecated: kept for backwards compatibility
    toast.error("Please select students from the database instead.");
  };

  // Fetch students when modal opens
  useEffect(() => {
    if (!studentModal) return;
    (async () => {
      try {
        const res = await fetch(`/api/students`);
        const json: { students?: Array<{ id: string; name?: string; fullName?: string; email?: string; badgeId?: string; phone?: string; currentCourse?: string; batchDays?: string; batchTime?: string }> } = await res.json();
        if (res.ok && Array.isArray(json.students)) setStudentList(json.students);
      } catch (e) {
        /* ignore */
      }
    })();
  }, [studentModal]);

  const filteredStudents = studentList.filter(s => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (s.name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q) || (s.currentCourse || "").toLowerCase().includes(q);
  });

  const addSelectedStudents = () => {
    if (!selectedStudentIds || selectedStudentIds.length === 0) {
      toast.error("Please select one or more students to add");
      return;
    }
    const existing = form.getValues('students') || [];
    const capacity = form.getValues('batchCapacity');
    const remainingCapacity = capacity - existing.length;
    
    // Check if adding selected students would exceed capacity
    if (selectedStudentIds.length > remainingCapacity) {
      if (remainingCapacity === 0) {
        toast.error(`Batch capacity is ${capacity} students. You cannot add more students because the maximum capacity has been reached.`);
      } else {
        toast.error(`Only ${remainingCapacity} seat${remainingCapacity === 1 ? '' : 's'} ${remainingCapacity === 1 ? 'is' : 'are'} available. Please remove the extra selected students before adding them to the batch.`);
      }
      return;
    }
    
    let added = 0;
    let skipped = 0;
    for (const sid of selectedStudentIds) {
      const s = studentList.find((x) => x.id === sid);
      if (!s) {
        skipped++;
        continue;
      }
      const duplicate = existing.some((e) => {
        return (e.studentEmail && s.email && e.studentEmail.toLowerCase() === s.email.toLowerCase()) || (e.studentName && s.name && e.studentName === s.name);
      });
      if (duplicate) {
        skipped++;
        continue;
      }
      append({
        studentId: sid,
        studentName: s.name || s.fullName || "",
        studentEmail: s.email || "",
        phone: s.phone || "",
        course: s.currentCourse || "",
        batchDay: s.batchDays || "",
        batchTime: s.batchTime || "",
        startMonth: "",
        endMonth: "",
      });
      added++;
    }
    setSelectedStudentIds([]);
    setStudentModal(false);
    if (added > 0) toast.success(`${added} student(s) added${skipped>0?`, ${skipped} skipped`:''}`);
    else toast.error(skipped>0? 'No new students were added (duplicates skipped)' : 'No students added');
  };

  const onSubmit = async (data: BatchWriteInput) => {
    setSaving(true);
    try {
      const url = mode === "create" ? "/api/senior-teacher/batches" : `/api/senior-teacher/batches/${batchId}`;
      const res = await batchFetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        toast.error(json.error || "You do not have permission to save batches");
        return;
      }
      if (!res.ok) throw new Error(json.error || "Save failed");
      const batchIdSaved = json?.data?.batch?.id as string | undefined;
      if (!batchIdSaved) throw new Error("Invalid response from server");
      if (json.warnings?.length) {
        json.warnings.forEach((w: string) => toast.message(w));
      }
      toast.success(json.message || "Saved");
      router.push(routes.detail(batchIdSaved));
    } catch (e) {
      toast.error(messageFromUnknown(e, "Failed to save batch"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" asChild>
          <Link href={routes.list}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <PageHeader title={mode === "create" ? "Create batch" : "Edit batch"} subtitle="Fill in schedule, roster, and teacher assignments." />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Basic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Batch name</Label>
                <Input className="rounded-xl" {...form.register("batchName")} />
                {form.formState.errors.batchName && (
                  <p className="text-sm text-red-600">{form.formState.errors.batchName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Course name</Label>
              <Select
                value={courseName || undefined}
                onValueChange={v => form.setValue("courseName", v, { shouldValidate: true })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.length > 0 ? (
                    courseOptions.map(c => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no-courses" disabled>
                      No courses available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
                {form.formState.errors.courseName && (
                  <p className="text-sm text-red-600">{form.formState.errors.courseName.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} className="rounded-xl resize-none" {...form.register("description")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Batch Type & Schedule</Label>
              <RadioGroup
                value={form.watch("batchType")}
                onValueChange={(val: "Weekday" | "Weekend") => {
                  form.setValue("batchType", val, { shouldValidate: true });
                  if (val === "Weekday") {
                    form.setValue("batchDay", "Monday, Tuesday, Wednesday, Thursday, Friday", { shouldValidate: true });
                  } else {
                    form.setValue("batchDay", "Saturday, Sunday", { shouldValidate: true });
                  }
                }}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Weekday" id="r-weekday" />
                  <Label htmlFor="r-weekday" className="cursor-pointer">Weekdays (Mon-Fri)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Weekend" id="r-weekend" />
                  <Label htmlFor="r-weekend" className="cursor-pointer">Weekends (Sat-Sun)</Label>
                </div>
              </RadioGroup>
            </div>
              
            <div className="mt-4 pt-4 border-t">
              <Label className="mb-2 block">Select Specific Days</Label>
                <ToggleGroup
                  type="multiple"
                  value={selectedBatchDays}
                  onValueChange={(values) => form.setValue("batchDay", values.join(", "), { shouldValidate: true })}
                  className="flex flex-wrap gap-2 justify-start"
                >
                  {(form.watch("batchType") === "Weekday"
                    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                    : ["Saturday", "Sunday"]
                  ).map(day => (
                    <ToggleGroupItem
                      key={day}
                      value={day}
                      variant="outline"
                      className="rounded-full px-4 py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {day}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {form.formState.errors.batchDay && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.batchDay.message}</p>
                )}
              </div>
            <div className="space-y-2">
              <Label>Batch time</Label>
              <Input className="rounded-xl" placeholder="e.g. 4:00 PM – 5:30 PM" {...form.register("batchTime")} />
              <p className="text-xs text-muted-foreground">Enter the time range for this batch</p>
              {form.formState.errors.batchTime && (
                <p className="text-sm text-red-600">{form.formState.errors.batchTime.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Capacity & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input className="rounded-xl" placeholder="e.g. Pune Main Branch" {...form.register("branch")} />
                {form.formState.errors.branch && (
                  <p className="text-sm text-red-600">{form.formState.errors.branch.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Batch capacity</Label>
                <div className="flex items-center gap-3">
                  <Input type="number" min={1} className="rounded-xl" {...form.register("batchCapacity", { valueAsNumber: true })} />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {fields.length} / {form.watch("batchCapacity")} seats filled
                  </span>
                </div>
                {form.formState.errors.batchCapacity && (
                  <p className="text-sm text-red-600">{form.formState.errors.batchCapacity.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Assign Teachers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Select one or more teachers. They receive an email when the batch is created.</p>
            <div className="flex flex-wrap gap-2">
              {teacherIds.map(id => {
                const t = teacherList.find(x => x.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs font-medium"
                  >
                    {t?.fullName || id}
                    <button type="button" className="ml-1 hover:text-red-600" onClick={() => toggleTeacher(id)} aria-label="Remove">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            {teacherList.length > 5 && (
              <div className="space-y-2">
                <Label>Search teachers</Label>
                <Input
                  className="rounded-xl"
                  placeholder="Search by name or email"
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                />
              </div>
            )}
            <ScrollArea className="h-56 rounded-xl border border-slate-100">
              <div className="p-3 space-y-3">
                {(() => {
                  const seniorTeachers = teacherList.filter(t => t.isSenior);
                  const regularTeachers = teacherList.filter(t => !t.isSenior);
                  const searchLower = teacherSearch?.toLowerCase() || "";
                  const filteredSenior = seniorTeachers.filter(t => 
                    t.fullName.toLowerCase().includes(searchLower) || t.email.toLowerCase().includes(searchLower)
                  );
                  const filteredRegular = regularTeachers.filter(t => 
                    t.fullName.toLowerCase().includes(searchLower) || t.email.toLowerCase().includes(searchLower)
                  );

                  return (
                    <>
                      {filteredSenior.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Senior Teachers</p>
                          {filteredSenior.map(t => (
                            <label key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 cursor-pointer">
                              <Checkbox checked={teacherIds.includes(t.id)} onCheckedChange={() => toggleTeacher(t.id)} />
                              <span className="text-sm flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{t.fullName}</span>
                                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium">Senior Teacher</span>
                                </div>
                                <span className="text-muted-foreground block text-xs">{t.email}</span>
                              </span>
                            </label>
                          ))}
                        </>
                      )}
                      {filteredRegular.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3">Teachers</p>
                          {filteredRegular.map(t => (
                            <label key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 cursor-pointer">
                              <Checkbox checked={teacherIds.includes(t.id)} onCheckedChange={() => toggleTeacher(t.id)} />
                              <span className="text-sm flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{t.fullName}</span>
                                  <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-medium">Teacher</span>
                                </div>
                                <span className="text-muted-foreground block text-xs">{t.email}</span>
                              </span>
                            </label>
                          ))}
                        </>
                      )}
                      {filteredSenior.length === 0 && filteredRegular.length === 0 && (
                        <p className="text-sm text-muted-foreground">No teachers found.</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Students
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                {fields.length === form.watch("batchCapacity") && (
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-medium">
                    Full
                  </span>
                )}
                {fields.length > form.watch("batchCapacity") && (
                  <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-medium">
                    Over Capacity
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const capacity = form.watch("batchCapacity");
              const studentCount = fields.length;
              if (studentCount === 0) {
                return (
                  <p className="text-sm text-amber-600">
                    Please add at least one student to save this batch.
                  </p>
                );
              } else if (studentCount > capacity) {
                return (
                  <p className="text-sm text-red-600">
                    Batch capacity exceeded. Remove {studentCount - capacity} student(s) to continue.
                  </p>
                );
              }
              return null;
            })()}
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              onClick={() => setStudentModal(true)}
              disabled={fields.length >= form.watch("batchCapacity")}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Student
            </Button>
          </div>
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students added yet. You can add multiple entries (including duplicates).</p>
            ) : (
              <ul className="space-y-2">
                {fields.map((f, idx) => (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-900">{form.watch(`students.${idx}.studentName`)}</span>
                    <span className="text-muted-foreground">{form.watch(`students.${idx}.studentEmail`)}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 z-50">
        <div className="max-w-7xl mx-auto flex gap-3 justify-end">
          <Button 
            type="submit" 
            disabled={saving || fields.length === 0 || fields.length > form.watch("batchCapacity")} 
            className="rounded-xl gradient-primary text-white border-0 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={form.handleSubmit(onSubmit)}
          >
            {saving ? "Saving…" : mode === "create" ? "Create batch" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link href={routes.list}>Cancel</Link>
          </Button>
        </div>
      </div>

      <Sheet open={studentModal} onOpenChange={setStudentModal}>
        <SheetContent side="right" className="w-full sm:max-w-[820px] h-screen">
          <div className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>Add student to roster</SheetTitle>
            </SheetHeader>

            <div className="px-4 py-4 flex-1 overflow-hidden flex flex-col">
              <div className="mb-3">
                <Label>Search students</Label>
                <Input className="rounded-xl" placeholder="Search by name, email or course" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              </div>

              <div className="flex-1 overflow-y-auto rounded-lg border border-slate-100">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No students found.</div>
                ) : (
                  <ul className="p-2 space-y-1">
                    {filteredStudents.map(s => {
                      const checked = selectedStudentIds.includes(s.id);
                      return (
                        <label key={s.id} className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-slate-50 cursor-pointer ${checked ? 'bg-primary/10' : ''}`}>
                          <div className="flex items-center gap-3">
                            <Checkbox checked={checked} onCheckedChange={(v) => {
                              const isChecked = Boolean(v);
                              if (isChecked) setSelectedStudentIds(prev => prev.includes(s.id) ? prev : [...prev, s.id]);
                              else setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                            }} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{s.name}</div>
                              <div className="text-xs text-muted-foreground">{s.email}</div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground shrink-0">
                            {s.currentCourse ? (
                              s.currentCourses && s.currentCourses.length > 1 ? (
                                `${s.currentCourse} +${s.currentCourses.length - 1} more`
                              ) : (
                                s.currentCourse
                              )
                            ) : (
                              "No course purchased"
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border p-3 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStudentModal(false)}>
                Close
              </Button>
              <Button type="button" className="rounded-xl" onClick={addSelectedStudents}>
                Add to batch
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
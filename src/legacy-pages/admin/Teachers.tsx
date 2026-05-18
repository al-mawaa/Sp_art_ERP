"use client";

import { useEffect, useState } from "react";
import { Plus, Mail, Phone, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPECIALIZATIONS } from "@/data/mockData";
import { toast } from "sonner";

type TeacherItem = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  specialization: string;
  experience: number;
  status: "Active" | "Inactive";
  classes: string[];
  isSenior: boolean;
};

const TONE: Record<string, string> = {
  Watercolor: "from-info to-secondary",
  Sketching: "from-muted-foreground to-secondary",
  "Clay Art": "from-warning to-primary",
  Pottery: "from-accent to-primary",
  Acrylic: "from-success to-info",
};

export default function Teachers() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; phone: string; specialization: string; experience: string }>({ name: "", email: "", phone: "", specialization: "", experience: "" });
  const [q, setQ] = useState("");
  const [filterSpec, setFilterSpec] = useState<string>("All");
  const [filterRole, setFilterRole] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeachers() {
      setLoading(true);
      try {
        const res = await fetch('/api/teachers');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load teachers');
        setTeachers(data.teachers || []);
      } catch (error) {
        toast.error((error as Error).message || 'Failed to load teachers');
      } finally {
        setLoading(false);
      }
    }

    loadTeachers();
  }, []);

  const filtered = teachers
    .filter(t => filterSpec === "All" || t.specialization === filterSpec)
    .filter(t => filterRole === "All" || (filterRole === "Senior" ? t.isSenior : !t.isSenior))
    .filter(t => !q || t.fullName.toLowerCase().includes(q.toLowerCase()) || t.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} talented art instructors`}
        action={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-xl gradient-primary text-white border-0 shadow-pop"><Plus className="w-4 h-4 mr-1" />Add Teacher</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader><SheetTitle>Add new teacher</SheetTitle></SheetHeader>
              <form className="space-y-4 mt-6" onSubmit={async (e) => {
                e.preventDefault();
                if (!form.name || !form.email || !form.specialization) return;

                try {
                  const response = await fetch('/api/teachers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fullName: form.name,
                      email: form.email,
                      phone: form.phone,
                      specialization: form.specialization || SPECIALIZATIONS[0],
                      experience: Number(form.experience) || 1,
                      isSenior: false,
                      classes: [],
                    }),
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error || 'Unable to create teacher');
                  setTeachers(prev => [data.teacher, ...prev]);
                  toast.success('Teacher added — synced everywhere!');
                  setOpen(false);
                  setForm({ name: '', email: '', phone: '', specialization: '', experience: '' });
                } catch (error) {
                  toast.error((error as Error).message || 'Failed to add teacher');
                }
              }}>
                <div className="space-y-1.5"><Label>Full name</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="space-y-1.5">
                  <Label>Specialization</Label>
                  <Select value={form.specialization} onValueChange={v => setForm(f => ({ ...f, specialization: v }))}><SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                    <SelectContent>{SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Years of experience</Label><Input type="number" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} /></div>
                <Button type="submit" className="w-full rounded-xl gradient-primary text-white border-0">Add Teacher</Button>
              </form>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="card-soft p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search teachers..." className="pl-9 rounded-xl" />
        </div>
        <Select value={filterSpec} onValueChange={setFilterSpec}>
          <SelectTrigger className="rounded-xl sm:w-48"><SelectValue placeholder="Specialization" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All specializations</SelectItem>
            {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="rounded-xl sm:w-44"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All roles</SelectItem>
            <SelectItem value="Senior">Senior teachers</SelectItem>
            <SelectItem value="Teacher">Teachers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="card-soft p-10 text-center text-muted-foreground col-span-full">Loading teachers…</div>
        ) : filtered.length === 0 ? (
          <div className="card-soft p-10 text-center text-muted-foreground col-span-full">No teachers match filters</div>
        ) : filtered.map(t => (
          <div key={t.id} className="card-soft overflow-hidden hover:shadow-card transition-all hover:-translate-y-0.5">
            <div className={`h-20 bg-gradient-to-br ${TONE[t.specialization] || "from-primary to-secondary"} relative`}>
              <div className="absolute -bottom-7 left-4">
                <Avatar name={t.fullName} size={56} className="ring-4 ring-card" />
              </div>
              {t.isSenior && <span className="absolute top-3 right-3 text-[10px] font-bold uppercase bg-white/30 backdrop-blur text-white px-2 py-0.5 rounded-full">Senior</span>}
            </div>
            <div className="pt-9 p-4 space-y-2">
              <div>
                <div className="font-display font-bold">{t.fullName}</div>
                <div className="text-xs text-muted-foreground">{t.specialization} • {t.experience}y exp</div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{t.email}</div>
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{t.phone || 'N/A'}</div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <StatusPill status={t.status} />
                <span className="text-xs font-bold text-muted-foreground">{t.classes.length} classes</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, actions } from "@/store/dataStore";
import { toast } from "sonner";

export default function Institutions() {
  const institutions = useStore(s => s.institutions);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", plan: "Basic" });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutions"
        subtitle="Manage all enrolled institutes"
        action={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-xl gradient-primary text-white border-0 shadow-pop"><Plus className="w-4 h-4 mr-1" />Add Institute</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader><SheetTitle>Add new institute</SheetTitle></SheetHeader>
              <form className="space-y-4 mt-6" onSubmit={e => {
                e.preventDefault();
                if (!form.name) return;
                actions.addInstitution(form);
                toast.success("Institute added!");
                setOpen(false);
                setForm({ name: "", city: "", plan: "Basic" });
              }}>
                <div className="space-y-1.5"><Label>Name</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                <div className="space-y-1.5">
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={v => setForm(f => ({ ...f, plan: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full rounded-xl gradient-primary text-white border-0">Add Institute</Button>
              </form>
            </SheetContent>
          </Sheet>
        }
      />
      <DataTable
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Name" },
          { key: "city", header: "City" },
          { key: "plan", header: "Plan" },
          { key: "students", header: "Students" },
          { key: "status", header: "Status", render: r => <StatusPill status={r.status} /> },
          { key: "x", header: "", render: () => <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button> },
        ]}
        rows={institutions}
        searchKeys={["name", "city", "plan"]}
      />
    </div>
  );
}

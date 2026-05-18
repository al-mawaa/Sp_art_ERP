"use client";

import { useState } from "react";
import { Plus, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, TrendingUp, UserPlus, Target } from "lucide-react";
import { leadStages } from "@/data/mockData";
import { useStore, actions } from "@/store/dataStore";
import { toast } from "sonner";

const STAGE_TONE: Record<string, string> = {
  "New Enquiry":     "border-info bg-info/10",
  "Follow-up":       "border-warning bg-warning-soft",
  "Visit Scheduled": "border-secondary bg-secondary-soft",
  "Enrolled":        "border-success bg-success-soft",
};

export default function CRM() {
  const leads = useStore(s => s.leads);
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState({ child: "", parent: "", phone: "", source: "" });

  function move(id: string, stage: typeof leadStages[number]) {
    actions.moveLead(id, stage);
    toast.success(`Moved to ${stage}`);
  }

  const total = leads.length;
  const enrolled = leads.filter(l => l.stage === "Enrolled").length;

  return (
    <div className="space-y-6">
      <PageHeader title="CRM Leads" subtitle="Convert enquiries into enrolments" action={
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button className="rounded-xl gradient-primary text-white border-0 shadow-pop"><Plus className="w-4 h-4 mr-1" />Add Lead</Button></SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader><SheetTitle>New lead</SheetTitle></SheetHeader>
            <form className="space-y-4 mt-6" onSubmit={e => {
              e.preventDefault();
              if (!form.child) return;
              actions.addLead(form);
              toast.success("Lead added!");
              setOpen(false);
              setForm({ child: "", parent: "", phone: "", source: "" });
            }}>
              <div className="space-y-1.5"><Label>Child name</Label><Input required value={form.child} onChange={e => setForm(f => ({ ...f, child: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Parent name</Label><Input value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Source</Label><Input placeholder="Instagram / Walk-in / Referral" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} /></div>
              <Button type="submit" className="w-full rounded-xl gradient-primary text-white border-0">Add Lead</Button>
            </form>
          </SheetContent>
        </Sheet>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={total} icon={Sparkles} tone="info" />
        <StatCard label="Conversion Rate" value={`${Math.round(enrolled/total*100)}%`} icon={TrendingUp} tone="success" />
        <StatCard label="New This Week" value={2} icon={UserPlus} tone="primary" />
        <StatCard label="Enrolled" value={enrolled} icon={Target} tone="accent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {leadStages.map(stage => (
          <div key={stage}
            onDragOver={e => e.preventDefault()}
            onDrop={() => dragId && move(dragId, stage)}
            className={`rounded-2xl border-2 border-dashed ${STAGE_TONE[stage]} p-3 min-h-[280px]`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-display font-bold text-sm">{stage}</h3>
              <span className="text-xs font-bold bg-card px-2 py-0.5 rounded-full">{leads.filter(l => l.stage === stage).length}</span>
            </div>
            <div className="space-y-2">
              {leads.filter(l => l.stage === stage).map(l => (
                <div key={l.id}
                  draggable
                  onDragStart={() => setDragId(l.id)}
                  onDragEnd={() => setDragId(null)}
                  className="card-soft p-3 cursor-grab active:cursor-grabbing hover:shadow-card transition-shadow"
                >
                  <div className="font-bold text-sm">{l.child}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><User className="w-3 h-3" />{l.parent}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{l.phone}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                    <span className="text-[10px] font-bold uppercase bg-muted px-2 py-0.5 rounded">{l.source}</span>
                    <span className="text-[10px] text-muted-foreground">{l.counselor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

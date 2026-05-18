"use client";
import { useState } from "react";
import { ClipboardCheck, CalendarOff, CalendarDays, Users, Check, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { todaysClasses } from "@/data/mockData";
import { useStore, actions } from "@/store/dataStore";
import { toast } from "sonner";
export { Chat as ChatPage } from "@/pages/shared/Chat";

export function SeniorDashboard() {
  const slots = useStore(s => s.slots);
  const leaves = useStore(s => s.leaves);
  const teachers = useStore(s => s.teachers);
  const pendingSlots = slots.filter(r => r.status === "Pending").length;
  const pendingLeaves = leaves.filter(l => l.status === "Pending").length;
  return (
    <div className="space-y-6">
      <PageHeader title="Senior Teacher Dashboard" subtitle="Approvals and oversight" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Slot Approvals" value={pendingSlots} icon={ClipboardCheck} tone="warning" />
        <StatCard label="Pending Leaves" value={pendingLeaves} icon={CalendarOff} tone="destructive" />
        <StatCard label="Classes Today" value={todaysClasses.length} icon={CalendarDays} tone="primary" />
        <StatCard label="My Teachers" value={teachers.length} icon={Users} tone="success" />
      </div>
      <div className="card-soft p-5">
        <h3 className="font-display font-bold text-lg mb-3">Today's classes</h3>
        <div className="space-y-2">
          {todaysClasses.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <div className="rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5 font-bold text-sm">{c.time}</div>
              <div className="flex-1"><div className="font-bold">{c.subject}</div><div className="text-xs text-muted-foreground">{c.className}</div></div>
              <span className="text-sm text-muted-foreground">{c.students} students</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClassApprovals() {
  const all = useStore(s => s.slots);
  const reqs = all.filter(r => r.status === "Pending");
  function act(id: string, ok: boolean) {
    actions.setSlotStatus(id, ok ? "Approved" : "Denied");
    toast.success(ok ? "Approved!" : "Denied");
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Class Approvals" subtitle={`${reqs.length} pending requests`} action={
        <Button className="rounded-xl gradient-primary text-white border-0" onClick={() => { reqs.forEach(r => actions.setSlotStatus(r.id, "Approved")); toast.success("All approved!"); }}>Bulk approve</Button>
      } />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reqs.map(r => (
          <div key={r.id} className="card-soft p-4 space-y-3 animate-pop-in">
            <div className="flex items-center gap-3">
              <Avatar name={r.student} />
              <div><div className="font-bold">{r.student}</div><div className="text-xs text-muted-foreground font-mono">{r.badge}</div></div>
            </div>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Class:</span> <span className="font-semibold">{r.class}</span></div>
              <div><span className="text-muted-foreground">Time:</span> <span className="font-semibold">{r.time}</span></div>
              <div><span className="text-muted-foreground">Date:</span> <span className="font-semibold">{r.date}</span></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" className="flex-1 rounded-lg" onClick={() => act(r.id, false)}><X className="w-4 h-4 mr-1" />Deny</Button>
              <Button className="flex-1 rounded-lg bg-success text-success-foreground hover:bg-success/90" onClick={() => act(r.id, true)}><Check className="w-4 h-4 mr-1" />Approve</Button>
            </div>
          </div>
        ))}
        {reqs.length === 0 && <div className="card-soft p-10 text-center text-muted-foreground col-span-full">All caught up! 🎉</div>}
      </div>
    </div>
  );
}

export function LeaveApprovals() {
  const leaves = useStore(s => s.leaves);
  const [confirm, setConfirm] = useState<{ id: string; action: "Approved" | "Rejected" } | null>(null);
  function act() {
    if (!confirm) return;
    actions.setLeaveStatus(confirm.id, confirm.action);
    toast.success(`Leave ${confirm.action.toLowerCase()}`);
    setConfirm(null);
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Leave Approvals" subtitle="Teacher leave requests" />
      <div className="grid sm:grid-cols-2 gap-4">
        {leaves.map(l => (
          <div key={l.id} className="card-soft p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Avatar name={l.staff} /><div><div className="font-bold">{l.staff}</div><div className="text-xs text-muted-foreground">{l.type} leave</div></div></div>
              <StatusPill status={l.status} />
            </div>
            <div className="text-sm"><span className="text-muted-foreground">Dates:</span> <span className="font-semibold">{l.from} → {l.to}</span></div>
            <div className="text-sm"><span className="text-muted-foreground">Reason:</span> {l.reason}</div>
            {l.status === "Pending" && (
              <div className="flex gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setConfirm({ id: l.id, action: "Rejected" })}>Reject</Button>
                <Button variant="outline" className="flex-1 rounded-lg" onClick={() => toast("Cancelled")}>Cancel</Button>
                <Button className="flex-1 rounded-lg bg-success text-success-foreground hover:bg-success/90" onClick={() => setConfirm({ id: l.id, action: "Approved" })}>Approve</Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Dialog open={!!confirm} onOpenChange={o => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm {confirm?.action.toLowerCase()}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action will notify the staff member.</p>
          <DialogFooter><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button className="gradient-primary text-white border-0" onClick={act}>Confirm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function MyClasses() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Classes" subtitle="Your teaching schedule" />
      <div className="card-soft divide-y divide-border/60">
        {todaysClasses.map(c => (
          <div key={c.id} className="p-4 flex items-center gap-4">
            <div className="rounded-lg gradient-primary text-white px-3 py-2 font-bold text-sm">{c.time}</div>
            <div className="flex-1"><div className="font-bold">{c.subject}</div><div className="text-xs text-muted-foreground">{c.className}</div></div>
            <span className="text-sm font-semibold text-muted-foreground">{c.students} students</span>
          </div>
        ))}
      </div>
    </div>
  );
}


"use client";

import { Users, GraduationCap, IndianRupee, AlertCircle, Sparkles, Boxes, CalendarOff } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { BirthdayBanner } from "@/components/shared/BirthdayBanner";
import { todaysClasses } from "@/data/mockData";
import { useStore } from "@/store/dataStore";
import { Avatar } from "@/components/shared/Avatar";

export default function AdminDashboard() {
  const students = useStore(st => st.students);
  const teachers = useStore(st => st.teachers);
  const payments = useStore(st => st.payments);
  const leads = useStore(st => st.leads);
  const inventory = useStore(st => st.inventory);
  const leaves = useStore(st => st.leaves);
  const s = {
    students: students.length,
    teachers: teachers.length,
    feeCollected: payments.reduce((a, p) => a + p.amount, 0),
    pendingDues: students.filter(x => x.feeStatus !== "Paid").reduce((a, x) => a + (x.totalFee - x.paidFee), 0),
    openLeads: leads.filter(l => l.stage !== "Enrolled").length,
    lowStock: inventory.filter(i => i.status === "Low Stock").length,
    pendingLeaves: leaves.filter(l => l.status === "Pending").length,
  };
  const birthdays = students.filter(st => st.isBirthdayToday).map(st => st.name);
  return (
    <div className="space-y-6">
      <PageHeader title="Hello, Anjali 👋" subtitle="Here's what's happening at the academy today." />
      <BirthdayBanner names={birthdays} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Students" value={s.students} icon={Users} tone="primary" trend={{ value: "+3", up: true }} />
        <StatCard label="Teachers" value={s.teachers} icon={GraduationCap} tone="secondary" />
        <StatCard label="Fee Collected" value={`₹${s.feeCollected.toLocaleString()}`} icon={IndianRupee} tone="success" trend={{ value: "+18%", up: true }} />
        <StatCard label="Pending Dues" value={`₹${s.pendingDues.toLocaleString()}`} icon={AlertCircle} tone="destructive" />
        <StatCard label="Open Leads" value={s.openLeads} icon={Sparkles} tone="info" />
        <StatCard label="Low Stock" value={s.lowStock} icon={Boxes} tone="warning" />
        <StatCard label="Pending Leaves" value={s.pendingLeaves} icon={CalendarOff} tone="accent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Today's classes</h3>
            <span className="text-xs text-muted-foreground font-semibold">{todaysClasses.length} sessions</span>
          </div>
          <div className="space-y-3">
            {todaysClasses.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                <div className="rounded-lg bg-primary text-primary-foreground px-3 py-2 font-display font-bold text-sm whitespace-nowrap">{c.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{c.subject}</div>
                  <div className="text-xs text-muted-foreground">{c.className}</div>
                </div>
                <div className="text-sm font-semibold text-muted-foreground whitespace-nowrap">{c.students} students</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-soft p-5">
          <h3 className="font-display font-bold text-lg mb-4">Recent enrollments</h3>
          <div className="space-y-3">
            {students.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <Avatar name={s.name} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.class}</div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{s.badgeId}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

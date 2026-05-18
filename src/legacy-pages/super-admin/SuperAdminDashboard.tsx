"use client";
import { Building2, Users, IndianRupee, LifeBuoy, MoreVertical } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/dataStore";

export default function SuperAdminDashboard() {
  const institutions = useStore(st => st.institutions);
  const s = {
    institutes: institutions.length,
    students: institutions.reduce((a, i) => a + i.students, 0),
    revenue: 1240000,
    tickets: 7,
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Super Admin Dashboard" subtitle="Overview across all institutes" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Institutes" value={s.institutes} icon={Building2} tone="secondary" trend={{ value: "+2", up: true }} />
        <StatCard label="Total Students"   value={s.students.toLocaleString()} icon={Users} tone="primary" trend={{ value: "+8%", up: true }} />
        <StatCard label="Monthly Revenue"  value={`₹${(s.revenue/100000).toFixed(1)}L`} icon={IndianRupee} tone="success" trend={{ value: "+12%", up: true }} />
        <StatCard label="Support Tickets"  value={s.tickets} icon={LifeBuoy} tone="warning" trend={{ value: "-3", up: false }} />
      </div>
      <DataTable
        columns={[
          { key: "name",  header: "Institute" },
          { key: "city",  header: "City" },
          { key: "plan",  header: "Plan", render: r => <span className="font-bold text-secondary">{r.plan}</span> },
          { key: "students", header: "Students" },
          { key: "status", header: "Status", render: r => <StatusPill status={r.status} /> },
          { key: "actions", header: "", render: () => <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button> },
        ]}
        rows={institutions}
        searchKeys={["name", "city"]}
      />
    </div>
  );
}

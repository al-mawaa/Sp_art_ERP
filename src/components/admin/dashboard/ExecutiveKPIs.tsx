import React from "react";
import { 
  Users, GraduationCap, Building, BookOpen, Clock, 
  IndianRupee, AlertCircle, CalendarOff, Sparkles, Bell, LayoutDashboard 
} from "lucide-react";

interface KPIProps {
  kpiData: any;
}

export function ExecutiveKPIs({ kpiData }: KPIProps) {
  const kpis = [
    { label: "Total Students", value: kpiData.totalStudents, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Teachers", value: kpiData.totalTeachers, icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Total Sr. Teachers", value: kpiData.totalSeniorTeachers, icon: Building, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Active Courses", value: kpiData.activeCourses, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Active Batches", value: kpiData.activeBatches, icon: LayoutDashboard, color: "text-teal-500", bg: "bg-teal-500/10" },
    { label: "Total Revenue", value: `₹${(kpiData.totalRevenue/1000).toFixed(1)}k`, icon: IndianRupee, color: "text-success", bg: "bg-success/10" },
    { label: "Pending Fees", value: `₹${(kpiData.pendingFees/1000).toFixed(1)}k`, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Pending Leaves", value: kpiData.pendingLeaves, icon: CalendarOff, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Pending Approvals", value: kpiData.pendingApprovals, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Open CRM Leads", value: kpiData.openLeads, icon: Sparkles, color: "text-pink-500", bg: "bg-pink-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {kpis.map((stat, i) => (
        <div key={i} className="glass-card p-5 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/50 dark:bg-black/20 backdrop-blur-md">
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            {/* Optional Trend indicator placeholder */}
            <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
              +4%
            </span>
          </div>
          <div className="text-3xl font-extrabold mb-1">{stat.value}</div>
          <div className="text-sm text-muted-foreground font-semibold">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

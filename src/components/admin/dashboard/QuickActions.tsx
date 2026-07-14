import React from "react";
import { Plus, UserPlus, BookOpen, GraduationCap, LayoutDashboard, IndianRupee, FileText, Send, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    { label: "Add Student", icon: UserPlus, href: "/admin/students", color: "text-blue-500" },
    { label: "Add Teacher", icon: GraduationCap, href: "/admin/teachers", color: "text-indigo-500" },
    { label: "Create Course", icon: BookOpen, href: "/admin/courses", color: "text-purple-500" },
    { label: "Create Batch", icon: LayoutDashboard, href: "/admin/batches", color: "text-emerald-500" },
    { label: "Collect Fee", icon: IndianRupee, href: "/admin/offline-payments", color: "text-success" },
    { label: "Certificates", icon: FileText, href: "/admin/certificates", color: "text-orange-500" },
    { label: "Notify All", icon: Send, href: "/admin/notifications", color: "text-pink-500" },
    { label: "Reports", icon: PieChart, href: "/admin/progress", color: "text-primary" },
  ];

  return (
    <div className="glass-card p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <h2 className="font-bold flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-primary" /> Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => (
          <Button key={i} asChild variant="outline" className="h-auto py-3 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/50 hover:bg-background border-border/50 hover:border-primary/30 transition-all">
            <Link href={action.href}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-xs">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

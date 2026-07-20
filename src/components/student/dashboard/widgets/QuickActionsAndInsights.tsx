import React from "react";
import Link from "next/link";
import { Users, Calendar, Download, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActionsAndInsights() {
  const actions = [
    { name: "Refer Friend", icon: Users, color: "bg-purple-600 hover:bg-purple-700", href: "/student/referrals" },
    { name: "Attendance", icon: Calendar, color: "bg-emerald-600 hover:bg-emerald-700", href: "/student/attendance" },
    { name: "Certificates", icon: Download, color: "bg-amber-600 hover:bg-amber-700", href: "/student/certificates" },
    { name: "Feedback", icon: MessageSquare, color: "bg-rose-600 hover:bg-rose-700", href: "/student/feedback" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 text-lg mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => (
          <Button asChild key={i} className={`${action.color} text-white justify-start gap-2 h-auto py-3 rounded-xl shadow-sm hover:shadow transition-all w-full cursor-pointer`}>
            <Link href={action.href}>
              <action.icon size={16} />
              <span className="text-sm">{action.name}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

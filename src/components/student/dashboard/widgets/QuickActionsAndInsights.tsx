import React from "react";
import Link from "next/link";
import { Lightbulb, CreditCard, Users, Calendar, Download, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActionsAndInsights() {
  const insights = [
    { text: "Your attendance improved by 12% this month. Great job!", color: "text-emerald-700", bg: "bg-emerald-50" },
    { text: "Pending fees are due in 5 days.", color: "text-amber-700", bg: "bg-amber-50" },
    { text: "Complete one referral to unlock Gold Level.", color: "text-purple-700", bg: "bg-purple-50" },
  ];

  const actions = [
    { name: "Pay Fees", icon: CreditCard, color: "bg-blue-600 hover:bg-blue-700", href: "/student/fees" },
    { name: "Refer Friend", icon: Users, color: "bg-purple-600 hover:bg-purple-700", href: "/student/referrals" },
    { name: "Attendance", icon: Calendar, color: "bg-emerald-600 hover:bg-emerald-700", href: "/student/attendance" },
    { name: "Certificates", icon: Download, color: "bg-amber-600 hover:bg-amber-700", href: "/student/certificates" },
    { name: "Feedback", icon: MessageSquare, color: "bg-rose-600 hover:bg-rose-700", href: "/student/feedback" },
  ];

  return (
    <div className="space-y-6">
      {/* Smart Insights */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="text-amber-500" size={20} />
          <h3 className="font-bold text-slate-800 text-lg">Smart Insights</h3>
        </div>
        
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className={`p-3 rounded-xl text-sm font-medium ${insight.bg} ${insight.color}`}>
              {insight.text}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
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
    </div>
  );
}

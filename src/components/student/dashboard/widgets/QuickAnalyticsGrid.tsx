import React from "react";
import { Wallet, CalendarDays, Gift, Users } from "lucide-react";

export function QuickAnalyticsGrid({ profile, attendance, rewards, referrals, enrolledCourses }: any) {
  const attendancePercentage = attendance?.summary?.percentage || 0;
  
  // Calculate total pending fees from all enrolled courses
  let pendingFees = 0;
  if (enrolledCourses && enrolledCourses.length > 0) {
    enrolledCourses.forEach((course: any) => {
      pendingFees += (course.remainingAmount || 0);
    });
  }

  const cards = [
    {
      title: "Attendance",
      value: `${attendancePercentage}%`,
      trend: attendance?.summary?.present ? `${attendance.summary.present} days present` : "No records",
      trendUp: attendancePercentage >= 75,
      icon: CalendarDays,
      color: "from-emerald-400 to-emerald-600",
      bg: "bg-emerald-50",
      textColor: "text-emerald-700",
      iconColor: "text-emerald-600",
    },
    {
      title: "Pending Fees",
      value: `₹${pendingFees.toLocaleString()}`,
      trend: pendingFees > 0 ? "Action required" : "All cleared",
      trendUp: pendingFees === 0,
      icon: Wallet,
      color: "from-rose-400 to-rose-600",
      bg: "bg-rose-50",
      textColor: "text-rose-700",
      iconColor: "text-rose-600",
    },
    {
      title: "Reward Points",
      value: rewards?.stats?.totalPoints || rewards?.points || 0,
      trend: "Available points",
      trendUp: true,
      icon: Gift,
      color: "from-purple-400 to-purple-600",
      bg: "bg-purple-50",
      textColor: "text-purple-700",
      iconColor: "text-purple-600",
    },
    {
      title: "Total Referrals",
      value: referrals?.stats?.successfulReferrals || referrals?.total || 0,
      trend: `₹${referrals?.stats?.totalEarnings || 0} earned`,
      trendUp: true,
      icon: Users,
      color: "from-blue-400 to-blue-600",
      bg: "bg-blue-50",
      textColor: "text-blue-700",
      iconColor: "text-blue-600",
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className={`relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group`}>
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}></div>
          
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            {/* Mock mini sparkline */}
            <svg width="60" height="20" viewBox="0 0 60 20" className="opacity-50">
              <path d="M0,15 Q10,5 20,10 T40,5 T60,0" fill="none" stroke="currentColor" className={card.iconColor} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          <div>
            <h3 className="text-slate-500 text-sm font-medium">{card.title}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-xs font-semibold ${card.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                {card.trend}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

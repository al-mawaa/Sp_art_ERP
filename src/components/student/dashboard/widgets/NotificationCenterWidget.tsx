import React from "react";
import { Bell, Info, AlertTriangle, CheckCircle } from "lucide-react";

export function NotificationCenterWidget() {
  const notifications = [
    {
      id: 1,
      type: "info",
      title: "New Course Available",
      time: "2 hours ago",
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      id: 2,
      type: "success",
      title: "Referral Reward Earned",
      time: "3 days ago",
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Bell size={20} className="text-slate-500" /> Notifications
        </h3>
        <button className="text-sm text-blue-600 font-semibold hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${notif.bg}`}>
              <notif.icon size={18} className={notif.color} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">{notif.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

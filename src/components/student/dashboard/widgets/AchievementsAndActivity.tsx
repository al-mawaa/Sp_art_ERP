import React from "react";
import { Award, Trophy, Star, Shield, Activity, PlayCircle } from "lucide-react";

export function AchievementsAndActivity() {
  const achievements = [
    { name: "Perfect Attendance", icon: Star, color: "text-amber-500", bg: "bg-amber-100" },
    { name: "Referral Champion", icon: Trophy, color: "text-purple-500", bg: "bg-purple-100" },
    { name: "Top Performer", icon: Award, color: "text-blue-500", bg: "bg-blue-100" },
  ];

  const activities = [
    { title: "Course Enrolled", desc: "Art Foundation Level 1", time: "2 weeks ago", icon: PlayCircle, color: "text-blue-500", bg: "bg-blue-100" },
    { title: "Reward Redeemed", desc: "Sketchbook Set", time: "1 month ago", icon: Award, color: "text-purple-500", bg: "bg-purple-100" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-6">Achievements</h3>
        <div className="grid grid-cols-2 gap-4">
          {achievements.map((badge, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all group">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${badge.bg} group-hover:scale-110 transition-transform`}>
                <badge.icon size={28} className={badge.color} />
              </div>
              <p className="text-sm font-semibold text-slate-700 text-center">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-slate-500" size={20} />
          <h3 className="font-bold text-slate-800 text-lg">Recent Activity</h3>
        </div>
        
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {activities.map((activity, i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${activity.bg} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                <activity.icon size={16} className={activity.color} />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-800 text-sm">{activity.title}</h4>
                </div>
                <p className="text-sm text-slate-600 mb-2">{activity.desc}</p>
                <span className="text-xs text-slate-400 font-medium">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AttendanceInsights({ attendance }: any) {
  // Mock trend data, would normally process from `attendance.records`
  const data = [
    { name: "Week 1", present: 80 },
    { name: "Week 2", present: 90 },
    { name: "Week 3", present: 85 },
    { name: "Week 4", present: 100 },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 text-lg">Attendance Trend</h3>
        <select className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option>This Month</option>
          <option>Last Month</option>
          <option>Last 3 Months</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:w-2/3 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full sm:w-1/3 flex flex-col justify-center gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-emerald-600 text-sm font-medium mb-1">Present</p>
            <p className="text-2xl font-bold text-emerald-700">12 Days</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <p className="text-rose-600 text-sm font-medium mb-1">Absent</p>
            <p className="text-2xl font-bold text-rose-700">2 Days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

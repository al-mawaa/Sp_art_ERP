import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AttendanceInsights({ attendance }: any) {
  const presentCount = attendance?.summary?.present || 0;
  const absentCount = attendance?.summary?.absent || 0;

  // Process trend data from attendance.records
  const data = React.useMemo(() => {
    if (!attendance?.records || attendance.records.length === 0) {
      return [
        { name: "Week 1", present: 0 },
        { name: "Week 2", present: 0 },
        { name: "Week 3", present: 0 },
        { name: "Week 4", present: 0 },
      ];
    }

    const weeks = [0, 0, 0, 0];
    const weekCounts = [0, 0, 0, 0];

    attendance.records.forEach((record: any) => {
      const date = new Date(record.date);
      const day = date.getDate();
      const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
      
      weekCounts[weekIndex]++;
      if (record.status === "Present") {
        weeks[weekIndex]++;
      }
    });

    return weeks.map((presentDays, index) => ({
      name: `Week ${index + 1}`,
      present: weekCounts[index] > 0 ? Math.round((presentDays / weekCounts[index]) * 100) : 0,
    }));
  }, [attendance]);

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
            <p className="text-2xl font-bold text-emerald-700">{presentCount} Days</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <p className="text-rose-600 text-sm font-medium mb-1">Absent</p>
            <p className="text-2xl font-bold text-rose-700">{absentCount} Days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

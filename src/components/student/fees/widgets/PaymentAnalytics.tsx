import React from "react";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function PaymentAnalytics() {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = [
    { name: "Jan", paid: 0 },
    { name: "Feb", paid: 0 },
    { name: "Mar", paid: 0 },
    { name: "Apr", paid: 0 },
    { name: "May", paid: 10000 },
    { name: "Jun", paid: 0 },
  ];

  if (!isMounted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-[340px] flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={20} />
          Payment Analytics
        </h3>
        <select className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none">
          <option>Last 6 Months</option>
          <option>This Year</option>
        </select>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart id="payment-analytics-chart" data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} />
            <Tooltip 
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Paid Amount']}
            />
            <Bar dataKey="paid" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell key={`cell-bar-${index}`} fill="#3B82F6" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

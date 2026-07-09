"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, TrendingUp, Trophy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

type TeacherStat = {
  teacherId: string;
  teacherName: string;
  totalFeedback: number;
  averageRating: number;
  positiveFeedback: number;
  negativeFeedback: number;
};

type AnalyticsData = {
  teacherStats: TeacherStat[];
  topTeachers: TeacherStat[];
  lowestTeachers: TeacherStat[];
  monthlyTrends: { month: string; averageRating: number; totalFeedback: number }[];
  categoryStats: { category: string; count: number; averageRating: number }[];
};

export function TeacherAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/feedback/analytics");
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          throw new Error(json.error || "Failed to load analytics");
        }
      } catch (error) {
        toast.error("Error loading analytics data");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Top / Lowest Rated Teachers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-emerald-700">
            <Trophy className="w-5 h-5" />
            <h3 className="font-bold text-lg">Top Rated Teachers</h3>
          </div>
          {data.topTeachers.length === 0 ? (
            <p className="text-sm text-emerald-600/70">Not enough data</p>
          ) : (
            <div className="space-y-3">
              {data.topTeachers.map((t, idx) => (
                <div key={t.teacherId} className="flex justify-between items-center bg-white/60 p-3 rounded-lg border border-emerald-100/50">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-700 w-4">#{idx + 1}</span>
                    <span className="font-medium">{t.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-yellow-600">
                    {t.averageRating} <Star className="w-4 h-4 fill-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-lg">Lowest Rated Teachers</h3>
            <span className="text-xs font-normal opacity-70 ml-2">(Min 3 reviews)</span>
          </div>
          {data.lowestTeachers.length === 0 ? (
            <p className="text-sm text-red-600/70">No teachers with low ratings!</p>
          ) : (
            <div className="space-y-3">
              {data.lowestTeachers.map((t, idx) => (
                <div key={t.teacherId} className="flex justify-between items-center bg-white/60 p-3 rounded-lg border border-red-100/50">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{t.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-red-600">
                    {t.averageRating} <Star className="w-4 h-4 fill-red-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-lg text-slate-800">Monthly Rating Trend</h3>
          </div>
          <div className="h-72">
            {data.monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    name="Avg Rating"
                    dataKey="averageRating" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No data available</div>
            )}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-lg text-slate-800">Category Distribution</h3>
          </div>
          <div className="h-72">
            {data.categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryStats} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 'dataMax']} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar name="Feedback Count" dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Full Teacher Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800">All Teachers Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Teacher</th>
                <th className="px-5 py-3 text-center">Total Feedback</th>
                <th className="px-5 py-3 text-center">Positive</th>
                <th className="px-5 py-3 text-center">Negative</th>
                <th className="px-5 py-3 text-right">Avg Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.teacherStats.map((t) => (
                <tr key={t.teacherId} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-medium text-slate-900">{t.teacherName}</td>
                  <td className="px-5 py-4 text-center">{t.totalFeedback}</td>
                  <td className="px-5 py-4 text-center text-emerald-600 font-medium">{t.positiveFeedback}</td>
                  <td className="px-5 py-4 text-center text-red-600 font-medium">{t.negativeFeedback}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-bold text-yellow-600">
                      {t.averageRating} <Star className="w-4 h-4 fill-yellow-500" />
                    </div>
                  </td>
                </tr>
              ))}
              {data.teacherStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No performance data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

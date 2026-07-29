"use client";

import React, { useEffect, useState } from "react";
import { HeroSection } from "./widgets/HeroSection";
import { QuickAnalyticsGrid } from "./widgets/QuickAnalyticsGrid";
import { TodaysClassesWidget } from "./widgets/TodaysClassesWidget";
import { AttendanceInsights } from "./widgets/AttendanceInsights";
import { QuickActionsAndInsights } from "./widgets/QuickActionsAndInsights";

export function PremiumStudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch all data in parallel
        const [
          profileRes,
          attendanceRes,
          referralsRes,
          classesRes,
          enrolledCoursesRes
        ] = await Promise.all([
          fetch("/api/student/profile").then(res => res.ok ? res.json() : null),
          fetch("/api/student/attendance/report?month=" + new Date().toISOString().slice(0, 7)).then(res => res.ok ? res.json() : null),
          fetch("/api/student/referrals").then(res => res.ok ? res.json() : null),
          fetch("/api/student/classes").then(res => res.ok ? res.json() : null),
          fetch("/api/student/enrolled-courses").then(res => res.ok ? res.json() : null),
        ]);

        setData({
          profile: profileRes?.data?.profile || null,
          attendance: attendanceRes || null,
          referrals: referralsRes?.data || null,
          classes: classesRes?.data?.classes || null,
          enrolledCourses: enrolledCoursesRes?.enrolledCourses || null,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Section */}
        <HeroSection profile={data?.profile} classes={data?.classes} />

        {/* Top Row - 4 Cards in Single Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-slate-500 text-sm font-medium mb-2">Attendance</h3>
            <p className="text-2xl font-bold text-slate-800">{data?.attendance?.summary?.percentage || 0}%</p>
            <p className="text-xs text-slate-500 mt-1">{data?.attendance?.summary?.present || 0} days present</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-slate-500 text-sm font-medium mb-2">Total Referrals</h3>
            <p className="text-2xl font-bold text-slate-800">{data?.referrals?.stats?.successfulReferrals || data?.referrals?.total || 0}</p>
            <p className="text-xs text-slate-500 mt-1">₹{data?.referrals?.stats?.totalEarnings || 0} earned</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-slate-500 text-sm font-medium mb-2">Quick Actions</h3>
            <p className="text-2xl font-bold text-slate-800">4</p>
            <p className="text-xs text-slate-500 mt-1">Available actions</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-slate-500 text-sm font-medium mb-2">Today's Classes</h3>
            <p className="text-2xl font-bold text-slate-800">{data?.classes?.length || 1}</p>
            <p className="text-xs text-slate-500 mt-1">Scheduled today</p>
          </div>
        </div>

        {/* Attendance Trend - Full Width */}
        <AttendanceInsights attendance={data?.attendance} />

        {/* Quick Actions and Today's Classes - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickActionsAndInsights />
          <TodaysClassesWidget profile={data?.profile} classes={data?.classes} />
        </div>
      </div>
    </div>
  );
}

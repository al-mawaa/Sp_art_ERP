"use client";

import React, { useEffect, useState } from "react";
import { HeroSection } from "./widgets/HeroSection";
import { QuickAnalyticsGrid } from "./widgets/QuickAnalyticsGrid";
import { TodaysClassesWidget } from "./widgets/TodaysClassesWidget";
import { AttendanceInsights } from "./widgets/AttendanceInsights";
import { CourseProgressWidget } from "./widgets/CourseProgressWidget";
import { NotificationCenterWidget } from "./widgets/NotificationCenterWidget";
import { AchievementsAndActivity } from "./widgets/AchievementsAndActivity";
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

        {/* Analytics Grid */}
        <QuickAnalyticsGrid 
          profile={data?.profile} 
          attendance={data?.attendance} 
          referrals={data?.referrals}
          enrolledCourses={data?.enrolledCourses}
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-6">
            <AttendanceInsights attendance={data?.attendance} />
            <CourseProgressWidget profile={data?.profile} enrolledCourses={data?.enrolledCourses} />
            <AchievementsAndActivity />
          </div>

          {/* Right Column (Sidebar Widgets) */}
          <div className="space-y-6">
            <QuickActionsAndInsights />
            <TodaysClassesWidget profile={data?.profile} classes={data?.classes} />
            <NotificationCenterWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

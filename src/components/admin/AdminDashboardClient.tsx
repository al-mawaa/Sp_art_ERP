"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { HeroSection } from "./dashboard/HeroSection";
import { ExecutiveKPIs } from "./dashboard/ExecutiveKPIs";
import { RevenueAnalytics } from "./dashboard/RevenueAnalytics";
import { StudentTeacherAnalytics } from "./dashboard/StudentTeacherAnalytics";
import { LiveMonitors } from "./dashboard/LiveMonitors";
import { OperationsOverview } from "./dashboard/OperationsOverview";
import { ApprovalsAndActivities } from "./dashboard/ApprovalsAndActivities";
import { QuickActions } from "./dashboard/QuickActions";
import { SmartInsights } from "./dashboard/SmartInsights";

interface DashboardProps {
  data: {
    students: any[];
    teachers: any[];
    seniorTeachers: any[];
    enrollments: any[];
    courses: any[];
    batches: any[];
    studentAttendance: any[];
    teacherAttendance: any[];
    onlinePayments: any[];
    offlinePayments: any[];
    payrollRuns: any[];
    notifications: any[];
    feedbacks: any[];
    queries: any[];
    certificates: any[];
    leaves: any[];
    stLeaves: any[];
  };
}

export function AdminDashboardClient({ data }: DashboardProps) {
  // Common data calculations for insights
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayDay = format(new Date(), "EEEE");

  const activeBatches = data.batches.filter(b => b.batchStatus === "Active");
  const todaysClasses = activeBatches.filter(b => b.batchDay === todayDay || b.batchDay === "Everyday");
  
  const pendingFees = data.students.filter(s => s.feeStatus !== "Paid").reduce((sum, s) => sum + ((s.totalFee || 0) - (s.paidFee || 0)), 0);
  const pendingCertificates = data.certificates.filter(c => c.status === "Pending").length;
  const pendingQueries = data.queries.filter(q => q.status === "pending").length;
  const pendingLeaves = data.leaves.filter(l => l.status === "Pending").length + data.stLeaves.filter(l => l.status === "Pending").length;
  
  const todayOnlinePayments = data.onlinePayments.filter(p => p.createdAt?.startsWith(todayStr));
  const todayOfflinePayments = data.offlinePayments.filter(p => p.createdAt?.startsWith(todayStr));
  const todayCollection = todayOnlinePayments.reduce((sum, p) => sum + (p.amount || 0), 0) + todayOfflinePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalRevenue = data.onlinePayments.reduce((sum, p) => sum + (p.amount || 0), 0) + data.offlinePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingApprovals = pendingCertificates + pendingQueries + pendingLeaves + data.offlinePayments.filter(p => p.status === "pending").length;

  // Inventory & CRM placeholder calculations
  const lowStockItems = 3;
  const openLeads = 12;

  const kpiData = {
    totalStudents: data.students.length,
    totalTeachers: data.teachers.length,
    totalSeniorTeachers: data.seniorTeachers.length,
    activeCourses: data.courses.length,
    activeBatches: activeBatches.length,
    todaysClasses: todaysClasses.length,
    totalRevenue,
    pendingFees,
    todayCollection,
    pendingAdmissions: data.enrollments.filter(e => e.status === "pending").length,
    pendingCertificates,
    pendingQueries,
    pendingLeaves,
    pendingSlotRequests: data.queries.filter(q => q.category === "switch_batch" && q.status === "pending").length,
    openLeads,
    lowStockItems,
    activeNotifications: data.notifications.length,
    pendingApprovals
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-12">
      <HeroSection kpiData={kpiData} />
      
      <ExecutiveKPIs kpiData={kpiData} />
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
        <div className="xl:col-span-3 space-y-6 lg:space-y-8">
          <SmartInsights data={data} kpiData={kpiData} todaysClasses={todaysClasses} />
          
          <RevenueAnalytics data={data} todayStr={todayStr} />
          
          <LiveMonitors data={data} todaysClasses={todaysClasses} todayStr={todayStr} />
          
          <StudentTeacherAnalytics data={data} />
          
          <OperationsOverview data={data} />
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          <QuickActions />
          
          <ApprovalsAndActivities data={data} kpiData={kpiData} />
        </div>
      </div>
    </div>
  );
}

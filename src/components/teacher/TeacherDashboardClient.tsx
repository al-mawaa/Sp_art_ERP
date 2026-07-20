"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { 
  Users, CheckCircle, Clock, Calendar, TrendingUp, AlertCircle, 
  FileText, CalendarOff, MessageSquare, Bell, Star, Award, ChevronRight, Play, BookOpen
} from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useStore } from "@/store/dataStore"; // Using this for slot requests per plan

interface DashboardProps {
  data: {
    teacher: any;
    batches: any[];
    students: any[];
    attendanceList: any[];
    leaves: any[];
    drawingTasks: any[];
    evaluations: any[];
    feedbacks: any[];
    notifications: any[];
    certificates: any[];
    leaveBalance: any;
    performance: any;
    queries: any[];
  };
}

export function TeacherDashboardClient({ data }: DashboardProps) {
  const { teacher, batches, students, attendanceList, leaves, drawingTasks, feedbacks, notifications, certificates, leaveBalance, performance, queries } = data;
  
  // Use Zustand store for slot requests fallback
  const slotRequestsFallback = useStore(s => s.slots);

  // Computed data
  const todaysClasses = useMemo(() => {
    const todayName = format(new Date(), "EEEE");
    const todayBatches = batches.filter(b => {
      const days = b.batchDay?.split(",").map((d: string) => d.trim()) || [];
      return days.includes(todayName) || b.batchDay === "Everyday";
    });
    
    return todayBatches.map(b => {
      const studentCount = students?.filter(s => s.batchId === b._id).length || 0;
      return {
        id: b._id,
        subject: b.courseName,
        className: b.batchName,
        time: b.batchTime,
        students: studentCount,
        status: "Upcoming"
      };
    });
  }, [batches, students]);

  const activeBatchesCount = batches.filter(b => b.batchStatus === "Active").length;
  const pendingTasksCount = drawingTasks.length;
  
  const totalStudents = students?.length || 0;
  
  const leaveBalanceCount = leaveBalance ? (leaveBalance.casual + leaveBalance.sick + leaveBalance.personal) : 0;
  
  const getBatchAttendanceRate = (batchId: string) => {
    const batchRecords = attendanceList.filter(a => a.batchId === batchId);
    if (batchRecords.length === 0) return 0;
    
    let totalPresent = 0;
    let totalS = 0;
    for (const record of batchRecords) {
      totalS += record.students.length;
      totalPresent += record.students.filter((s: any) => s.status === 'Present').length;
    }
    return totalS > 0 ? Math.round((totalPresent / totalS) * 100) : 0;
  };

  let globalTotalStudents = 0;
  let globalTotalPresent = 0;
  attendanceList.forEach(record => {
    globalTotalStudents += record.students.length;
    globalTotalPresent += record.students.filter((s: any) => s.status === 'Present').length;
  });
  
  const attendanceRate = globalTotalStudents > 0 
    ? Math.round((globalTotalPresent / globalTotalStudents) * 100)
    : 0;

  let calculatedRating = 0;
  if (feedbacks && feedbacks.length > 0) {
    const total = feedbacks.reduce((acc, f) => acc + (f.overallRating || 0), 0);
    calculatedRating = Number((total / feedbacks.length).toFixed(1));
  }

  const performanceRating = calculatedRating > 0 
    ? calculatedRating 
    : (performance?.averagePerformance || teacher.performanceScore || 0);

  const pendingQueries = queries?.filter(q => q.status === "pending") || [];
  const pendingSlotsCount = pendingQueries.length;
  
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

  const smartInsights = [
    `Your overall student attendance rate is ${attendanceRate}%.`,
    batches.length > 0 ? `Your first batch ${batches[0].batchName} has ${students?.filter(s => s.batchId === batches[0]._id).length || 0} students.` : `You don't have any active batches yet.`,
    `${certificates.length} certificates have been issued.`
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl premium-gradient p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Star className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar name={teacher.fullName} src={teacher.photo} size={96} className="w-24 h-24 border-4 border-white/30 shadow-xl" />
              <div className="absolute -bottom-2 -right-2 bg-success text-white p-1 rounded-full border-2 border-white">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-white/80 font-medium tracking-wide uppercase text-sm">{greeting}</p>
              <h1 className="text-3xl md:text-4xl font-bold mt-1 mb-2">{teacher.fullName}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-white/90">
                <span className="flex items-center gap-1"><Award className="w-4 h-4"/> {teacher.specialization || "Art Teacher"}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> ID: {teacher.badgeId || "TCH-001"}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {format(new Date(), "EEEE, MMM do")}</span>
              </div>
            </div>
          </div>
          
          <div className="glass-card !bg-white/10 !border-white/20 p-5 rounded-2xl flex gap-6 w-full md:w-auto">
            <div className="text-center">
              <div className="text-3xl font-bold">{attendanceRate}%</div>
              <div className="text-xs text-white/70 mt-1 uppercase tracking-wider">Attendance</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl font-bold">{performanceRating}</div>
              <div className="text-xs text-white/70 mt-1 uppercase tracking-wider">Rating</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning">{activeBatchesCount}</div>
              <div className="text-xs text-white/70 mt-1 uppercase tracking-wider">Batches</div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/20 italic text-white/80 text-sm">
          "Teaching kids to count is fine, but teaching them what counts is best."
        </div>
      </div>

      {/* 2. QUICK ANALYTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: "Today's Classes", value: todaysClasses.length, icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Total Students", value: totalStudents, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          // { label: "Slot Requests", value: pendingSlotsCount, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Pending Tasks", value: pendingTasksCount, icon: FileText, color: "text-pink-500", bg: "bg-pink-500/10" },
          // { label: "Leave Balance", value: leaveBalanceCount, icon: CalendarOff, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 3. TODAY'S SCHEDULE */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Today's Schedule
              </h2>
            </div>
            
            <div className="space-y-4">
              {todaysClasses.map((cls, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors group">
                  <div className="flex flex-col items-center justify-center min-w-[100px] border-r border-border/50 pr-4 text-center">
                    <span className="text-sm font-bold leading-tight">{cls.time}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{cls.subject}</h3>
                    <p className="text-sm text-muted-foreground">{cls.className} • {cls.students} students</p>
                  </div>
                </div>
              ))}
              {todaysClasses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">
                  No classes scheduled for today.
                </div>
              )}
            </div>
          </div>

          {/* 5. MY BATCHES */}
          {/* <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" /> My Batches
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.slice(0,4).map((b, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{b.batchName}</h3>
                    <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full font-medium">
                      {b.batchStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">{b.courseName}</p>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {students?.filter(s => s.batchId === b._id).length || 0} Students
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className="font-medium">{getBatchAttendanceRate(b._id)}%</span>
                  </div>
                  <Progress value={getBatchAttendanceRate(b._id)} className="h-1.5 mb-4" />
                  <Button asChild variant="outline" className="w-full text-xs h-8">
                    <Link href={`/teacher/batches/${b._id}`}>Open Batch</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div> */}

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          
          {/* 14. QUICK ACTIONS */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/teacher/attendance">
                  <CheckCircle className="w-5 h-5" /> Take Attendance
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/teacher/drawing-tests">
                  <FileText className="w-5 h-5" /> Drawing Tasks
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/teacher/leave">
                  <CalendarOff className="w-5 h-5" /> Apply Leave
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/teacher/progress">
                  <Users className="w-5 h-5" /> Student Progress
                </Link>
              </Button>
            </div>
          </div>

          {/* 19. SMART INSIGHTS */}
          {/* <div className="glass-card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/50">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" /> Smart Insights
            </h2>
            <div className="space-y-3">
              {smartInsights.map((insight, i) => (
                <div key={i} className="flex gap-3 text-sm text-indigo-900/80 dark:text-indigo-200/80 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          </div> */}

          {/* 9. SLOT REQUESTS (Mini) */}
          <div className="glass-card p-6">
            {/* <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" /> Pending Slots
              </h2>
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingSlotsCount}
              </span>
            </div> */}
            {/* <div className="space-y-3">
              {pendingQueries.length > 0 ? pendingQueries.slice(0,3).map(r => (
                <div key={r._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.personName || "User"} size={32} />
                    <div>
                      <p className="text-sm font-bold">{r.personName}</p>
                      <p className="text-xs text-muted-foreground">{r.category}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary">Review</Button>
                </div>
              )) : slotRequestsFallback.filter(r => r.status === "Pending").slice(0,3).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.student} size={32} />
                    <div>
                      <p className="text-sm font-bold">{r.student}</p>
                      <p className="text-xs text-muted-foreground">{r.time}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary">Review</Button>
                </div>
              ))}
              {pendingSlotsCount === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No pending slot requests.</p>
              )}
            </div> */}
          </div>

        </div>
      </div>
    </div>
  );
}

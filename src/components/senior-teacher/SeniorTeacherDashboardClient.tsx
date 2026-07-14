"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { 
  Users, CheckCircle, Clock, Calendar, TrendingUp, AlertCircle, 
  FileText, CalendarOff, MessageSquare, Bell, Star, Award, ChevronRight, Play, BookOpen, UserCheck, UserX, Activity, PieChart, CheckSquare
} from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface DashboardProps {
  data: {
    seniorTeacher: any;
    teachers: any[];
    batches: any[];
    students: any[];
    attendanceList: any[];
    leaves: any[];
    drawingTasks: any[];
    evaluations: any[];
    notifications: any[];
    certificates: any[];
    queries: any[];
    performances: any[];
    leaveBalances: any[];
    seniorTeacherLeaves: any[];
    myAttendances: any[];
  };
}

export function SeniorTeacherDashboardClient({ data }: DashboardProps) {
  const { 
    seniorTeacher, teachers, batches, students, attendanceList, leaves, drawingTasks, 
    evaluations, notifications, certificates, queries, performances, seniorTeacherLeaves,
    myAttendances
  } = data;
  
  // Computed data
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";
  
  const todayName = format(new Date(), "EEEE");
  const todaysClasses = useMemo(() => {
    return batches.filter(b => b.batchDay === todayName || b.batchDay === "Everyday");
  }, [batches, todayName]);

  const activeBatchesCount = batches.filter(b => b.batchStatus === "Active").length;
  const pendingTasksCount = drawingTasks.length;
  
  const totalStudents = batches.reduce((sum, b) => sum + (b.students?.length || 0), 0) || students.length;
  const totalTeachers = teachers.length;

  const attendanceRate = batches.length > 0 
    ? Math.round(batches.reduce((sum, b) => sum + (b.attendanceSummary?.averageAttendancePercent || 0), 0) / batches.length)
    : 0;

  // Calculate Profile Completion
  const profileFields = [
    'fullName', 'email', 'phone', 'address', 'specialization', 
    'joiningDate', 'qualification', 'profileImage', 'courseName', 'branchName'
  ];
  const filledFields = profileFields.filter(field => seniorTeacher[field]);
  const profileCompletion = Math.round((filledFields.length / profileFields.length) * 100);

  // Calculate Average Score of managed teachers
  const totalScore = performances.reduce((sum, p) => sum + (p.averagePerformance || 0), 0);
  const performanceRating = performances.length > 0 ? (totalScore / performances.length).toFixed(1) : (seniorTeacher.performanceScore || 4.8).toFixed(1);

  // Calculate if Senior Teacher is Present or On Leave Today
  const todayStr = new Date().toISOString().split('T')[0];
  const isOnLeave = seniorTeacherLeaves?.some(l => 
    l.status === "Approved" && 
    l.fromDate <= todayStr && 
    l.toDate >= todayStr
  );
  
  const todayAttendance = myAttendances?.find((a: any) => a.attendanceDate === todayStr);

  let attendanceStatus = "Pending";
  let attendanceStatusColor = "text-muted-foreground";

  if (isOnLeave) {
    attendanceStatus = "On Leave";
    attendanceStatusColor = "text-warning";
  } else if (todayAttendance) {
    attendanceStatus = todayAttendance.status;
    attendanceStatusColor = 
      todayAttendance.status === "Present" ? "text-success" : 
      todayAttendance.status === "Absent" ? "text-destructive" : "text-warning";
  } else {
    attendanceStatus = "Not Marked";
    attendanceStatusColor = "text-muted-foreground";
  }

  const pendingSlotsCount = queries.length;

  const smartInsights = [
    `You have completed ${attendanceRate}% of average attendance marking.`,
    `Batch ${batches[0]?.batchName || 'Advanced'} is currently active.`,
    `${certificates.length} certificates have been issued to students.`,
    `${pendingSlotsCount} slot requests require approval.`,
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
              <Avatar name={seniorTeacher.fullName} src={seniorTeacher.profileImage} size={96} className="w-24 h-24 border-4 border-white/30 shadow-xl" />
              <div className="absolute -bottom-2 -right-2 bg-success text-white p-1 rounded-full border-2 border-white">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-white/80 font-medium tracking-wide uppercase text-sm">{greeting}</p>
              <h1 className="text-3xl md:text-4xl font-bold mt-1 mb-2">{seniorTeacher.fullName}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-white/90">
                <span className="flex items-center gap-1"><Award className="w-4 h-4"/> Senior Teacher</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> ID: {seniorTeacher.badgeId || "STCH-001"}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {format(new Date(), "EEEE, MMM do")}</span>
              </div>
            </div>
          </div>
          
          <div className="glass-card !bg-white/10 !border-white/20 p-5 rounded-2xl flex gap-6 w-full md:w-auto">
            <div className="text-center">
              <div className="text-3xl font-bold">{profileCompletion}%</div>
              <div className="text-xs text-white/70 mt-1 uppercase tracking-wider">Profile</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl font-bold">{performanceRating}</div>
              <div className="text-xs text-white/70 mt-1 uppercase tracking-wider">Score</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${attendanceStatusColor}`}>{attendanceStatus}</div>
              <div className="text-xs text-white/70 mt-1 uppercase tracking-wider">Today</div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/20 italic text-white/80 text-sm">
          "Leadership is unlocking people's potential to become better."
        </div>
      </div>

      {/* 2. EXECUTIVE SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: "Teachers", value: totalTeachers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Students", value: totalStudents, icon: UserCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Batches", value: activeBatchesCount, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Classes Today", value: todaysClasses.length, icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Slot Approvals", value: pendingSlotsCount, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Pending Tasks", value: pendingTasksCount, icon: FileText, color: "text-pink-500", bg: "bg-pink-500/10" },
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER COLUMNS */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* 4. TEACHER MANAGEMENT */}
          <div className="glass-card p-6 border-blue-500/20 shadow-blue-500/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Teacher Management
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/senior-teacher/teachers">Manage Teachers <ChevronRight className="w-4 h-4 ml-1"/></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
               <div className="p-4 rounded-xl border border-border/50 bg-muted/20 flex justify-between items-center">
                 <div>
                   <p className="text-sm text-muted-foreground">Present Today</p>
                   <p className="text-2xl font-bold text-success">{Math.max(0, totalTeachers - leaves.length)}</p>
                 </div>
                 <UserCheck className="w-8 h-8 text-success/20" />
               </div>
               <div className="p-4 rounded-xl border border-border/50 bg-muted/20 flex justify-between items-center">
                 <div>
                   <p className="text-sm text-muted-foreground">On Leave Today</p>
                   <p className="text-2xl font-bold text-warning">{leaves.length}</p>
                 </div>
                 <UserX className="w-8 h-8 text-warning/20" />
               </div>
            </div>

            <div className="space-y-3">
              {teachers.slice(0,3).map(t => {
                const perf = performances.find(p => p.teacherId === t._id.toString());
                const score = perf?.averagePerformance || 4.5;
                return (
                  <div key={t._id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar name={t.fullName} src={t.photo} size={40} />
                      <div>
                        <p className="font-bold">{t.fullName}</p>
                        <p className="text-xs text-muted-foreground">{t.specialization || 'Art Teacher'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold flex items-center justify-end gap-1"><Star className="w-3 h-3 text-warning fill-warning"/> {score}</p>
                      <p className="text-xs text-muted-foreground">Performance</p>
                    </div>
                  </div>
                )
              })}
              {teachers.length === 0 && <p className="text-center py-4 text-muted-foreground">No teachers managed yet.</p>}
            </div>
          </div>

          {/* 3. TODAY'S CLASS SCHEDULE */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Today's Class Schedule
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/senior-teacher/classes">View All <ChevronRight className="w-4 h-4 ml-1"/></Link>
              </Button>
            </div>
            
            <div className="space-y-4">
              {todaysClasses.slice(0,4).map((cls, i) => (
                <div key={cls._id} className="flex gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors group">
                  <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-border/50 pr-4">
                    <span className="text-lg font-bold">{cls.batchTime?.split(" ")[0] || '10:00'}</span>
                    <span className="text-xs text-muted-foreground uppercase">{cls.batchTime?.split(" ")[1] || "AM"}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{cls.courseName}</h3>
                    <p className="text-sm text-muted-foreground">{cls.batchName} • {cls.students?.length || 0} students</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="rounded-full">
                      View Class
                    </Button>
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

          {/* 6. BATCH OVERVIEW */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" /> Batch Overview
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/senior-teacher/batches">View All <ChevronRight className="w-4 h-4 ml-1"/></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.slice(0,4).map((b) => (
                <div key={b._id} className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:-translate-y-1 transition-transform">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{b.batchName}</h3>
                    <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full font-medium">
                      {b.batchStatus}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{b.courseName}</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{b.attendanceSummary?.averageAttendancePercent || 0}%</span>
                  </div>
                  <Progress value={b.attendanceSummary?.averageAttendancePercent || 0} className="h-1.5 mb-4" />
                  <Button asChild variant="outline" className="w-full text-xs h-8">
                    <Link href={`/senior-teacher/batches/${b._id}`}>Open Batch</Link>
                  </Button>
                </div>
              ))}
              {batches.length === 0 && (
                 <div className="col-span-2 text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">
                 No batches assigned.
               </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          
          {/* 14. QUICK ACTIONS */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
               <Activity className="w-5 h-5 text-purple-500" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/senior-teacher/teachers">
                  <Users className="w-5 h-5" /> Manage Teachers
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/senior-teacher/students">
                  <UserCheck className="w-5 h-5" /> Open Students
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/senior-teacher/batches">
                  <BookOpen className="w-5 h-5" /> Manage Batches
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/senior-teacher/attendance">
                  <CheckSquare className="w-5 h-5" /> Attendance
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/senior-teacher/slot-requests">
                  <Clock className="w-5 h-5" /> Slot Requests
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                <Link href="/senior-teacher/leave">
                  <CalendarOff className="w-5 h-5" /> Leave Approvals
                </Link>
              </Button>
            </div>
          </div>

          {/* 17. SMART INSIGHTS */}
          <div className="glass-card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/50">
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
          </div>

          {/* 8. SLOT REQUESTS */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" /> Pending Slots
              </h2>
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingSlotsCount}
              </span>
            </div>
            <div className="space-y-3">
              {queries.slice(0,3).map(q => (
                <div key={q._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar name={q.personName || "User"} size={32} />
                    <div>
                      <p className="text-sm font-bold">{q.personName}</p>
                      <p className="text-xs text-muted-foreground">{q.category}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary" asChild>
                    <Link href="/senior-teacher/slot-requests">Review</Link>
                  </Button>
                </div>
              ))}
              {queries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No pending slot requests.</p>
              )}
            </div>
          </div>

          {/* 9. DRAWING TASK MONITOR */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500" /> Drawing Tasks
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-pink-500/10 text-pink-700 dark:text-pink-300">
                <span className="font-bold">Pending Review</span>
                <span className="font-bold text-xl">{drawingTasks.length}</span>
              </div>
              <Button asChild variant="outline" className="w-full text-xs">
                <Link href="/senior-teacher/drawing-tasks">Evaluate Tasks</Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

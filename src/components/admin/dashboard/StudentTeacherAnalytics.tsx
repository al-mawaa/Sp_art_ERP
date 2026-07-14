import React from "react";
import { Users, GraduationCap, Building, Star, Award, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalyticsProps {
  data: any;
}

export function StudentTeacherAnalytics({ data }: AnalyticsProps) {
  const topTeachers = [...data.teachers].sort((a: any, b: any) => (b.performanceScore || 0) - (a.performanceScore || 0)).slice(0, 3);
  const activeStudents = data.students.filter((s: any) => s.status === "Active" || s.status === "Enrolled");

  // Course wise breakdown
  const courseCount: Record<string, number> = {};
  data.courses.forEach((c: any) => {
    courseCount[c.courseName] = data.batches.filter((b: any) => b.courseName === c.courseName).length;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* STUDENT ANALYTICS */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Student Analytics
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-border/50 bg-blue-500/5">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeStudents.length}</div>
            <div className="text-sm font-semibold text-muted-foreground">Active Students</div>
          </div>
          <div className="p-4 rounded-xl border border-border/50 bg-indigo-500/5">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.enrollments.filter((e: any) => e.status === "completed").length}</div>
            <div className="text-sm font-semibold text-muted-foreground">Completed Admissions</div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-muted-foreground mb-3">Course Distribution (Batches)</h3>
        <div className="space-y-4">
          {Object.entries(courseCount).slice(0, 4).map(([courseName, count], i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{courseName}</span>
                <span className="text-muted-foreground">{count} Batches</span>
              </div>
              <Progress value={Math.min((count / data.batches.length) * 100, 100) || 0} className="h-2" />
            </div>
          ))}
          {Object.keys(courseCount).length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">No course data available</div>
          )}
        </div>
      </div>

      {/* TEACHER ANALYTICS */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-500" /> Staff Analytics
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data.teachers.length}</div>
              <div className="text-xs font-semibold text-muted-foreground">Teachers</div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Building className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data.seniorTeachers.length}</div>
              <div className="text-xs font-semibold text-muted-foreground">Sr. Teachers</div>
            </div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-1">
          <Star className="w-4 h-4 text-warning" /> Top Performing Teachers
        </h3>
        <div className="space-y-3">
          {topTeachers.length > 0 ? topTeachers.map((t: any) => (
            <div key={t._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {t.fullName?.charAt(0) || "T"}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.fullName}</div>
                  <div className="text-xs text-muted-foreground">{t.specialization || "Art Teacher"}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-sm">
                {t.performanceScore?.toFixed(1) || "4.5"} <Award className="w-4 h-4 text-warning" />
              </div>
            </div>
          )) : (
            <div className="text-sm text-muted-foreground text-center py-4">No teacher performance data available</div>
          )}
        </div>
      </div>
    </div>
  );
}

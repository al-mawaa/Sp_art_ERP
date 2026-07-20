import React from "react";
import { Activity, Clock, CheckCircle, XCircle, AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LiveMonitorsProps {
  data: any;
  todaysClasses: any[];
  todayStr: string;
}

export function LiveMonitors({ data, todaysClasses, todayStr }: LiveMonitorsProps) {
  // Compute attendance stats
  const totalStudentsInTodayClasses = todaysClasses.reduce((sum, b) => sum + (b.students?.length || 0), 0);
  
  // Actually, student attendance is in data.studentAttendance
  const studentPresent = data.studentAttendance.filter((a: any) => a.status === "Present").length;
  const studentAbsent = data.studentAttendance.filter((a: any) => a.status === "Absent").length;
  
  const teacherPresent = data.teacherAttendance.filter((a: any) => a.status === "Present" || a.status === "Half Day").length;
  const teacherAbsent = data.teacherAttendance.filter((a: any) => a.status === "Absent").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      
      {/* TODAY'S CLASS MONITOR */}
      <div className="lg:col-span-2 glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" /> Today's Class Monitor
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/batches">View All</Link>
          </Button>
        </div>

        <div className="space-y-3">
          {todaysClasses.slice(0, 5).map((cls, i) => {
            // Find if attendance is marked
            const isAttendanceMarked = data.teacherAttendance.some((a: any) => a.batchId === cls._id?.toString() && a.attendanceDate?.startsWith(todayStr));
            
            return (
              <div key={cls._id || i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col items-center justify-center min-w-[80px] sm:border-r border-border/50 sm:pr-4">
                  <span className="text-lg font-bold text-primary">{cls.batchTime?.split(" ")[0] || "10:00"}</span>
                  <span className="text-xs text-muted-foreground uppercase font-bold">{cls.batchTime?.split(" ")[1] || "AM"}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base">{cls.courseName}</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <span className="font-medium text-foreground">{cls.batchName}</span>
                    <span>•</span>
                    <span>{cls.students?.length || 0} students</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isAttendanceMarked ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Att. Marked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                  <Button size="sm" variant="outline" className="h-8 rounded-full">
                    View
                  </Button>
                </div>
              </div>
            );
          })}
          
          {todaysClasses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              No classes scheduled for today.
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

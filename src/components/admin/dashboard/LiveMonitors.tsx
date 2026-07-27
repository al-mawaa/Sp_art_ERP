import React, { useState, useEffect } from "react";
import { Activity, Clock, CheckCircle, AlertCircle, Play, Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface LiveMonitorsProps {
  data: any;
  todaysClasses: any[];
  todayStr: string;
}

interface ClassWithTeacher {
  _id: string;
  courseName: string;
  batchName: string;
  batchTime: string;
  batchDay: string;
  roomNumber?: string;
  students: any[];
  teacherIds: any[];
  teacherName?: string;
  status: "Upcoming" | "Ongoing" | "Completed";
}

export function LiveMonitors({ data, todaysClasses, todayStr }: LiveMonitorsProps) {
  const router = useRouter();
  const [classesWithTeachers, setClassesWithTeachers] = useState<ClassWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const enrichClassesWithTeachers = async () => {
      try {
        setLoading(true);
        setError(null);

        const enrichedClasses = await Promise.all(
          todaysClasses.slice(0, 5).map(async (cls) => {
            let teacherName = "Not Assigned";
            if (cls.teacherIds && cls.teacherIds.length > 0) {
              try {
                const teacherResponse = await fetch(`/api/admin/teachers/${cls.teacherIds[0]}`);
                if (teacherResponse.ok) {
                  const teacherResult = await teacherResponse.json();
                  if (teacherResult.success && teacherResult.teacher) {
                    teacherName = teacherResult.teacher.fullName;
                  }
                }
              } catch (err) {
                console.error("Error fetching teacher:", err);
              }
            }

            // Determine class status based on time
            const now = new Date();
            const [timeStr, period] = cls.batchTime?.split(" ") || ["10:00", "AM"];
            const [hours, minutes] = timeStr.split(":").map(Number);
            let classHour = hours;
            if (period === "PM" && hours !== 12) classHour += 12;
            if (period === "AM" && hours === 12) classHour = 0;

            const classTime = new Date();
            classTime.setHours(classHour, minutes, 0, 0);

            const classEndTime = new Date(classTime);
            classEndTime.setHours(classTime.getHours() + 2); // Assume 2-hour class

            let status: "Upcoming" | "Ongoing" | "Completed" = "Upcoming";
            if (now >= classEndTime) {
              status = "Completed";
            } else if (now >= classTime) {
              status = "Ongoing";
            }

            return {
              _id: cls._id?.toString() || "",
              courseName: cls.courseName || "Unknown Course",
              batchName: cls.batchName || "Unknown Batch",
              batchTime: cls.batchTime || "10:00 AM",
              batchDay: cls.batchDay || "Unknown",
              roomNumber: cls.roomNumber || "TBD",
              students: cls.students || [],
              teacherIds: cls.teacherIds || [],
              teacherName,
              status,
            };
          })
        );

        setClassesWithTeachers(enrichedClasses);
      } catch (err) {
        console.error("Error enriching classes:", err);
        setError("Failed to load class details");
      } finally {
        setLoading(false);
      }
    };

    enrichClassesWithTeachers();
  }, [todaysClasses]);

  // Check if attendance is marked for a class
  const isAttendanceMarked = (classId: string) => {
    return data.teacherAttendance.some(
      (a: any) => a.batchId === classId && a.attendanceDate?.startsWith(todayStr)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ongoing":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30";
      case "Completed":
        return "text-slate-600 bg-slate-50 dark:bg-slate-950/30";
      case "Upcoming":
      default:
        return "text-blue-600 bg-blue-50 dark:bg-blue-950/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Ongoing":
        return <Play className="w-3 h-3" />;
      case "Completed":
        return <CheckCircle className="w-3 h-3" />;
      case "Upcoming":
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <>
      {/* TODAY'S CLASS MONITOR */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" /> Today's Class Monitor
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/admin/attendance")}
            className="text-primary hover:text-primary/80"
          >
            View All
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : classesWithTeachers.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No classes scheduled for today.</p>
            <p className="text-sm text-muted-foreground mt-1">Enjoy your day!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classesWithTeachers.map((cls) => (
              <div 
                key={cls._id} 
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col items-center justify-center min-w-[80px] sm:border-r border-border/50 sm:pr-4">
                  <span className="text-lg font-bold text-primary">{cls.batchTime?.split(" ")[0] || "10:00"}</span>
                  <span className="text-xs text-muted-foreground uppercase font-bold">{cls.batchTime?.split(" ")[1] || "AM"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{cls.courseName}</h3>
                  <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-medium text-foreground">{cls.batchName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {cls.students.length} students
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {cls.roomNumber}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>Teacher: {cls.teacherName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(cls.status)}`}>
                    {getStatusIcon(cls.status)}
                    {cls.status}
                  </span>
                  {isAttendanceMarked(cls._id) ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Att. Marked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 rounded-full"
                    onClick={() => router.push(`/admin/attendance`)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

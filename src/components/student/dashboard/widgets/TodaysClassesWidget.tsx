import React from "react";
import { Clock, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function TodaysClassesWidget({ profile, classes }: any) {
  // Helper function to get teacher name from various possible formats
  const getTeacherName = (teacher: any) => {
    if (typeof teacher === 'string') return teacher;
    if (Array.isArray(teacher) && teacher.length > 0) {
      return typeof teacher[0] === 'string' ? teacher[0] : teacher[0]?.name || 'Assigned Teacher';
    }
    if (teacher?.name) return teacher.name;
    return 'Assigned Teacher';
  };

  // Helper function to determine class status based on timing
  const getClassStatus = (time: string) => {
    if (!time || time === 'TBD') return 'Upcoming';
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0, 0);
    
    const diffMinutes = (classTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (diffMinutes <= 15 && diffMinutes >= -60) return 'Live';
    if (diffMinutes < -60) return 'Completed';
    return 'Upcoming';
  };

  // Use fetched classes or fallback to profile data if empty
  const activeClasses = classes && classes.length > 0 ? classes.map((c: any, index: number) => {
    const time = c.batchTime || c.batchTiming || c.startTime || "TBD";
    return {
      id: c._id || index,
      subject: c.courseName || c.batchName || c.subject || "Class",
      time: time,
      teacher: getTeacherName(c.teachers || c.teacher || profile?.teacherName),
      status: getClassStatus(time),
    };
  }) : [
    {
      id: 1,
      subject: profile?.courseName || profile?.batchName || "No active classes",
      time: profile?.batchTiming || profile?.batchTime || "TBD",
      teacher: getTeacherName(profile?.teacherName),
      status: "Upcoming",
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 text-lg">Today's Classes</h3>
        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
          {activeClasses.length} Classes
        </span>
      </div>

      <div className="space-y-4">
        {activeClasses.map((cls: any) => (
          <div key={cls.id} className={`p-4 rounded-xl border ${cls.status === 'Live' ? 'border-red-200 bg-red-50/50' : cls.status === 'Completed' ? 'border-slate-200 bg-slate-100/50' : 'border-slate-100 bg-slate-50/50'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-slate-800">{cls.subject}</h4>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                  <Clock size={14} /> {cls.time}
                </p>
              </div>
              {cls.status === 'Live' && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> LIVE
                </span>
              )}
              {cls.status === 'Completed' && (
                <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded">
                  Completed
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  {cls.teacher.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-600">{cls.teacher}</span>
              </div>
              {cls.status === 'Live' ? (
                <Button 
                  size="sm" 
                  variant="default"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  <Play size={14} className="mr-1" /> Join Class
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline" className="rounded-lg">
                  <Link href="/student/my-classes">
                    <Video size={14} className="mr-1" /> View Details
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

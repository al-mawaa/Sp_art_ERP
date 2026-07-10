import React from "react";
import { Clock, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TodaysClassesWidget({ profile }: any) {
  // Mock data for classes
  const classes = [
    {
      id: 1,
      subject: profile?.courseName || "Acrylic Painting",
      time: "4:00 PM - 5:00 PM",
      teacher: profile?.teacherName || "Sneha Kulkarni",
      status: "Live", // Live, Upcoming, Completed
    },
    {
      id: 2,
      subject: "Sketching Basics",
      time: "5:30 PM - 6:30 PM",
      teacher: "Rahul Desai",
      status: "Upcoming",
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 text-lg">Today's Classes</h3>
        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
          {classes.length} Classes
        </span>
      </div>

      <div className="space-y-4">
        {classes.map((cls) => (
          <div key={cls.id} className={`p-4 rounded-xl border ${cls.status === 'Live' ? 'border-red-200 bg-red-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
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
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  {cls.teacher.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-600">{cls.teacher}</span>
              </div>
              <Button 
                size="sm" 
                variant={cls.status === 'Live' ? 'default' : 'outline'}
                className={cls.status === 'Live' ? 'bg-red-600 hover:bg-red-700 text-white rounded-lg' : 'rounded-lg'}
              >
                {cls.status === 'Live' ? (
                  <><Play size={14} className="mr-1" /> Join Class</>
                ) : (
                  <><Video size={14} className="mr-1" /> View Details</>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

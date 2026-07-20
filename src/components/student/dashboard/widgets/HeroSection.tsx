import React from "react";
import { BookOpen, Clock } from "lucide-react";

export function HeroSection({ profile, classes }: { profile: any, classes?: any[] }) {
  const studentName = profile?.fullName || "Student";
  const course = profile?.courseName || "Art Foundation";
  const batch = profile?.batchName || "Weekend Batch";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-8 sm:p-10 text-white shadow-xl">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-400 p-1 shadow-2xl">
              <div className="w-full h-full rounded-xl bg-indigo-950 flex items-center justify-center overflow-hidden">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt={studentName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">{studentName.charAt(0)}</span>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-indigo-200 font-medium tracking-wide uppercase text-sm mb-1">Welcome back,</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{studentName}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-indigo-100">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                <BookOpen size={14} /> {course}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                <Clock size={14} /> {batch}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

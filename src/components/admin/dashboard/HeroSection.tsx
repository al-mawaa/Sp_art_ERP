import React from "react";
import { format } from "date-fns";
import { Sparkles, IndianRupee, Users, CheckCircle } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";

interface HeroSectionProps {
  kpiData: {
    totalRevenue: number;
    todayCollection: number;
    todaysClasses: number;
    pendingApprovals: number;
  };
}

export function HeroSection({ kpiData }: HeroSectionProps) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="relative overflow-hidden rounded-3xl premium-gradient p-8 text-white shadow-2xl">
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
        <Sparkles className="w-64 h-64" />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar name="Admin User" size={96} className="w-24 h-24 border-4 border-white/30 shadow-xl" />
            <div className="absolute -bottom-2 -right-2 bg-success text-white p-1 rounded-full border-2 border-white">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-white/80 font-medium tracking-wide uppercase text-sm">{greeting}</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-1 mb-2">System Administrator</h1>
            <div className="flex flex-wrap gap-3 text-sm text-white/90">
              <span className="flex items-center gap-1 font-medium bg-white/20 px-3 py-1 rounded-full">
                {format(new Date(), "EEEE, MMM do yyyy")}
              </span>
              <span className="flex items-center gap-1 font-medium bg-white/20 px-3 py-1 rounded-full">
                Main Branch
              </span>
            </div>
          </div>
        </div>
        
        <div className="glass-card !bg-white/10 !border-white/20 p-5 rounded-2xl flex gap-6 w-full md:w-auto overflow-x-auto no-scrollbar">
          <div className="text-center min-w-[100px]">
            <div className="text-3xl font-bold flex items-center justify-center gap-1">
              <IndianRupee className="w-6 h-6" /> {kpiData.todayCollection.toLocaleString()}
            </div>
            <div className="text-xs text-white/70 mt-1 uppercase tracking-wider font-semibold">Today's Revenue</div>
          </div>
          <div className="w-px bg-white/20 shrink-0"></div>
          <div className="text-center min-w-[100px]">
            <div className="text-3xl font-bold flex items-center justify-center gap-1">
              <Users className="w-6 h-6" /> {kpiData.todaysClasses}
            </div>
            <div className="text-xs text-white/70 mt-1 uppercase tracking-wider font-semibold">Classes Today</div>
          </div>
          <div className="w-px bg-white/20 shrink-0"></div>
          <div className="text-center min-w-[100px]">
            <div className="text-3xl font-bold flex items-center justify-center gap-1 text-warning">
               {kpiData.pendingApprovals}
            </div>
            <div className="text-xs text-white/70 mt-1 uppercase tracking-wider font-semibold text-warning-foreground">Pending Approvals</div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/20 text-sm">
        <span className="italic text-white/80">"Data is the new oil. Business intelligence is the refinery."</span>
      </div>
    </div>
  );
}

import React from "react";
import { Activity, CheckCircle2, CircleDashed } from "lucide-react";

export function PaymentTimeline({ data }: { data: any }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
        <Activity className="text-purple-600" size={20} />
        Payment Timeline
      </h3>
      
      <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
        {data.timeline.map((item: any, i: number) => {
          const isLast = i === data.timeline.length - 1;
          
          return (
            <div key={i} className="relative pl-6">
              {/* Dot */}
              <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center bg-white ${item.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                {item.completed ? <CheckCircle2 size={20} className="fill-white" /> : <CircleDashed size={20} />}
              </div>
              
              <div className={`${item.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                <h4 className="text-sm font-semibold">{item.step}</h4>
                {item.date && (
                  <p className="text-xs mt-1 font-medium">{new Date(item.date).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

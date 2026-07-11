import React from "react";
import { User, BookOpen, Calendar, CheckCircle2 } from "lucide-react";

export function StudentPaymentSummary({ me, data }: { me: any; data?: any }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
        <User className="text-blue-600" size={20} />
        Student Summary
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
            {me?.name?.substring(0, 2) || "ST"}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{me?.name || "Student Name"}</p>
            <p className="text-xs text-slate-500">ID: SPART-2401</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1"><BookOpen size={14} /> Course</span>
            <span className="font-semibold text-slate-700">Digital Art Masterclass</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1"><Calendar size={14} /> Batch</span>
            <span className="font-semibold text-slate-700">Weekend Morning</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Payment Mode</span>
            <span className="font-semibold text-slate-700">Installment Plan</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
            <span className="text-slate-500">Current Status</span>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              <CheckCircle2 size={12} />
              Partially Paid
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

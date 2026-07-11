import React from "react";
import { Bell, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NextPaymentWidget({ data, onPay }: { data: any, onPay: (amt: number, info?: any) => void }) {
  if (data.nextDueAmount === 0) {
    return null; // All paid up
  }

  const dueDate = new Date(data.nextDueDate);
  const today = new Date();
  const diffTime = Math.abs(dueDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = today > dueDate;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            {isOverdue ? <AlertTriangle size={24} /> : <Bell size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-800 text-lg">Next Payment Due</h3>
              {isOverdue && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Overdue
                </span>
              )}
            </div>
            <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
              ₹{data.nextDueAmount.toLocaleString()} • {isOverdue ? `${diffDays} days ago` : `Due in ${diffDays} days`} ({dueDate.toLocaleDateString()})
            </p>
          </div>
        </div>

        <Button 
          className={`rounded-xl text-white shadow-soft transition-transform hover:scale-105 ${isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          onClick={() => onPay(data.nextDueAmount, { termNo: data.nextTermNo })}
        >
          Pay ₹{data.nextDueAmount.toLocaleString()}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

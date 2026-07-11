import React from "react";
import { Layers, Calendar, Check, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallmentTracker({ data, onPay }: { data: any, onPay: (amt: number, inst: any) => void }) {
  const percentComplete = (data.paid / (data.totalFee + data.installmentCharges - data.referralDiscount - data.couponDiscount)) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Layers className="text-blue-600" size={20} />
          Installment Plan
        </h3>
        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          3 Months Term
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2 font-medium">
          <span className="text-slate-600">Overall Progress</span>
          <span className="text-slate-800">{Math.round(percentComplete)}% Paid</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
      </div>

      {/* Installments List */}
      <div className="space-y-4">
        {data.installments.map((inst: any, idx: number) => {
          const isPaid = inst.status === "Paid";
          const isPending = inst.status === "Pending";
          const isOverdue = inst.status === "Overdue";

          return (
            <div key={idx} className={`p-4 rounded-xl border ${isPaid ? 'bg-emerald-50/50 border-emerald-100' : isOverdue ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-200'} transition-all hover:shadow-sm`}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-600' : isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isPaid ? <Check size={16} /> : isOverdue ? <AlertCircle size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{inst.term}</h4>
                    <p className="text-sm font-bold mt-0.5">₹{inst.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={12} /> Due: {new Date(inst.dueDate).toLocaleDateString()}</span>
                      {isPaid && <span className="text-emerald-600">Paid on {new Date(inst.paidDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end sm:flex-col sm:items-end gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isPaid ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                    {inst.status}
                  </span>
                  {!isPaid && (
                    <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onPay(inst.amount, inst)}>
                      Pay Now
                    </Button>
                  )}
                  {isPaid && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-lg h-7 text-xs"
                      onClick={() => {
                        if (data.enrollmentId) {
                          window.open(`/api/student/enrollment-invoice?enrollmentId=${data.enrollmentId}`, "_blank");
                        }
                      }}
                    >
                      Invoice
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

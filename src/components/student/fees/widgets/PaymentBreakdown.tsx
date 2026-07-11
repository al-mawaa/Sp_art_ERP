import React from "react";
import { Receipt } from "lucide-react";

export function PaymentBreakdown({ data }: { data: any }) {
  const baseFee = data.totalFee - data.gst;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
        <Receipt className="text-indigo-600" size={20} />
        Payment Breakdown
      </h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Base Course Fee</span>
          <span className="font-medium">₹{baseFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">GST (18%)</span>
          <span className="font-medium">₹{data.gst.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Installment Charges</span>
          <span className="font-medium text-amber-600">+₹{data.installmentCharges.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Referral Discount</span>
          <span className="font-medium text-emerald-600">-₹{data.referralDiscount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Coupon Discount</span>
          <span className="font-medium text-emerald-600">-₹{data.couponDiscount.toLocaleString()}</span>
        </div>
        
        <div className="border-t border-dashed border-slate-200 my-3 pt-3"></div>
        
        <div className="flex justify-between items-end">
          <span className="font-semibold text-slate-800">Grand Total</span>
          <span className="text-lg font-bold text-slate-900">₹{(data.totalFee + data.installmentCharges - data.referralDiscount - data.couponDiscount).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

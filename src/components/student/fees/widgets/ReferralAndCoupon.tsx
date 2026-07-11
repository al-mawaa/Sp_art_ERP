import React from "react";
import { Tag, Users } from "lucide-react";

export function ReferralAndCoupon({ data }: { data?: any }) {
  return (
    <div className="space-y-6">
      {/* Referral Discount */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl shadow-sm border border-emerald-100 p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Users size={64} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1">
            <Users size={18} />
            <span>Referral Earnings Applied</span>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600">-₹500</span>
            <span className="text-xs text-emerald-600 font-medium mb-1.5">From 1 successful invite</span>
          </div>
        </div>
      </div>

      {/* Coupon Applied */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Tag size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">SUMMER24</h4>
            <p className="text-xs text-slate-500">Coupon applied</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-purple-600">-₹1,000</span>
        </div>
      </div>
    </div>
  );
}

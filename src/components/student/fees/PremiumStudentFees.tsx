"use client";

import React, { useState, useEffect } from "react";
import { FeesAnalyticsCards } from "./widgets/FeesAnalyticsCards";
import { StudentPaymentSummary } from "./widgets/StudentPaymentSummary";
import { PaymentBreakdown } from "./widgets/PaymentBreakdown";
import { InstallmentTracker } from "./widgets/InstallmentTracker";
import { PaymentTimeline } from "./widgets/PaymentTimeline";
import { NextPaymentWidget } from "./widgets/NextPaymentWidget";
import { PaymentHistoryTable } from "./widgets/PaymentHistoryTable";
import { OnlinePaymentModal } from "./widgets/OnlinePaymentModal";
import { InvoiceSection } from "./widgets/InvoiceSection";
import { PaymentAnalytics } from "./widgets/PaymentAnalytics";
import { ReferralAndCoupon } from "./widgets/ReferralAndCoupon";
import { CertificateEligibility } from "./widgets/CertificateEligibility";
import { QuickActions } from "./widgets/QuickActions";
import { useStore } from "@/store/dataStore";
import { toast } from "sonner";

export function PremiumStudentFees() {
  const students = useStore(s => s.students);
  const me = students[0] || { name: "Student", totalFee: 20000, paidFee: 10000 };
  
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [activeInstallment, setActiveInstallment] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  const fetchEnrollments = async () => {
    try {
      const res = await fetch(`/api/student/enrolled-courses?_t=${Date.now()}`, {
        cache: "no-store"
      });
      const data = await res.json();
      if (res.ok && data.enrolledCourses) {
        setEnrollments(data.enrolledCourses);
      }
    } catch (err) {
      console.error("Error fetching enrollments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading your payment dashboard...</p>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Active Enrollments</h2>
          <p className="text-slate-500">You don't have any active course enrollments yet.</p>
        </div>
      </div>
    );
  }

  const activeEnrollment = enrollments[activeIdx];

  // Map API data to Widget format
  const mappedData = {
    totalFee: activeEnrollment.totalAmount || 0,
    gst: activeEnrollment.gstAmount || 0,
    baseAmount: activeEnrollment.baseAmount || 0,
    installmentCharges: activeEnrollment.installmentCharge || 0,
    referralDiscount: activeEnrollment.referralDiscountTotal || 0,
    couponDiscount: 0, // Placeholder
    paid: activeEnrollment.paidAmount || 0,
    remaining: activeEnrollment.remainingAmount || 0,
    nextDueAmount: activeEnrollment.nextDueAmount || 0,
    nextDueDate: activeEnrollment.nextDueDate || "",
    nextTermNo: activeEnrollment.nextTermNo || null,
    paymentType: activeEnrollment.paymentType,
    status: activeEnrollment.paymentStatus,
    installments: activeEnrollment.installments.map((i: any) => ({
      id: i.termNo,
      termNo: i.termNo,
      term: `Term ${i.termNo}`,
      amount: i.amount,
      status: i.paymentStatus === "paid" ? "Paid" : (i.paymentStatus === "overdue" ? "Overdue" : "Pending"),
      dueDate: i.dueDate,
      paidDate: i.paidDate,
    })),
    timeline: [
      { step: "Enrollment Created", completed: true, date: activeEnrollment.enrollmentDate },
      ...(activeEnrollment.paymentHistory.length > 0 ? [{ step: "First Payment Paid", completed: true, date: activeEnrollment.paymentHistory[activeEnrollment.paymentHistory.length - 1]?.paymentDate }] : []),
      ...(activeEnrollment.nextDueDate ? [{ step: "Next Installment Pending", completed: false, date: activeEnrollment.nextDueDate }] : []),
      { step: "Final Payment Completed", completed: activeEnrollment.remainingAmount === 0 }
    ],
    courseTitle: activeEnrollment.courseTitle,
    courseId: activeEnrollment.courseId,
    enrollmentId: activeEnrollment.enrollmentId
  };

  const handlePay = (amount: number, installment?: any) => {
    setPayAmount(amount);
    setActiveInstallment(installment);
    setPayOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-display">Fees & Payments</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-slate-500">Manage your course fees, installments, and invoices.</p>
              {enrollments.length > 1 && (
                <select 
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1 shadow-sm focus:ring-2 focus:ring-blue-500"
                  value={activeIdx}
                  onChange={(e) => setActiveIdx(Number(e.target.value))}
                >
                  {enrollments.map((e, idx) => (
                    <option key={e.enrollmentId} value={idx}>{e.courseTitle}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <QuickActions onPayClick={() => handlePay(mappedData.nextDueAmount > 0 ? mappedData.nextDueAmount : mappedData.remaining, { termNo: mappedData.nextTermNo || 1 })} />
        </div>

        {/* Analytics Row */}
        <FeesAnalyticsCards data={mappedData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <NextPaymentWidget data={mappedData} onPay={handlePay} />
            {mappedData.installments.length > 0 && (
              <InstallmentTracker data={mappedData} onPay={handlePay} />
            )}
            <PaymentHistoryTable payments={activeEnrollment.paymentHistory} enrollmentId={activeEnrollment.enrollmentId} />
            <PaymentAnalytics />
          </div>

          {/* Sidebar Widgets Column */}
          <div className="space-y-6">
            <StudentPaymentSummary me={me} data={mappedData} />
            <PaymentBreakdown data={mappedData} />
            {(mappedData.referralDiscount > 0 || mappedData.couponDiscount > 0) && (
              <ReferralAndCoupon data={mappedData} />
            )}
            <PaymentTimeline data={mappedData} />
            {activeEnrollment.paymentHistory.length > 0 && (
              <InvoiceSection data={mappedData} me={me} history={activeEnrollment.paymentHistory} />
            )}
            <CertificateEligibility data={mappedData} />
          </div>
        </div>
      </div>

      <OnlinePaymentModal 
        open={payOpen} 
        setOpen={setPayOpen} 
        balance={payAmount} 
        activeInstallment={activeInstallment}
        me={me}
        courseId={mappedData.courseId}
        enrollmentId={mappedData.enrollmentId}
        paymentType={mappedData.paymentType}
        onSuccess={fetchEnrollments}
      />
    </div>
  );
}

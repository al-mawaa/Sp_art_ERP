import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, AlertCircle } from "lucide-react";

async function loadRazorpayScript() {
  if (typeof window === "undefined") return;
  if ((window as any).Razorpay) return;
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.body.appendChild(script);
  });
}

export function OnlinePaymentModal({ 
  open, 
  setOpen, 
  balance, 
  activeInstallment, 
  me,
  courseId,
  enrollmentId,
  paymentType,
  onSuccess 
}: { 
  open: boolean, 
  setOpen: (v: boolean) => void, 
  balance: number, 
  activeInstallment: any, 
  me: any,
  courseId: string,
  enrollmentId: string,
  paymentType: string,
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const isInstallment = activeInstallment !== undefined && activeInstallment !== null;
      const termNo = isInstallment ? activeInstallment.termNo : 1;

      // 1. Create Order via official backend API
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          paymentType: isInstallment ? "installment" : paymentType,
          termNo,
          enrollmentId
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error("Failed to create payment order: " + (data.error || "Unknown error"));
        setLoading(false);
        return;
      }

      await loadRazorpayScript();
      
      const options = {
        key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag",
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "Little Brushes Art Academy",
        description: isInstallment ? `Term ${termNo} Installment` : "Course Fee Payment",
        image: "/logo.png",
        order_id: data.order.id,
        prefill: {
          name: data.prefill?.name || me?.name || "Student",
          email: data.prefill?.email || me?.email || "",
          contact: data.prefill?.contact || "",
        },
        theme: {
          color: "#072654",
        },
        handler: async function (response: any) {
          try {
            // 2. Verify Payment on backend
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: data.amount,
                courseId,
                paymentType: isInstallment ? "installment" : paymentType,
                termNo: isInstallment ? termNo : 1,
                enrollmentId,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json();
              throw new Error(err.error || "Payment verification failed");
            }
            
            toast.success("Payment verified successfully! 🎉");
            onSuccess(); // Refresh dashboard data

          } catch (err: any) {
            toast.error("Verification Error: " + err.message);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error("Payment failed: " + response.error.description);
      });
      
      setOpen(false);
      rzp.open();
      
    } catch (error) {
      toast.error("An error occurred during checkout setup");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-r from-[#072654] to-blue-900 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <CreditCard size={32} className="text-blue-100" />
          </div>
          <DialogTitle className="text-2xl font-bold font-display">Checkout</DialogTitle>
          <p className="text-blue-200 text-sm mt-1">Complete your secure payment via Razorpay</p>
        </div>
        
        <div className="p-6 bg-slate-50">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Payment For</span>
              <span className="font-medium text-slate-800">{activeInstallment ? `Term ${activeInstallment.termNo}` : 'Full Balance'}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Student</span>
              <span className="font-medium text-slate-800">{me?.name || 'Student Name'}</span>
            </div>
            <div className="border-t border-dashed border-slate-200 my-2 pt-2"></div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Total Payable</span>
              <span className="text-xl font-black text-blue-600">₹{balance.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 mb-2">You will be securely redirected to the Razorpay Payment Gateway.</p>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle size={14} /> 100% Secure Payment
          </div>
          <Button 
            className="rounded-xl px-8 font-bold shadow-pop hover:shadow-lg transition-all" 
            style={{ background: "#072654", color: "white" }} 
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Loading..." : `Pay ₹${balance.toLocaleString()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

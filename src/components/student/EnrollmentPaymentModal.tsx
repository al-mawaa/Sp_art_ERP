"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { downloadPaymentReceiptPdf } from "@/lib/payments/receiptPdf";
import type { StudentCourseCard } from "@/lib/student/studentCourses";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

type InstallmentType = "full" | "two_installments" | "monthly";

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export function EnrollmentPaymentModal({
  open,
  onOpenChange,
  course,
  razorpayKeyId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  course: StudentCourseCard | null;
  razorpayKeyId: string;
  onSuccess: () => void;
}) {
  const [installmentType, setInstallmentType] = useState<InstallmentType>("full");
  const [loading, setLoading] = useState(false);

  if (!course) return null;

  const installmentLabel =
    installmentType === "full"
      ? "Full payment"
      : installmentType === "two_installments"
        ? "2 installments"
        : "Monthly installments";

  const handlePay = async () => {
    setLoading(true);
    try {
      const orderRes = await fetch("/api/student/enrollments/create-order", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: course.batchId,
          courseId: course.courseId,
          installmentType,
        }),
      });
      const orderJson = await parseJsonResponse<{
        error?: string;
        data?: {
          orderId: string;
          amount: number;
          keyId: string;
          receiptNumber: string;
          student: { name: string; email: string; phone?: string };
          summary: { totalAmount: number; payNow: number; remainingAfterPay: number };
        };
      }>(orderRes);

      if (!orderRes.ok) throw new Error(orderJson.error || "Could not start payment");

      const data = orderJson.data!;
      const key = data.keyId || razorpayKeyId;
      if (!key) {
        toast.error("Razorpay key missing. Set NEXT_PUBLIC_RAZORPAY_KEY_ID in .env");
        return;
      }

      await loadRazorpayScript();

      // Close enrollment dialog first — Radix overlay (z-50) blocks Razorpay inputs otherwise
      onOpenChange(false);
      await new Promise(resolve => setTimeout(resolve, 150));

      const rzp = new window.Razorpay!({
        key,
        amount: data.amount * 100,
        currency: "INR",
        name: "SP Art Hub",
        description: `${course.courseName} — ${course.batchName}`,
        order_id: data.orderId,
        prefill: {
          name: data.student.name,
          email: data.student.email,
          contact: data.student.phone || "",
        },
        theme: { color: "#f97316" },
        modal: {
          ondismiss: () => setLoading(false),
          escape: true,
          backdropclose: true,
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/student/enrollments/verify", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyJson = await parseJsonResponse<{
              error?: string;
              data?: { receiptNumber: string; paymentId: string };
            }>(verifyRes);
            if (!verifyRes.ok) throw new Error(verifyJson.error || "Verification failed");

            downloadPaymentReceiptPdf({
              studentName: data.student.name,
              courseName: course.courseName,
              batchName: course.batchName,
              amountPaid: data.amount,
              paymentId: response.razorpay_payment_id,
              receiptNumber: verifyJson.data?.receiptNumber ?? data.receiptNumber,
              paymentDate: new Date().toLocaleDateString("en-IN"),
              installmentLabel,
            });

            toast.success("Enrollment successful! Receipt downloaded.");
            onSuccess();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Verification failed");
          } finally {
            setLoading(false);
          }
        },
      });
      rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
        toast.error(response.error?.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
      return;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Enroll in {course.courseName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-2xl bg-muted/40 p-4 space-y-2">
            <p>
              <span className="text-muted-foreground">Teacher:</span> {course.teacherName}
            </p>
            <p>
              <span className="text-muted-foreground">Batch:</span> {course.batchName} ·{" "}
              {course.batchTiming}
            </p>
            <p>
              <span className="text-muted-foreground">Duration:</span> {course.durationMonths}{" "}
              months
            </p>
            <p>
              <span className="text-muted-foreground">Fees:</span> ₹
              {course.courseFees.toLocaleString("en-IN")}
            </p>
            <p>
              <span className="text-muted-foreground">Available slots:</span>{" "}
              {course.availableSeats}
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Installment options
            </Label>
            <RadioGroup
              value={installmentType}
              onValueChange={v => setInstallmentType(v as InstallmentType)}
              className="mt-2 space-y-2"
            >
              <div className="flex items-center space-x-2 rounded-xl border p-3">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  Full payment
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-xl border p-3">
                <RadioGroupItem value="two_installments" id="two" />
                <Label htmlFor="two" className="flex-1 cursor-pointer">
                  2 installments
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-xl border p-3">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                  Monthly installments
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-foreground">Payment summary</p>
            <p className="text-muted-foreground text-xs mt-1">
              Secure checkout powered by Razorpay
            </p>
          </div>

          <Button
            className="w-full rounded-xl gradient-primary text-white border-0 h-11"
            onClick={() => void handlePay()}
            disabled={loading || course.availableSeats <= 0}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Pay with Razorpay
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

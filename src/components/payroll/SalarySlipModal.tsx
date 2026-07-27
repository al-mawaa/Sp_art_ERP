"use client";

import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Mail, X, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface SalarySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any; // PayrollEntryDto
}

export function SalarySlipModal({ isOpen, onClose, entry }: SalarySlipModalProps) {
  const [emailSending, setEmailSending] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!entry) return null;

  // Formatting helpers
  const money = (value: number) => {
    return `₹${(value ?? 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Derived information
  const email = `${entry.staffName.toLowerCase().replace(/\s+/g, "")}@sparthub.com`;

  // Slip Number Generation
  const slipNumber = `SLIP-${entry.month.replace("-", "")}-${entry.employeeId}`;

  // Attendance summary calculations
  const totalDays = entry.presentCount + entry.absentCount + entry.halfDayCount + entry.leaveCount;
  const attendanceRate = totalDays > 0 ? ((entry.presentCount + entry.halfDayCount * 0.5) / totalDays * 100).toFixed(1) : "100.0";

  // Net Salary
  const netSalary = entry.netSalary;

  // QR Code Verification URL
  const verificationUrl = `https://erp.sparthub.com/verify-payslip/${entry.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
    `Slip No: ${slipNumber}\nEmployee ID: ${entry.employeeId}\nPayroll Month: ${entry.month}\nNet Salary: ${money(netSalary)}\nStatus: ${entry.payrollStatus}\nVerify at: ${verificationUrl}`
  )}`;

  // Print Payslip
  const handlePrint = () => {
    window.print();
  };

  // Simulate PDF Download
  const handleDownload = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Generating high-resolution Salary Slip PDF...",
        success: () => {
          window.print(); // Print layout is identical to A4 PDF, so standard browser save-as-pdf triggers beautifully
          return "Salary Slip PDF generated successfully!";
        },
        error: "Failed to generate PDF.",
      }
    );
  };

  // Send Email Slip
  const handleEmail = () => {
    setEmailSending(true);
    toast.promise(
      async () => {
        const res = await fetch("/api/payroll/email-slip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: entry.id }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to send email");
        }
        setEmailSending(false);
        return json.message || "Email sent successfully!";
      },
      {
        loading: `Sending Salary Slip to ${email}...`,
        success: (msg) => msg,
        error: (err) => {
          setEmailSending(false);
          return err.message || "Failed to send email.";
        },
      }
    );
  };

  return (
    <>
      {/* Dynamic print-only styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-payslip-area, #print-payslip-area * {
            visibility: visible !important;
          }
          #print-payslip-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 20mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-border bg-background shadow-2xl rounded-2xl no-print">
          {/* Top Header Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/30 sticky top-0 z-50">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Payroll Salary Slip
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Preview payroll slip details for {entry.staffName} ({entry.month})
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={handlePrint}>
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={handleDownload}>
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              <Button size="sm" variant="default" className="h-9 gap-1.5" onClick={handleEmail} disabled={emailSending}>
                <Mail className="w-4 h-4" /> Email Slip
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-lg ml-2" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Payslip Document (A4 Styled container) */}
          <div className="p-8 bg-muted/10 flex justify-center overflow-x-auto">
            <div
              id="print-payslip-area"
              ref={printRef}
              className="w-[210mm] min-h-[297mm] bg-white text-slate-800 p-8 shadow-md border border-slate-200/80 rounded-lg flex flex-col justify-between"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {/* HEADER SECTION */}
              <div>
                <div className="flex justify-between items-start border-b-2 border-primary/20 pb-6 mb-6">
                  {/* Left Side: Academy details */}
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logoMain.png" alt="Sp Arts Logo" className="w-14 h-14 object-contain shrink-0 rounded-lg" />
                    <div>
                      <h1 className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                        Sp Arts
                      </h1>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                        Plot 12, Art District, Sector 5, New Delhi - 110001
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Tel: +91 98765 43210 | Email: info@sparthub.com
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Website: www.sparthub.com
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Slip details */}
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2 uppercase tracking-wide">
                      Salary Slip
                    </span>
                    <h2 className="text-sm font-bold text-slate-800">{slipNumber}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Payroll Month: <strong className="text-slate-800">{entry.month}</strong>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Generated Date: {formatDate(entry.createdAt || new Date().toISOString())}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          entry.payrollStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : entry.payrollStatus === "Approved"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {entry.payrollStatus === "Paid" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : entry.payrollStatus === "Pending" ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {entry.payrollStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-5 mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Employee Information
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Employee Name</span>
                      <strong className="text-slate-800">{entry.staffName}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Employee ID</span>
                      <strong className="text-slate-800">{entry.employeeId}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Designation / Role</span>
                      <strong className="text-slate-800">
                        {entry.staffType === "teacher" ? "Teacher" : "Senior Teacher"}
                      </strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Payroll Month</span>
                      <strong className="text-slate-800">{entry.month}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Payment Status</span>
                      <strong className="text-slate-800">
                        {entry.payrollStatus === "Paid" ? "Completed" : "Pending"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ATTENDANCE & BATCH SUMMARY GRID */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Attendance Summary */}
                  <div className="border border-slate-200/80 rounded-xl p-4 bg-white">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                      Attendance Summary
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Working Days</span>
                        <span className="font-semibold text-slate-800">{totalDays || 30}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Days Present</span>
                        <span className="font-semibold text-emerald-600">{entry.presentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Days Absent</span>
                        <span className="font-semibold text-rose-500">{entry.absentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Half Days</span>
                        <span className="font-semibold text-amber-600">{entry.halfDayCount}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-dashed border-slate-100">
                        <span className="text-slate-500">Attendance Percentage</span>
                        <span className="font-bold text-slate-800">{attendanceRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Batch Summary */}
                  <div className="border border-slate-200/80 rounded-xl p-4 bg-white">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                      Batch Conduct Summary
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Weekday Batches</span>
                        <span className="font-semibold text-slate-800">{entry.weekdayBatches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Weekend Batches</span>
                        <span className="font-semibold text-slate-800">{entry.weekendBatches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Conducted</span>
                        <span className="font-bold text-slate-800">{entry.totalBatches}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-dashed border-slate-100">
                        <span className="text-slate-500">Rate Per Batch</span>
                        <span className="font-bold text-slate-800">{money(entry.salaryPerBatch)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EARNINGS & DEDUCTIONS TABLES */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Earnings Table */}
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Earnings</span>
                      <span className="text-[10px] font-semibold text-slate-400">Amount</span>
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-2 text-slate-500">Monthly Salary</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-800">{money(entry.monthlySalary)}</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="px-4 py-2.5 font-bold text-slate-700">Gross Salary</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-800">{money(entry.monthlySalary)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Deductions Table */}
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Deductions</span>
                      <span className="text-[10px] font-semibold text-slate-400">Amount</span>
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-2 text-slate-500">Leave Deductions (LWP)</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-800">{money(entry.deductionAmount)}</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="px-4 py-2.5 font-bold text-slate-700">Total Deductions</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-800">{money(entry.deductionAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NET SALARY HIGHLIGHT CARD */}
                <div className="bg-gradient-to-r from-primary/5 to-indigo-600/5 rounded-2xl border-2 border-primary/20 p-5 flex justify-between items-center mb-6 shadow-sm">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Take Home Pay
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Gross Salary: {money(entry.monthlySalary)} | Deductions: {money(entry.deductionAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Net Salary (INR)
                    </span>
                    <p className="text-2xl font-black text-primary leading-tight">
                      {money(entry.netSalary)}
                    </p>
                  </div>
                </div>

                {/* LEAVE SUMMARY & QR CODE GRID */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {/* Leaves Summary */}
                  <div className="border border-slate-200/80 rounded-xl p-4 bg-white space-y-2 text-xs">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                      Leave Summary
                    </h4>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Approved Leaves</span>
                      <span className="font-semibold text-emerald-600">{entry.leaveCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pending Leaves</span>
                      <span className="font-semibold text-amber-600">{entry.pendingLeaveCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rejected Leaves</span>
                      <span className="font-semibold text-rose-500">{entry.rejectedLeaveCount}</span>
                    </div>
                  </div>

                  {/* System Remarks */}
                  <div className="border border-slate-200/80 rounded-xl p-4 bg-white col-span-2 flex flex-col justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                        System Remarks
                      </h4>
                      <p className="text-slate-500 leading-relaxed mt-2 text-[11px] italic">
                        "This salary has been generated automatically based on attendance, approved leaves, payroll settings, assigned batches and salary configuration in SP Art Hub ERP."
                      </p>
                    </div>
                    {entry.remarks ? (
                      <p className="text-rose-500 font-medium text-[11px] mt-2">
                        Note: {entry.remarks}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* QR CODE VERIFICATION ROW */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-150">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    SP Arts ERP Payroll Verification Document
                  </div>
                  <div className="flex items-center gap-3 p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                    <img
                      src={qrCodeUrl}
                      alt="Verification QR Code"
                      className="w-14 h-14 shadow-sm border border-slate-100 bg-white"
                    />
                    <div className="text-left">
                      <span className="text-[8px] text-slate-400 block uppercase tracking-widest font-semibold leading-none">
                        Scan to Verify
                      </span>
                      <span className="text-[7px] text-slate-300 block max-w-[120px] truncate mt-1">
                        {slipNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SIGNATURE SECTION & FOOTER */}
              <div className="mt-8">
                {/* Signature Boxes */}
                <div className="grid grid-cols-3 gap-8 text-center text-xs mt-6 mb-8 pt-8">
                  <div>
                    <div className="border-t border-slate-300 w-44 mx-auto pt-1.5 text-slate-500 font-semibold">
                      HR Manager
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-300 w-44 mx-auto pt-1.5 text-slate-500 font-semibold">
                      Accounts Department
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-300 w-44 mx-auto pt-1.5 text-slate-500 font-semibold">
                      Authorized Signatory
                    </div>
                  </div>
                </div>

                {/* Footer disclaimer */}
                <div className="border-t border-slate-100 pt-4 text-center">
                  <p className="text-[9px] text-slate-400 tracking-wide">
                    Sp Arts • Plot 12, Art District, Sector 5, New Delhi - 110001 • Tel: +91 98765 43210 • info@sparthub.com
                  </p>
                  <p className="text-[8px] text-slate-300 italic mt-0.5 uppercase tracking-widest font-medium">
                    This is a computer-generated salary slip and does not require a physical signature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

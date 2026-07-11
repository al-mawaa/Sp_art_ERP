import React from "react";
import { FileText, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoiceSection({ data, me, history = [] }: { data: any, me: any, history?: any[] }) {
  if (!history || history.length === 0) return null;
  const latestPayment = history[0]; // Assuming sorted newest first
  
  const handleDownload = () => {
    if (data.enrollmentId) {
      window.open(`/api/student/enrollment-invoice?enrollmentId=${data.enrollmentId}`, "_blank");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
        <FileText className="text-slate-600" size={20} />
        Recent Invoice
      </h3>
      
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-slate-800">{latestPayment.invoiceId || 'N/A'}</h4>
            <p className="text-xs text-slate-500 mt-0.5">Issued: {new Date(latestPayment.paymentDate).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <h4 className="font-bold text-blue-600">₹{latestPayment.amount?.toLocaleString() || 0}</h4>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">Paid</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-100 p-3 text-sm space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-slate-500">Term</span>
            <span className="font-medium">Term {latestPayment.termNo} Payment</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Student</span>
            <span className="font-medium">{me?.name || 'Student Name'}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 h-9 text-xs"
            onClick={handleDownload}
          >
            <Printer size={14} className="mr-1.5" />
            Print
          </Button>
          <Button 
            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white h-9 text-xs"
            onClick={handleDownload}
          >
            <Download size={14} className="mr-1.5" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

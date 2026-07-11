import React, { useState } from "react";
import { History, Download, FileText, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";

export function PaymentHistoryTable({ payments, enrollmentId }: { payments: any[], enrollmentId?: string }) {
  const [search, setSearch] = useState("");

  const filtered = payments.filter((p: any) => {
    const searchLower = search.toLowerCase();
    const idToSearch = p.invoiceId || p.paymentId || p.orderId || "";
    const modeStr = "Online";
    return idToSearch.toLowerCase().includes(searchLower) || modeStr.toLowerCase().includes(searchLower);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <History className="text-blue-600" size={20} />
          Payment History
        </h3>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg shrink-0">
            <Filter size={16} className="text-slate-600" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">ID / Invoice</th>
              <th className="px-4 py-3 whitespace-nowrap">Date</th>
              <th className="px-4 py-3 whitespace-nowrap">Amount</th>
              <th className="px-4 py-3 whitespace-nowrap">Mode</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
                  No payment history found.
                </td>
              </tr>
            ) : (
              filtered.map((p: any, idx: number) => {
                const displayId = p.invoiceId || p.paymentId || p.orderId || `TXN-${idx}`;
                const dateStr = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "N/A";
                return (
                  <tr key={displayId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">#{displayId.substring(0, 12)}</td>
                    <td className="px-4 py-3 text-slate-600">{dateStr}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">₹{p.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                        Online
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.status || "completed"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-blue-600" 
                          title="View Receipt"
                          onClick={() => {
                            if (enrollmentId) window.open(`/api/student/enrollment-invoice?enrollmentId=${enrollmentId}`, "_blank");
                          }}
                        >
                          <FileText size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-blue-600" 
                          title="Download PDF"
                          onClick={() => {
                            if (enrollmentId) window.location.href = `/api/student/enrollment-invoice?enrollmentId=${enrollmentId}`;
                          }}
                        >
                          <Download size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filtered.length} entries</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled>Previous</Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled>Next</Button>
        </div>
      </div>
    </div>
  );
}

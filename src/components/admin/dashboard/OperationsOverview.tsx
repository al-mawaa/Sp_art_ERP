import React from "react";
import { Package, Briefcase, UserPlus, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OperationsProps {
  data: any;
}

export function OperationsOverview({ data }: OperationsProps) {
  // Mock data for Inventory & CRM as they lack dedicated DB models currently
  const inventoryItems = [
    { name: "A4 Sketchbooks", stock: 12, status: "Low Stock" },
    { name: "Acrylic Colors Set", stock: 4, status: "Critical" },
    { name: "Canvas Boards", stock: 45, status: "In Stock" },
  ];

  const crmLeads = [
    { name: "Rahul Sharma", source: "Website", status: "Follow Up" },
    { name: "Priya Singh", source: "Referral", status: "New" },
    { name: "Amit Kumar", source: "Instagram", status: "Contacted" },
  ];

  // HR & Payroll Data
  const payrollRuns = data.payrollRuns || [];
  const latestPayroll = payrollRuns.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      
      {/* INVENTORY WIDGET */}
      <div className="glass-card p-6 border-orange-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" /> Inventory (Mock)
          </h2>
          <Button variant="ghost" size="sm" className="h-8">View All</Button>
        </div>
        <div className="space-y-3">
          {inventoryItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
              <span className="font-medium">{item.name}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                item.status === 'Critical' ? 'bg-destructive/10 text-destructive' :
                item.status === 'Low Stock' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
              }`}>
                {item.stock} left
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CRM WIDGET */}
      <div className="glass-card p-6 border-pink-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-pink-500" /> CRM Leads (Mock)
          </h2>
          <Button variant="ghost" size="sm" className="h-8">Open CRM</Button>
        </div>
        <div className="space-y-3">
          {crmLeads.map((lead, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
              <div>
                <div className="font-medium">{lead.name}</div>
                <div className="text-xs text-muted-foreground">{lead.source}</div>
              </div>
              <span className="text-xs font-bold text-muted-foreground">{lead.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HR & PAYROLL WIDGET */}
      <div className="glass-card p-6 border-teal-500/20 md:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-teal-500" /> HR & Payroll
          </h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-teal-500/10 p-3 rounded-lg">
              <div className="text-xs text-teal-700 dark:text-teal-400 font-bold mb-1">Total Employees</div>
              <div className="text-xl font-extrabold">{data.teachers.length + data.seniorTeachers.length}</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-xs text-muted-foreground font-bold mb-1">Leaves Today</div>
              <div className="text-xl font-extrabold">
                {data.leaves.filter((l: any) => l.status === "Approved" && l.fromDate <= new Date().toISOString().split('T')[0] && l.toDate >= new Date().toISOString().split('T')[0]).length}
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">Latest Payroll Run</span>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            {latestPayroll ? (
              <>
                <div className="text-xs text-muted-foreground mb-1">Month: {latestPayroll.month} {latestPayroll.year}</div>
                <div className="font-bold">Total: ₹{latestPayroll.totalAmount?.toLocaleString()}</div>
                <div className="flex justify-between items-center mt-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${latestPayroll.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {latestPayroll.status}
                  </span>
                  <Button variant="link" size="sm" className="h-6 p-0 text-xs">View Run <ArrowRight className="w-3 h-3 ml-1"/></Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground py-2">No payroll records found.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

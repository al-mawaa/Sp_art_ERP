"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { salaries, INSTITUTE } from "@/data/mockData";
import { useStore, actions } from "@/store/dataStore";
import { Logo } from "@/components/shared/Logo";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Payroll() {
  const [slip, setSlip] = useState<typeof salaries[number] | null>(null);
  const leaves = useStore(s => s.leaves);

  function act(id: string, status: "Approved" | "Rejected") {
    actions.setLeaveStatus(id, status);
    toast.success(`Leave ${status.toLowerCase()}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="HR & Payroll" subtitle="Salaries, slips and leave requests" />

      <DataTable
        columns={[
          { key: "staff", header: "Staff" },
          { key: "role", header: "Role" },
          { key: "basic", header: "Basic", render: r => `₹${r.basic.toLocaleString()}` },
          { key: "gross", header: "Gross", render: r => `₹${r.gross.toLocaleString()}` },
          { key: "net", header: "Net", render: r => <span className="font-bold text-success">₹{r.net.toLocaleString()}</span> },
          { key: "x", header: "", render: r => <Button size="sm" className="rounded-lg gradient-primary text-white border-0" onClick={() => setSlip(r)}><FileText className="w-3.5 h-3.5 mr-1" />Slip</Button> },
        ]}
        rows={salaries}
        searchKeys={["staff", "role"]}
      />

      <div>
        <h2 className="font-display font-bold text-xl mb-3 mt-2">Leave requests</h2>
        <DataTable
          columns={[
            { key: "staff", header: "Staff" },
            { key: "type", header: "Type" },
            { key: "from", header: "From" },
            { key: "to",   header: "To" },
            { key: "reason", header: "Reason" },
            { key: "status", header: "Status", render: r => <StatusPill status={r.status} /> },
            { key: "x", header: "", render: r => r.status === "Pending" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => act(r.id, "Rejected")}>Cancel</Button>
                <Button size="sm" className="rounded-lg bg-success text-success-foreground hover:bg-success/90" onClick={() => act(r.id, "Approved")}>Approve</Button>
              </div>
            ) : <span className="text-xs text-muted-foreground">—</span> },
          ]}
          rows={leaves}
        />
      </div>

      <Dialog open={!!slip} onOpenChange={o => !o && setSlip(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          {slip && <SalarySlip s={slip} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SalarySlip({ s }: { s: typeof salaries[number] }) {
  return (
    <div className="bg-background">
      <div className="gradient-primary text-white p-5 flex items-center justify-between">
        <Logo />
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest opacity-90 font-bold">Salary slip</div>
          <div className="font-display font-bold">{format(new Date(), "MMMM yyyy")}</div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><div className="text-xs text-muted-foreground">Employee</div><div className="font-bold">{s.staff}</div></div>
          <div><div className="text-xs text-muted-foreground">Role</div><div className="font-bold">{s.role}</div></div>
          <div><div className="text-xs text-muted-foreground">Employee ID</div><div className="font-bold">{s.id}</div></div>
          <div><div className="text-xs text-muted-foreground">Institute</div><div className="font-bold">{INSTITUTE.name}</div></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="card-soft p-3">
            <div className="font-bold text-success text-sm mb-2">Earnings</div>
            <Row k="Basic" v={s.basic} />
            <Row k="HRA" v={s.hra} />
            <Row k="DA" v={s.da} />
            <Row k="Gross" v={s.gross} bold />
          </div>
          <div className="card-soft p-3">
            <div className="font-bold text-destructive text-sm mb-2">Deductions</div>
            <Row k="PF" v={s.pf} />
            <Row k="TDS" v={s.tds} />
            <Row k="Total" v={s.pf + s.tds} bold />
          </div>
        </div>
        <div className="rounded-xl gradient-primary text-white p-4 flex items-center justify-between">
          <div className="font-display font-bold">Net Pay</div>
          <div className="font-display text-2xl font-bold">₹{s.net.toLocaleString()}</div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>Print</Button>
          <Button className="rounded-xl gradient-primary text-white border-0">Download PDF</Button>
        </div>
      </div>
    </div>
  );
}
function Row({ k, v, bold }: { k: string; v: number; bold?: boolean }) {
  return <div className={`flex justify-between text-sm py-0.5 ${bold ? "font-bold border-t border-border/60 pt-1.5 mt-1" : ""}`}><span>{k}</span><span>₹{v.toLocaleString()}</span></div>;
}

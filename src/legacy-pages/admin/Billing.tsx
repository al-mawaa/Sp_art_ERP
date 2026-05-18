"use client";

import { useState } from "react";
import { CreditCard, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/shared/Logo";
import { feeStructure, INSTITUTE } from "@/data/mockData";
import { useStore, actions } from "@/store/dataStore";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Billing() {
  const students = useStore(s => s.students);
  const payments = useStore(s => s.payments);
  const [payOpen, setPayOpen] = useState<typeof students[number] | null>(null);
  const [receipt, setReceipt] = useState<{ s: typeof students[number]; amount: number; mode: string } | null>(null);

  const dues = students.filter(s => s.feeStatus !== "Paid");

  function pay(amount: number, mode: string) {
    if (!payOpen) return;
    actions.recordPayment({ studentName: payOpen.name, amount, mode: mode as "Online" | "Cash" });
    setReceipt({ s: payOpen, amount, mode });
    setPayOpen(null);
    toast.success("Payment successful! 🎉");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" subtitle="Fee structure, dues and day book" />

      <div className="card-soft p-5">
        <h3 className="font-display font-bold text-lg mb-3">Fee structure</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {feeStructure.map(f => (
            <div key={f.className} className="rounded-xl border border-border/60 p-3">
              <div className="text-xs text-muted-foreground font-semibold">{f.className}</div>
              <div className="font-display font-bold text-2xl mt-1">₹{f.monthly.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
              <div className="text-xs text-muted-foreground mt-1">Yearly ₹{f.yearly.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-bold text-lg mb-3">Pending dues</h3>
        <DataTable
          columns={[
            { key: "name", header: "Student" },
            { key: "class", header: "Class" },
            { key: "totalFee", header: "Total", render: r => `₹${r.totalFee.toLocaleString()}` },
            { key: "paidFee", header: "Paid", render: r => `₹${r.paidFee.toLocaleString()}` },
            { key: "balance", header: "Balance", render: r => <span className="font-bold text-destructive">₹{(r.totalFee - r.paidFee).toLocaleString()}</span> },
            { key: "status", header: "", render: r => <StatusPill status={r.feeStatus} /> },
            { key: "x", header: "", render: r => <Button size="sm" className="rounded-lg gradient-primary text-white border-0" onClick={() => setPayOpen(r)}><CreditCard className="w-3.5 h-3.5 mr-1" />Collect</Button> },
          ]}
          rows={dues}
          searchKeys={["name"]}
        />
      </div>

      <div>
        <h3 className="font-display font-bold text-lg mb-3">Day book</h3>
        <DataTable
          columns={[
            { key: "date", header: "Date" },
            { key: "student", header: "Student" },
            { key: "amount", header: "Amount", render: r => `₹${r.amount.toLocaleString()}` },
            { key: "mode", header: "Mode", render: r => <StatusPill status={r.mode} /> },
            { key: "status", header: "Status", render: r => <StatusPill status={r.status} /> },
          ]}
          rows={payments}
        />
      </div>

      {/* Payment modal */}
      <Dialog open={!!payOpen} onOpenChange={o => !o && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Collect fee — {payOpen?.name}</DialogTitle></DialogHeader>
          {payOpen && (
            <Tabs defaultValue="online">
              <TabsList className="grid grid-cols-2 rounded-xl">
                <TabsTrigger value="online">Online</TabsTrigger>
                <TabsTrigger value="cash">Cash</TabsTrigger>
              </TabsList>
              <TabsContent value="online" className="space-y-3 pt-3">
                <div className="rounded-xl bg-muted p-3 text-sm">Amount due: <span className="font-bold">₹{(payOpen.totalFee - payOpen.paidFee).toLocaleString()}</span></div>
                <button
                  onClick={() => pay(payOpen.totalFee - payOpen.paidFee, "Online")}
                  className="w-full rounded-xl text-white font-bold py-3.5 flex items-center justify-center gap-2"
                  style={{ background: "#072654" }}
                >
                  <RazorpayMark /> Pay with Razorpay
                </button>
                <Tabs defaultValue="upi">
                  <TabsList className="grid grid-cols-3 rounded-xl"><TabsTrigger value="upi">UPI</TabsTrigger><TabsTrigger value="card">Card</TabsTrigger><TabsTrigger value="nb">Netbanking</TabsTrigger></TabsList>
                  <TabsContent value="upi"  className="text-xs text-muted-foreground pt-2">Scan QR or enter VPA — instant settlement.</TabsContent>
                  <TabsContent value="card" className="text-xs text-muted-foreground pt-2">Visa / Master / Rupay accepted.</TabsContent>
                  <TabsContent value="nb"   className="text-xs text-muted-foreground pt-2">All major banks supported.</TabsContent>
                </Tabs>
              </TabsContent>
              <TabsContent value="cash" className="space-y-3 pt-3">
                <div className="rounded-xl bg-muted p-3 text-sm">Collect <span className="font-bold">₹{(payOpen.totalFee - payOpen.paidFee).toLocaleString()}</span> in cash and issue a receipt.</div>
                <Button className="w-full rounded-xl gradient-primary text-white border-0" onClick={() => pay(payOpen.totalFee - payOpen.paidFee, "Cash")}>Mark as collected</Button>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt */}
      <Dialog open={!!receipt} onOpenChange={o => !o && setReceipt(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {receipt && (
            <div>
              <div className="gradient-primary text-white p-5 flex justify-between">
                <Logo />
                <div className="text-right text-xs"><div className="opacity-90 font-bold uppercase tracking-widest">Receipt</div><div className="font-display font-bold text-lg">#{Math.floor(Math.random()*9000+1000)}</div></div>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><div className="text-xs text-muted-foreground">Date</div><div className="font-bold">{format(new Date(),"dd MMM yyyy")}</div></div>
                  <div><div className="text-xs text-muted-foreground">Mode</div><div className="font-bold">{receipt.mode}</div></div>
                  <div><div className="text-xs text-muted-foreground">Student</div><div className="font-bold">{receipt.s.name}</div></div>
                  <div><div className="text-xs text-muted-foreground">Class</div><div className="font-bold">{receipt.s.class}</div></div>
                </div>
                <div className="card-soft p-3 space-y-1">
                  <div className="flex justify-between"><span>Tuition fee</span><span>₹{Math.round(receipt.amount*0.9).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Materials</span><span>₹{Math.round(receipt.amount*0.1).toLocaleString()}</span></div>
                </div>
                <div className="rounded-xl gradient-primary text-white p-4 flex justify-between"><span className="font-display font-bold">Total Paid</span><span className="font-display text-2xl font-bold">₹{receipt.amount.toLocaleString()}</span></div>
                <div className="text-xs text-muted-foreground text-center pt-2">{INSTITUTE.address} • {INSTITUTE.phone}</div>
                <div className="flex gap-2"><Button variant="outline" className="rounded-xl flex-1" onClick={() => window.print()}><Download className="w-4 h-4 mr-1" />Print</Button><Button className="rounded-xl flex-1 gradient-primary text-white border-0" onClick={() => setReceipt(null)}>Done</Button></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RazorpayMark() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2L6 14h6l-2 8 8-12h-6l2-8z" fill="#3395FF"/></svg>;
}

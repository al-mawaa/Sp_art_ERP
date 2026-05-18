"use client";

import React, { useState } from "react";
import { Award, Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { certificateTypes, INSTITUTE } from "@/data/mockData";
import { useStore, actions } from "@/store/dataStore";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Certificates() {
  const students = useStore(s => s.students);
  const [preview, setPreview] = useState<{ student: string; type: string } | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader title="Certificates" subtitle="Generate beautiful certificates in seconds" />
      <Tabs defaultValue={certificateTypes[0]}>
        <TabsList className="rounded-xl flex-wrap h-auto">
          {certificateTypes.map(t => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
        </TabsList>
        {certificateTypes.map(t => (
          <TabsContent key={t} value={t} className="mt-4">
            <div className="card-soft divide-y divide-border/60">
              {students.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-3 sm:p-4">
                  <Avatar name={s.name} />
                  <div className="flex-1 min-w-0"><div className="font-bold truncate">{s.name}</div><div className="text-xs text-muted-foreground">{s.badgeId} • {s.class}</div></div>
                  <Button size="sm" className="rounded-lg gradient-primary text-white border-0" onClick={() => {
                    actions.issueCertificate({ studentId: s.id, student: s.name, type: t, course: t === "Bonafide" ? "General" : "Watercolor Basics" });
                    setPreview({ student: s.name, type: t });
                    toast.success("Certificate issued!");
                  }}>
                    <Award className="w-3.5 h-3.5 mr-1" />Generate
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!preview} onOpenChange={o => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {preview && <CertificatePreview student={preview.student} type={preview.type} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CertificatePreview({ student, type }: { student: string; type: string }) {
  return (
    <div className="bg-background">
      <div className="relative bg-[hsl(var(--background))] p-8 sm:p-12">
        <DecorBorder />
        <div className="relative text-center space-y-4">
          <div className="inline-grid place-items-center w-16 h-16 rounded-2xl gradient-primary text-white mx-auto shadow-pop">
            <Award className="w-8 h-8" />
          </div>
          <div className="text-xs uppercase tracking-[0.3em] font-bold text-muted-foreground">{INSTITUTE.name}</div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-secondary">Certificate of {type}</h2>
          <p className="text-muted-foreground">This certificate is proudly presented to</p>
          <div className="font-display text-3xl sm:text-5xl font-bold gradient-purple bg-clip-text text-transparent" style={{ WebkitBackgroundClip: "text" } as React.CSSProperties}>
            {student}
          </div>
          <p className="text-sm max-w-lg mx-auto text-muted-foreground">
            for outstanding {type.toLowerCase()} in our art programme. Your creativity, dedication and joyful spirit make our studio brighter every day.
          </p>
          <div className="grid grid-cols-2 gap-8 max-w-md mx-auto mt-8 pt-4">
            <div>
              <div className="border-t-2 border-foreground/40 pt-2 text-xs">
                <div className="font-bold">{INSTITUTE.principal}</div>
                <div className="text-muted-foreground">Principal</div>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-foreground/40 pt-2 text-xs">
                <div className="font-bold">{format(new Date(), "dd MMM yyyy")}</div>
                <div className="text-muted-foreground">Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-border/60 flex justify-end gap-2 bg-card">
        <Button variant="outline" className="rounded-xl" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Print</Button>
        <Button className="rounded-xl gradient-primary text-white border-0"><Download className="w-4 h-4 mr-1" />Download</Button>
      </div>
    </div>
  );
}

function DecorBorder() {
  return (
    <svg className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)]" viewBox="0 0 400 280" preserveAspectRatio="none" aria-hidden>
      <rect x="6" y="6" width="388" height="268" rx="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" />
      <rect x="14" y="14" width="372" height="252" rx="10" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1" strokeDasharray="4 4" />
      {[
        [10,10],[390,10],[10,270],[390,270],
      ].map(([x,y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill="hsl(var(--accent))" />
          <circle cx={x} cy={y} r="2" fill="hsl(var(--primary))" />
        </g>
      ))}
    </svg>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "sonner";

type Lead = {
  id: string;
  child: string;
  phone: string;
  source: string;
  howYouComeToKnow: string;
};

export default function CRM() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      const students = Array.isArray(data.students) ? data.students : [];
      const studentLeads: Lead[] = students.map((student: { id?: string; name?: string; phone?: string; howYouKnowUs?: string; howYouComeToKnow?: string }, index: number) => ({
        id: student.id || `STU-${index}`,
        child: student.name || 'Unknown Student',
        phone: student.phone || '—',
        source: student.howYouKnowUs || 'Unknown',
        howYouComeToKnow: student.howYouComeToKnow || '—',
      }));
      setLeads(studentLeads);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load CRM student data');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="CRM Leads" subtitle="Convert enquiries into enrolments" />

      <div className="card-soft overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No CRM leads yet.
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: 'child',
                header: 'Student Name',
                render: (row) => (
                  <div className="font-medium">{(row as Lead).child}</div>
                ),
              },
              {
                key: 'phone',
                header: 'Phone',
                render: (row) => (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {(row as Lead).phone}
                  </div>
                ),
              },
              {
                key: 'source',
                header: 'How You Know Us',
                render: (row) => (
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-muted text-slate-700">
                    {(row as Lead).source}
                  </span>
                ),
              },
              {
                key: 'howYouComeToKnow',
                header: 'How You Come To Know',
                render: (row) => (
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-muted text-slate-700">
                    {(row as Lead).howYouComeToKnow}
                  </span>
                ),
              },
            ]}
            rows={leads}
          />
        )}
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { Phone, User } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "sonner";

type Lead = {
  id: string;
  child: string;
  parent: string;
  phone: string;
  source: string;
  counselor: string;
};

export default function CRM() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      const students = Array.isArray(data.students) ? data.students : [];
      const studentLeads: Lead[] = students.map((student: { id?: string; name?: string; parentName?: string; fatherName?: string; motherName?: string; phone?: string; howYouKnowUs?: string }, index: number) => ({
        id: student.id || `STU-${index}`,
        child: student.name || 'Unknown Student',
        parent: student.parentName || student.fatherName || student.motherName || '—',
        phone: student.phone || '—',
        source: student.howYouKnowUs || 'Unknown',
        counselor: 'Admin',
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
                key: 'parent',
                header: 'Parent Name',
                render: (row) => (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {(row as Lead).parent}
                  </div>
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
                header: 'How They Know Us',
                render: (row) => (
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-muted text-slate-700">
                    {(row as Lead).source}
                  </span>
                ),
              },
              {
                key: 'counselor',
                header: 'Counselor',
                render: (row) => (
                  <div className="text-sm text-muted-foreground">{(row as Lead).counselor}</div>
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


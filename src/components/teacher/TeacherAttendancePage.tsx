"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface Student {
  _id: string;
  studentName: string;
  studentEmail: string;
  phone: string;
}

interface BatchData {
  _id: string;
  batchName: string;
  courseName: string;
  batchDay: string;
  batchTime: string;
  totalStudents: number;
  students: Student[];
}

export function TeacherAttendancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/teacher/attendance/batches", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch batches");
        }

        const data = await response.json();
        setBatches(data.batches || []);
      } catch (error) {
        console.error("Error fetching batches:", error);
        toast({
          title: "Error",
          description: "Unable to load your assigned batches.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading assigned batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Teacher Attendance</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          View your assigned batches and open the new attendance page for each batch. The attendance form now opens in a dedicated page instead of a popup.
        </p>
      </div>

      {batches.length === 0 ? (
        <Card className="rounded-[28px] border border-border bg-white shadow-sm">
          <CardContent className="py-10 text-center">
            <p className="text-base font-medium">No batches assigned yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Once your batches are assigned, you’ll be able to take attendance from this page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch._id} className="rounded-[28px] border border-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="space-y-4 p-6">
                <div>
                  <h2 className="text-xl font-semibold">{batch.batchName}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{batch.courseName}</p>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>{batch.batchDay}</div>
                  <div>{batch.batchTime}</div>
                  <div>{batch.totalStudents} {batch.totalStudents === 1 ? "Student" : "Students"}</div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <Button
                    onClick={() => router.push(`/teacher/attendance/${batch._id}`)}
                    className="rounded-full bg-gradient-to-r from-primary to-secondary text-white px-5 py-2 shadow-md hover:scale-[1.01] transition-transform"
                  >
                    Take Attendance
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/teacher/attendance-report/${batch._id}`)}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Attendance Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

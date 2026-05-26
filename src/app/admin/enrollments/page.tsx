"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { toast } from "sonner";

type Row = {
  id: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  batchName: string;
  paymentStatus: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentType: string;
  nextDueDate?: string;
  seatsUsed: number;
  seatsTotal: number;
};

export default function AdminEnrollmentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/enrollments", { credentials: "include" });
      const json = await parseJsonResponse<{ error?: string; data?: { enrollments: Row[] } }>(res);
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setRows(json.data?.enrollments ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await parseJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(json.error || "Approve failed");
      toast.success("Enrollment approved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approve failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course enrollments"
        subtitle="Track student enrollments, payments, and batch seats"
      />
      <div className="card-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course / Batch</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Paid / Total</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No enrollments yet
                </TableCell>
              </TableRow>
            ) : (
              rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground">{r.studentEmail}</p>
                  </TableCell>
                  <TableCell>
                    <p>{r.courseName}</p>
                    <p className="text-xs text-muted-foreground">{r.batchName}</p>
                  </TableCell>
                  <TableCell className="capitalize">{r.paymentStatus}</TableCell>
                  <TableCell>
                    ₹{r.paidAmount.toLocaleString("en-IN")} / ₹
                    {r.totalAmount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    {r.seatsUsed}/{r.seatsTotal}
                  </TableCell>
                  <TableCell>{r.nextDueDate || "—"}</TableCell>
                  <TableCell className="text-right">
                    {r.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() => void approve(r.id)}
                      >
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

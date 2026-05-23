"use client";

import Link from "next/link";
import { ClipboardCheck, GraduationCap, UserCheck, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminAttendanceHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        subtitle="Staff self-attendance reports and student attendance analytics"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Teacher Attendance
            </CardTitle>
            <CardDescription>View teachers marking their own attendance by batch and date.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="rounded-full w-full sm:w-auto" asChild>
              <Link href="/admin/attendance/teacher">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Teacher Attendance
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Senior Teacher Attendance
            </CardTitle>
            <CardDescription>View senior teachers marking their own attendance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="rounded-full w-full sm:w-auto" asChild>
              <Link href="/admin/attendance/senior-teacher">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Senior Teacher Attendance
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-dashed border-muted-foreground/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            Student attendance analytics
          </CardTitle>
          <CardDescription>Batch and student attendance marked in class sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/attendance/analytics">Open analytics</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

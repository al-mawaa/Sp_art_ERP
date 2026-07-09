"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

function getPriorityColor(priority: string) {
  switch (priority) {
    case "Urgent": return "bg-red-500 text-white";
    case "High": return "bg-orange-500 text-white";
    case "Medium": return "bg-blue-500 text-white";
    case "Low": return "bg-gray-500 text-white";
    default: return "bg-gray-200 text-gray-800";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Sent": return "bg-green-100 text-green-800";
    case "Draft": return "bg-gray-100 text-gray-800";
    case "Scheduled": return "bg-blue-100 text-blue-800";
    case "Sending": return "bg-yellow-100 text-yellow-800";
    case "Failed": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export default function NotificationListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications-list"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notifications?limit=1000"); // Fetching a larger batch for client-side datatable
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const json = await res.json();
      return json.notifications || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/notifications"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <PageHeader title="Notification History" subtitle="View all past announcements and alerts" />
      </div>

      <div className="flex justify-end gap-2 mb-4">
        <Button asChild className="rounded-xl gradient-primary border-0 text-white">
          <Link href="/admin/notifications/create">
            <Plus className="w-4 h-4 mr-2" />
            New Notification
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable
          searchKeys={["title", "type", "status"]}
          columns={[
            { key: "title", header: "Title", /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              render: (row: any) => <div className="font-medium max-w-[250px] truncate">{row.title}</div> },
            { key: "type", header: "Type" },
            { 
              key: "priority", 
              header: "Priority", 
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              render: (row: any) => (
                <Badge className={getPriorityColor(row.priority)} variant="outline">{row.priority}</Badge>
              ) 
            },
            { 
              key: "status", 
              header: "Status", 
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              render: (row: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(row.status)}`}>
                  {row.status}
                </span>
              ) 
            },
            { 
              key: "createdAt", 
              header: "Date", 
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              render: (row: any) => new Date(row.createdAt).toLocaleDateString() 
            },
            {
              key: "actions",
              header: "Actions",
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              render: (row: any) => (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/notifications/${row._id}`}><Eye className="w-4 h-4" /></Link>
                </Button>
              )
            }
          ]}
          rows={data || []}
        />
      )}
    </div>
  );
}

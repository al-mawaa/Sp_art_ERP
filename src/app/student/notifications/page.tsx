"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  redirectUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export default function StudentNotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        filter,
        role: "student",
      });
      if (user?.id) {
        params.append("userId", user.id);
      }
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      const response = await fetch(`/api/notifications?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, redirectUrl?: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );

      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const params = new URLSearchParams({ role: "student" });
      if (user?.id) {
        params.append("userId", user.id);
      }

      await fetch(`/api/notifications/read-all?${params}`, {
        method: "PATCH",
        credentials: "include",
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter, typeFilter, page]);

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Just now";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="batch_assigned">Batch Assigned</SelectItem>
              <SelectItem value="batch_changed">Batch Changed</SelectItem>
              <SelectItem value="class_schedule_updated">Class Schedule Updated</SelectItem>
              <SelectItem value="new_class_added">New Class Added</SelectItem>
              <SelectItem value="class_cancelled">Class Cancelled</SelectItem>
              <SelectItem value="teacher_changed">Teacher Changed</SelectItem>
              <SelectItem value="study_material_uploaded">Study Material Uploaded</SelectItem>
              <SelectItem value="query_approved">Query Approved</SelectItem>
              <SelectItem value="query_rejected">Query Rejected</SelectItem>
              <SelectItem value="query_replied">Query Replied</SelectItem>
              <SelectItem value="new_course_launched">New Course Launched</SelectItem>
              <SelectItem value="enrollment_approved">Enrollment Approved</SelectItem>
              <SelectItem value="enrollment_rejected">Enrollment Rejected</SelectItem>
              <SelectItem value="course_updated">Course Updated</SelectItem>
              <SelectItem value="fee_due_reminder">Fee Due Reminder</SelectItem>
              <SelectItem value="fee_overdue">Fee Overdue</SelectItem>
              <SelectItem value="payment_received">Payment Received</SelectItem>
              <SelectItem value="payment_rejected">Payment Rejected</SelectItem>
              <SelectItem value="invoice_generated">Invoice Generated</SelectItem>
              <SelectItem value="certificate_issued">Certificate Issued</SelectItem>
              <SelectItem value="certificate_ready">Certificate Ready</SelectItem>
              <SelectItem value="attendance_marked">Attendance Marked</SelectItem>
              <SelectItem value="low_attendance_warning">Low Attendance Warning</SelectItem>
              <SelectItem value="exam_scheduled">Exam Scheduled</SelectItem>
              <SelectItem value="marks_published">Marks Published</SelectItem>
              <SelectItem value="result_released">Result Released</SelectItem>
              <SelectItem value="profile_approved">Profile Approved</SelectItem>
              <SelectItem value="referral_reward_credited">Referral Reward Credited</SelectItem>
              <SelectItem value="gift_reward_earned">Gift Reward Earned</SelectItem>
              <SelectItem value="academy_announcement">Academy Announcement</SelectItem>
              <SelectItem value="holiday_notice">Holiday Notice</SelectItem>
              <SelectItem value="event_registration_confirmed">Event Registration Confirmed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading notifications...</div>
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            {filter === "unread" ? "You're all caught up!" : "No notifications found."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`p-4 transition-colors ${
                !notification.isRead ? "bg-muted/50 border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`h-2 w-2 rounded-full ${getPriorityColor(notification.priority)}`}
                    />
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    {!notification.isRead && (
                      <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatTime(notification.createdAt)}</span>
                    <span className="capitalize">{notification.type.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {notification.redirectUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification._id, notification.redirectUrl)}
                    >
                      View
                    </Button>
                  )}
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification._id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

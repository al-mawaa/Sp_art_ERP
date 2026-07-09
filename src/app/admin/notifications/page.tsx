import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Send, Clock, FileText, CheckCircle, Eye, AlertCircle } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import NotificationModel from "@/lib/models/Notification";
import NotificationRecipientModel from "@/lib/models/NotificationRecipient";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsDashboard() {
  await dbConnect();

  const totalNotifications = await NotificationModel.countDocuments();
  const sentNotifications = await NotificationModel.countDocuments({ status: "Sent" });
  const scheduledNotifications = await NotificationModel.countDocuments({ status: "Scheduled" });
  const draftNotifications = await NotificationModel.countDocuments({ status: "Draft" });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sentToday = await NotificationModel.countDocuments({ status: "Sent", createdAt: { $gte: today } });

  const totalRecipients = await NotificationRecipientModel.countDocuments();
  const readRecipients = await NotificationRecipientModel.countDocuments({ read: true });
  const readPercentage = totalRecipients > 0 ? Math.round((readRecipients / totalRecipients) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Notifications Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage and track your enterprise communications.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/notifications/list">View History</Link>
          </Button>
          <Button asChild className="rounded-xl gradient-primary text-white border-0">
            <Link href="/admin/notifications/create">Create Notification</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotifications}</div>
            <p className="text-xs text-muted-foreground">All time created</p>
          </CardContent>
        </Card>
        
        <Card className="card-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
            <Send className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentToday}</div>
            <p className="text-xs text-muted-foreground">Notifications blasted today</p>
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledNotifications}</div>
            <p className="text-xs text-muted-foreground">Waiting to be sent</p>
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftNotifications}</div>
            <p className="text-xs text-muted-foreground">Saved for later</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Read Rate</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readPercentage}%</div>
            <p className="text-xs text-muted-foreground mb-4">Of {totalRecipients} total deliveries read</p>
            {/* Simple progress bar representation */}
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${readPercentage}%` }}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 card-soft">
          <CardHeader>
            <CardTitle className="font-display font-bold">Quick Actions & Help</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">Use the notification module to send targeted emails and in-app alerts to students, teachers, and staff. You can schedule announcements, track delivery rates, and pin important alerts.</p>
             <div className="flex gap-4">
                <Button variant="outline" size="sm" className="rounded-xl">Manage Templates</Button>
                <Button variant="outline" size="sm" className="rounded-xl">Delivery Reports</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

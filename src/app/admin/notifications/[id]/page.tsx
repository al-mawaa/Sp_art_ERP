import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Users, Eye, Mail, Bell as BellIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import dbConnect from "@/lib/mongodb";
import NotificationModel from "@/lib/models/Notification";
import NotificationRecipientModel from "@/lib/models/NotificationRecipient";

export const dynamic = "force-dynamic";

export default async function NotificationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const notification = await NotificationModel.findById(id).lean();
  
  if (!notification) {
    return <div className="p-10 text-center">Notification not found</div>;
  }

  const totalRecipients = await NotificationRecipientModel.countDocuments({ notificationId: id });
  const readRecipients = await NotificationRecipientModel.countDocuments({ notificationId: id, read: true });
  const readPercentage = totalRecipients > 0 ? Math.round((readRecipients / totalRecipients) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/notifications/list"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <PageHeader title="Notification Details" subtitle="View delivery status and message content" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Details & Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2">{notification.type}</Badge>
                  <CardTitle className="text-2xl">{notification.title}</CardTitle>
                  {notification.subject && <p className="text-sm text-muted-foreground mt-1">Subject: {notification.subject}</p>}
                </div>
                <Badge className={
                  notification.status === "Sent" ? "bg-green-100 text-green-800" :
                  notification.status === "Scheduled" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"
                }>{notification.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-6 rounded-xl border border-border/50 min-h-[200px] whitespace-pre-wrap">
                {notification.message}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Analytics & Meta */}
        <div className="space-y-6">
           <Card className="card-soft">
             <CardHeader>
               <CardTitle className="text-lg">Delivery Stats</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-muted-foreground">Global Read Rate</span>
                    <span className="font-bold text-lg">{readPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${readPercentage}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/20 p-4 rounded-xl text-center border">
                    <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-2xl font-bold">{totalRecipients}</div>
                    <div className="text-xs text-muted-foreground">Recipients</div>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-xl text-center border">
                    <Eye className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <div className="text-2xl font-bold">{readRecipients}</div>
                    <div className="text-xs text-muted-foreground">Opened</div>
                  </div>
                </div>
             </CardContent>
           </Card>

           <Card className="card-soft">
             <CardHeader>
               <CardTitle className="text-lg">Settings</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created At</span>
                  <span className="font-medium">{new Date(notification.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Priority</span>
                  <span className="font-medium">{notification.priority}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Channels</span>
                  <div className="flex gap-1">
                    {notification.deliveryChannels?.map((ch: string) => (
                       <Badge key={ch} variant="outline" className="text-xs flex gap-1 items-center">
                         {ch === "Email" ? <Mail className="w-3 h-3"/> : <BellIcon className="w-3 h-3"/>}
                         {ch}
                       </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target Roles</span>
                  <span className="font-medium text-right break-words max-w-[150px]">
                    {notification.targetRoles?.join(", ") || "Specific Users"}
                  </span>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

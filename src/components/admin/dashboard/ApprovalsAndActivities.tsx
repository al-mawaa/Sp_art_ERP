import React from "react";
import { CheckCircle, XCircle, FileText, Bell, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/shared/Avatar";
import { formatDistanceToNow } from "date-fns";

interface Props {
  data: any;
  kpiData: any;
}

export function ApprovalsAndActivities({ data, kpiData }: Props) {
  const pendingCertificates = data.certificates.filter((c: any) => c.status === "Pending").slice(0, 3);
  const pendingQueries = data.queries.filter((q: any) => q.status === "pending").slice(0, 3);
  const recentNotifications = [...data.notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 lg:space-y-8">
      
      {/* QUICK APPROVAL CENTER */}
      <div className="glass-card p-6 border-yellow-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" /> Approval Center
          </h2>
          <span className="bg-yellow-500/10 text-yellow-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {kpiData.pendingApprovals}
          </span>
        </div>
        
        <div className="space-y-4">
          {pendingCertificates.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Certificates</h3>
              {pendingCertificates.map((cert: any) => (
                <div key={cert._id} className="flex items-center justify-between p-2 rounded bg-muted/30 mb-1">
                  <div className="text-sm">{cert.studentName}</div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-success hover:bg-success/20"><CheckCircle className="w-4 h-4"/></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/20"><XCircle className="w-4 h-4"/></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingQueries.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Queries</h3>
              {pendingQueries.map((q: any) => (
                <div key={q._id} className="flex items-center justify-between p-2 rounded bg-muted/30 mb-1">
                  <div>
                    <div className="text-sm font-medium">{q.personName}</div>
                    <div className="text-[10px] text-muted-foreground">{q.category.replace('_', ' ')}</div>
                  </div>
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2">Review</Button>
                </div>
              ))}
            </div>
          )}

          {kpiData.pendingApprovals === 0 && (
            <div className="text-sm text-center py-4 text-muted-foreground">All caught up!</div>
          )}
        </div>
      </div>

      {/* RECENT NOTIFICATIONS / ACTIVITIES */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" /> Recent Activities
          </h2>
        </div>
        <div className="relative border-l border-border/50 ml-3 space-y-4">
          {recentNotifications.map((notif: any) => (
            <div key={notif._id} className="relative pl-5">
              <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-background ${
                notif.type === 'alert' ? 'bg-destructive' :
                notif.type === 'success' ? 'bg-success' : 'bg-primary'
              }`} />
              <div className="text-sm font-medium">{notif.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{notif.message}</div>
              <div className="text-[10px] text-muted-foreground font-medium mt-1">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
              </div>
            </div>
          ))}
          {recentNotifications.length === 0 && (
             <div className="text-sm py-4 text-muted-foreground pl-4">No recent activities.</div>
          )}
        </div>
      </div>

    </div>
  );
}

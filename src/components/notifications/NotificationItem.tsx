"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Bell, Info, Calendar, FileText, CheckCircle2, AlertCircle, CreditCard, Users, Briefcase } from "lucide-react";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export default function NotificationItem({ recipientData, onClose }: { recipientData: any, onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notification = recipientData.notificationId;

  const markReadMutation = useMutation({
    mutationFn: async () => {
      if (recipientData.read) return;
      await fetch(`/api/notifications/${notification._id}/read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "Holiday Notice": return <Calendar className="w-5 h-5 text-green-500" />;
      case "Meeting": return <Users className="w-5 h-5 text-blue-500" />;
      case "Exam": return <FileText className="w-5 h-5 text-purple-500" />;
      case "Fee Reminder": return <CreditCard className="w-5 h-5 text-red-500" />;
      case "System Alert": return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "bg-red-500 text-white";
      case "High": return "bg-orange-500 text-white";
      case "Medium": return "bg-blue-500 text-white";
      case "Low": return "bg-gray-500 text-white";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const handleAction = () => {
    markReadMutation.mutate();
    onClose();

    // Smart Actions Routing based on Notification Type
    const type = notification.type;
    if (type === "Fee Reminder") {
      router.push("/student/fees");
    } else if (type === "Exam") {
      router.push("/student/exams");
    } else if (type === "Leave Approved" || type === "Leave Rejection") {
      router.push("/teacher/leave");
    } else if (type === "Meeting") {
      router.push("/shared/meetings");
    } else if (type === "System Alert") {
      // Just view details, or could link somewhere else
    } else {
      // Default fallback
    }
  };

  return (
    <div 
      onClick={handleAction}
      className={`relative p-4 rounded-xl border transition-colors cursor-pointer group 
        ${recipientData.read ? 'bg-background border-border/40 hover:bg-muted/50' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'}`}
    >
      {!recipientData.read && (
        <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
      )}
      
      <div className="flex gap-4">
        <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${recipientData.read ? 'bg-muted' : 'bg-background shadow-sm'}`}>
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
            <h4 className={`font-semibold text-sm truncate ${recipientData.read ? 'text-muted-foreground' : 'text-foreground'}`}>
              {notification.title}
            </h4>
            <Badge variant="outline" className={`text-[10px] h-4 px-1 py-0 ${getPriorityColor(notification.priority)}`}>
              {notification.priority}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
             <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
             <span>•</span>
             <span>{notification.type}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

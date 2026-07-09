"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminFeedbackList } from "@/components/admin/feedback/AdminFeedbackList";
import { TeacherAnalytics } from "@/components/admin/feedback/TeacherAnalytics";
import { StatCard } from "@/components/shared/StatCard";
import { MessageSquareHeart, Star, ThumbsUp, ThumbsDown, Clock, CheckCircle } from "lucide-react";

export default function AdminFeedbackPage() {
  const [activeTab, setActiveTab] = useState("list");
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    pendingReview: 0,
    closedFeedback: 0,
  });

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/feedback");
      const json = await res.json();
      if (json.success && json.stats) {
        setStats(json.stats);
      }
    } catch (error) {
      console.error("Failed to load feedback stats", error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback Management"
        subtitle="Review student feedback and analyze teacher performance"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Feedback"
          value={stats.totalFeedback}
          icon={MessageSquareHeart}
          tone="primary"
        />
        <StatCard
          label="Average Rating"
          value={stats.averageRating.toString()}
          icon={Star}
          tone="warning"
        />
        <StatCard
          label="Positive"
          value={stats.positiveFeedback}
          icon={ThumbsUp}
          tone="success"
        />
        <StatCard
          label="Negative"
          value={stats.negativeFeedback}
          icon={ThumbsDown}
          tone="destructive"
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Closed"
          value={stats.closedFeedback}
          icon={CheckCircle}
          tone="secondary"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">Feedback List</TabsTrigger>
          <TabsTrigger value="analytics">Teacher Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="focus-visible:outline-none">
          <div className="card-soft p-6">
            <AdminFeedbackList onStatusChange={loadStats} />
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="focus-visible:outline-none">
          <div className="card-soft p-6">
            <TeacherAnalytics />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

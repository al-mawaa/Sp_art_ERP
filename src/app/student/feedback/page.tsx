"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentFeedbackForm } from "@/components/student/feedback/StudentFeedbackForm";
import { StudentFeedbackHistory } from "@/components/student/feedback/StudentFeedbackHistory";

export default function StudentFeedbackPage() {
  const [activeTab, setActiveTab] = useState("submit");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Feedback"
        subtitle="Share your thoughts to help us improve your learning experience."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
          <TabsTrigger value="history">My Feedback History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="submit" className="focus-visible:outline-none">
          <div className="card-soft p-6">
            <StudentFeedbackForm onSuccess={() => setActiveTab("history")} />
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="focus-visible:outline-none">
          <div className="card-soft p-6">
            <StudentFeedbackHistory />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

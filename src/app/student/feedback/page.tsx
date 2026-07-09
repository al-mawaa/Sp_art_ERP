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
        <TabsList className="mb-4 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <TabsTrigger 
            value="submit"
            className="rounded-lg font-medium px-6 py-2.5 transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-slate-200/50 data-[state=inactive]:text-slate-600"
          >
            Submit Feedback
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="rounded-lg font-medium px-6 py-2.5 transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-slate-200/50 data-[state=inactive]:text-slate-600"
          >
            My Feedback History
          </TabsTrigger>
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

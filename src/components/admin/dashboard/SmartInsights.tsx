import React from "react";
import { Lightbulb } from "lucide-react";

interface Props {
  data: any;
  kpiData: any;
  todaysClasses: any[];
}

export function SmartInsights({ data, kpiData, todaysClasses }: Props) {
  const insights = [];

  // Insight: Revenue trend (mocked for now, just static positive text or calculation)
  if (kpiData.todayCollection > 0) {
    insights.push(`Today's collection is ₹${kpiData.todayCollection.toLocaleString()}, keep up the good work!`);
  }

  // Insight: Pending fees
  const pendingStudentsCount = data.students.filter((s: any) => s.feeStatus !== "Paid").length;
  if (pendingStudentsCount > 0) {
    insights.push(`${pendingStudentsCount} students have pending fees totaling ₹${kpiData.pendingFees.toLocaleString()}.`);
  }

  // Insight: Pending Approvals
  if (kpiData.pendingApprovals > 0) {
    insights.push(`You have ${kpiData.pendingApprovals} pending approvals requiring your attention.`);
  }

  // Insight: Classes today
  if (todaysClasses.length > 0) {
    insights.push(`There are ${todaysClasses.length} active classes scheduled for today.`);
  }

  // Insight: CRM (mock)
  if (kpiData.openLeads > 0) {
    insights.push(`${kpiData.openLeads} CRM leads require follow-up calls.`);
  }

  // Insight: Inventory (mock)
  if (kpiData.lowStockItems > 0) {
    insights.push(`Inventory has ${kpiData.lowStockItems} low stock products.`);
  }

  if (insights.length === 0) {
    insights.push("All systems are operating nominally. No urgent insights to display.");
  }

  return (
    <div className="glass-card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/50">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
        <Lightbulb className="w-5 h-5" /> Smart Insights
      </h2>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex gap-3 text-sm text-indigo-900/80 dark:text-indigo-200/80 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <p className="font-medium leading-tight">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { BarChart as BarChartIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/inventory/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json);
      })
      .catch(() => toast.error("Failed to load report data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  const categoryData = data.items.reduce((acc: any, item: any) => {
    const cat = item.categoryId?.name || "Uncategorized";
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += item.currentStock || 0;
    return acc;
  }, {});

  const pieData = Object.keys(categoryData).map(k => ({ name: k, value: categoryData[k] }));
  const topIssues = [...data.items].sort((a, b) => (b.issuedStock || 0) - (a.issuedStock || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-primary" /> Inventory Reports
        </h2>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold mb-4">Stock by Category</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold mb-4">Most Issued Items</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={topIssues.map(i => ({ name: i.itemName, issues: i.issuedStock }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="issues" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

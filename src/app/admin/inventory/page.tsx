"use client";

import { useState, useEffect } from "react";
import { Package, AlertTriangle, ListOrdered, ArrowDownToLine, ArrowUpFromLine, Layers } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function InventoryDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/inventory/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center">Loading dashboard...</div>;
  if (!data) return <div className="text-destructive">Failed to load data</div>;

  const { metrics, items } = data;

  const topItems = [...items].sort((a, b) => (b.issuedStock || 0) - (a.issuedStock || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Stock Items" value={metrics.totalItems} icon={Package} tone="primary" />
        <StatCard label="Categories" value={metrics.categoriesCount} icon={Layers} tone="info" />
        <StatCard label="Low Stock Alerts" value={metrics.lowStockItems} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of Stock" value={metrics.outOfStockItems} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Today's Issued" value={metrics.todayIssuedCount} icon={ArrowUpFromLine} tone="success" />
        <StatCard label="Today's Returned" value={metrics.todayReturnedCount} icon={ArrowDownToLine} tone="secondary" />
        <StatCard label="Pending POs" value={metrics.pendingPOs} icon={ListOrdered} tone="primary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-4">Stock Value & Quantities</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={items.slice(0, 10).map((i: any) => ({ name: i.itemName, stock: i.currentStock }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="stock" fill="hsl(var(--primary))" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-4">Most Issued Items (All Time)</h3>
          <div className="space-y-4">
            {topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.itemName}</div>
                    <div className="text-xs text-muted-foreground">{item.itemCode}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{item.issuedStock} Issued</div>
                  <div className="text-xs text-success">{item.currentStock} in stock</div>
                </div>
              </div>
            ))}
            {topItems.length === 0 && <div className="text-sm text-muted-foreground">No data available</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

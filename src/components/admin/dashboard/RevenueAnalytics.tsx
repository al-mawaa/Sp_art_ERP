import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { TrendingUp, CreditCard, Banknote, IndianRupee } from "lucide-react";

interface RevenueAnalyticsProps {
  data: any;
  todayStr: string;
}

export function RevenueAnalytics({ data, todayStr }: RevenueAnalyticsProps) {
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    
    const monthlyMap: Record<number, { revenue: number, offline: number }> = {};
    for (let i = 0; i <= currentMonth; i++) {
      monthlyMap[i] = { revenue: 0, offline: 0 };
    }

    if (Array.isArray(data.onlinePayments)) {
      data.onlinePayments.forEach((p: any) => {
        const status = p.paymentStatus?.toLowerCase() || "";
        if (status === "paid" || status === "completed" || status === "captured") {
          const d = p.paidAt || p.createdAt;
          if (d) {
            const date = new Date(d);
            if (date.getFullYear() === currentYear && date.getMonth() <= currentMonth) {
              monthlyMap[date.getMonth()].revenue += (p.amount || 0);
            }
          }
        }
      });
    }

    if (Array.isArray(data.offlinePayments)) {
      data.offlinePayments.forEach((p: any) => {
        const status = p.paymentStatus?.toLowerCase() || "";
        if (status === "completed" || status === "paid" || status === "verified") {
          const d = p.completedAt || p.offlinePaymentDate || p.createdAt;
          if (d) {
            const date = new Date(d);
            if (date.getFullYear() === currentYear && date.getMonth() <= currentMonth) {
              monthlyMap[date.getMonth()].offline += (p.amount || 0);
            }
          }
        }
      });
    }

    return Array.from({ length: currentMonth + 1 }).map((_, i) => ({
      name: monthNames[i],
      revenue: monthlyMap[i].revenue,
      offline: monthlyMap[i].offline
    }));
  }, [data.onlinePayments, data.offlinePayments]);

  const onlineTotal = data.onlinePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const offlineTotal = data.offlinePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const pendingDues = data.students.reduce((sum: number, s: any) => sum + ((s.totalFee || 0) - (s.paidFee || 0)), 0);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Revenue Analytics
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">Online Payments</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">₹{onlineTotal.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">Offline Payments</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">₹{offlineTotal.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-destructive/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">Pending Dues</span>
            <IndianRupee className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold">₹{pendingDues.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-4">Revenue Trend (YTD)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-4">Online vs Offline</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="revenue" name="Online" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="offline" name="Offline" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

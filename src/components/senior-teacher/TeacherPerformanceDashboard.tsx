"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Users, Zap } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PerformanceRecord = {
  date: string;
  performancePercentage: number;
};

type PerformanceMetrics = {
  totalStudentsEvaluated: number;
  averagePerformance: number;
  incentiveEligible: boolean;
  incentivePercentage: number;
  lastEvaluatedAt?: string | null;
};

export function TeacherPerformanceDashboard() {
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [history, setHistory] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/senior-teacher/performance", { credentials: "include" });
        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.success) {
          setError(json?.error ?? "Unable to load performance data");
          return;
        }

        setPerformance(json.data.performance);
        setHistory(json.data.history || []);
      } catch (err) {
        console.error("Failed to load performance data", err);
        setError("Unable to load performance data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const chartData = useMemo(
    () =>
      history.map(point => ({
        label: new Date(point.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        performance: Math.round(point.performancePercentage * 100) / 100,
      })),
    [history],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Analytics"
        subtitle="Teacher incentive and evaluation trends from drawing assessments."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Evaluations Reviewed"
          value={loading ? "…" : performance?.totalStudentsEvaluated ?? 0}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Average Performance"
          value={loading ? "…" : `${Math.round(performance?.averagePerformance ?? 0)}%`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Incentive Status"
          value={loading ? "…" : performance?.incentiveEligible ? "Yes" : "No"}
          icon={Zap}
          tone={performance?.incentiveEligible ? "success" : "warning"}
        />
        <StatCard
          label="Incentive Value"
          value={loading ? "…" : `${Math.round(performance?.incentivePercentage ?? 0)}%`}
          icon={TrendingUp}
          tone="info"
        />
        <StatCard
          label="Latest Review"
          value={loading ? "…" : performance?.lastEvaluatedAt ? new Date(performance.lastEvaluatedAt).toLocaleDateString() : "N/A"}
          icon={Clock}
          tone="secondary"
        />
      </div>

      {error ? (
        <Card className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <div className="font-semibold">Error</div>
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      ) : (
        <Card className="rounded-xl border border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Evaluation Trend</h2>
              <p className="text-sm text-muted-foreground">
                Last {chartData.length || 0} reviewed submissions.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Loading chart…
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No evaluation history is available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="performance"
                    name="Score (%)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

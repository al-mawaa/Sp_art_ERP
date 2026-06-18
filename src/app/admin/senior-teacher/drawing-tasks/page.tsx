"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, BarChart3, Users, TrendingUp, Target, Zap, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Task {
  id: string;
  taskName: string;
  taskDate: string;
  teacherName: string;
  batch: {
    id: string;
    name: string;
    course: string;
  };
  totalStudents: number;
  evaluatedStudents: number;
  pendingStudents: number;
  status: "Pending" | "In Review" | "Completed";
}

interface Stats {
  totalTasks: number;
  studentsEvaluated: number;
  averagePerformance: number;
  incentiveEligible: boolean;
  incentivePercentage: number;
}

export default function DrawingTasksPage({ basePath = '/admin/senior-teacher' }: { basePath?: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/senior-teacher/drawing-tasks", { credentials: "include" });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json.data) {
        setStats(json.data.stats);
        setTasks(json.data.tasks);
      }
    } catch (e) {
      console.error("Failed to load drawing tasks", e);
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.batch.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusConfig = {
    Pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", badge: "warning" },
    "In Review": { icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-50", badge: "info" },
    Completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", badge: "success" },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drawing Tasks"
        subtitle="Manage and evaluate drawing assessment tasks"
      />

      {/* Summary Cards */}
      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total Tasks"
            value={stats.totalTasks}
            icon={Target}
            tone="primary"
          />
          <StatCard
            label="Students Evaluated"
            value={stats.studentsEvaluated}
            icon={Users}
            tone="info"
          />
          <StatCard
            label="Average Performance"
            value={`${Math.round(stats.averagePerformance)}%`}
            icon={TrendingUp}
            tone="success"
          />
          <StatCard
            label="Incentive Eligible"
            value={stats.incentiveEligible ? "Yes" : "No"}
            icon={CheckCircle}
            tone={stats.incentiveEligible ? "success" : "warning"}
          />
          <StatCard
            label="Current Incentive"
            value={`${Math.round(stats.incentivePercentage)}%`}
            icon={Zap}
            tone="primary"
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by task name, batch, or course..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Task Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </>
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const config = statusConfig[task.status];
            const Icon = config.icon;
            return (
              <Card key={task.id} className={cn("p-4 rounded-xl border border-border flex flex-col", config.bg)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-base">{task.taskName}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {task.batch.name} · {task.batch.course}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Teacher: <span className="text-foreground">{task.teacherName}</span>
                    </p>
                  </div>
                  <Badge className={cn("ml-2", config.badge)}>
                    <Icon className="w-3 h-3 mr-1" />
                    {task.status}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  {new Date(task.taskDate).toLocaleDateString()}
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4 flex-1">
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-lg">{task.totalStudents}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Evaluated</p>
                    <p className="font-bold text-lg text-green-600">{task.evaluatedStudents}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="font-bold text-lg text-amber-600">{task.pendingStudents}</p>
                  </div>
                </div>

                <Link href={`${basePath}/drawing-tasks/${task.id}`}>
                  <Button size="sm" className="w-full rounded-lg gradient-primary text-white border-0">
                    View Task
                  </Button>
                </Link>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

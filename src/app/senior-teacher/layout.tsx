"use client";

import { ReactNode } from "react";
import {
  LayoutDashboard, CalendarOff, Palette, CalendarDays, MessageSquare, TrendingUp, ClipboardList, User, UserPlus, Boxes, GraduationCap, Users,
} from "lucide-react";
import { RoleLayout, NavItem, RequireRoles } from "@/components/layouts/RoleLayout";
import { useSeniorTeacherSessionGuard } from "@/components/senior-teacher/useSeniorTeacherSessionGuard";

const seniorNav: NavItem[] = [
  { to: "/senior-teacher", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/senior-teacher/teachers", label: "Teachers", icon: GraduationCap, end: false },
  { to: "/senior-teacher/students", label: "Students", icon: Users, end: false },
  { to: "/senior-teacher/batches", label: "Batches", icon: Boxes, end: false },
  { to: "/senior-teacher/classes", label: "My Classes", icon: CalendarDays },
  { to: "/senior-teacher/students", label: "Student admission", icon: Users, end: false },
  { to: "/senior-teacher/drawing-tasks", label: "Drawing Tasks", icon: Palette },
  { to: "/senior-teacher/performance", label: "Performance", icon: TrendingUp },
  { to: "/senior-teacher/progress", label: "Student Progress", icon: TrendingUp },
  { to: "/senior-teacher/slot-requests", label: "Slot Requests", icon: ClipboardList },
  { to: "/senior-teacher/leave", label: "Leave", icon: CalendarOff },
  { to: "/senior-teacher/chat", label: "Chat", icon: MessageSquare },
  { to: "/senior-teacher/profile", label: "My Profile", icon: User },
];

export default function SeniorTeacherLayout({ children }: { children: ReactNode }) {
  const { sessionOk, checking } = useSeniorTeacherSessionGuard();

  return (
    <RequireRoles roles={["senior-teacher"]}>
      <RoleLayout navItems={seniorNav} role="senior-teacher">
        {checking ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            Verifying senior teacher session…
          </div>
        ) : sessionOk ? (
          children
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground px-6 text-center">
            Redirecting to login…
          </div>
        )}
      </RoleLayout>
    </RequireRoles>
  );
}
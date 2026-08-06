"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Star, ClipboardList, Award, MessageSquareHeart, MessageSquare, User, BookOpen, Gift, Trophy, Package
} from "lucide-react";
import { RoleLayout, NavItem } from "@/components/layouts/RoleLayout";
import { RequireRole } from "@/components/layouts/RoleLayout";
import { useStudentSessionGuard } from "@/components/student/useStudentSessionGuard";

import { useState, useEffect } from "react";

export default function StudentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { sessionOk, checking } = useStudentSessionGuard();
  const [profileEditCompleted, setProfileEditCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (sessionOk) {
      fetch("/api/student/profile")
        .then(res => res.json())
        .then(data => {
          if (data?.data?.profile) {
            setProfileEditCompleted(data.data.profile.profileEditCompleted);
          }
        })
        .catch(err => console.error("Error checking profile completeness", err));
    }
  }, [sessionOk, pathname]);

  const studentNav: NavItem[] = [
    { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/profile", label: profileEditCompleted === false ? "Registration Form" : "My Profile", icon: User },
    { to: "/student/courses", label: "Courses", icon: BookOpen },
    { to: "/student/referrals", label: "Refer & Earn", icon: Gift },
    { to: "/student/rewards", label: "My Rewards", icon: Trophy },
    { to: "/student/classes", label: "My Classes", icon: CalendarDays },
    { to: "/student/scores", label: "My Scores", icon: Star },
    { to: "/student/attendance", label: "Attendance", icon: ClipboardList },
    { to: "/student/inventory", label: "Inventory", icon: Package },
    { to: "/student/certificates", label: "Certificates", icon: Award },
    { to: "/student/feedback", label: "Feedback", icon: MessageSquareHeart },
    { to: "/student/chat", label: "Chat", icon: MessageSquare },
  ];

  if (pathname?.startsWith("/student/login")) {
    return <>{children}</>;
  }

  return (
    <RequireRole role="student">
      {checking ? (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Verifying student session…
        </div>
      ) : sessionOk ? (
        <RoleLayout navItems={studentNav} role="student">
          {children}
        </RoleLayout>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground px-6 text-center">
          Redirecting to login…
        </div>
      )}
    </RequireRole>
  );
}

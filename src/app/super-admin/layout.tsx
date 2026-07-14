"use client";

import { ReactNode } from "react";
import {
  LayoutDashboard, Building2, Shield, CreditCard, BarChart3
} from "lucide-react";
import { RoleLayout, NavItem } from "@/components/layouts/RoleLayout";
import { RequireRole } from "@/components/layouts/RoleLayout";

const superAdminNav: NavItem[] = [
  { to: "/super-admin", label: "Dashboard", icon: LayoutDashboard, end: true, disabled: true },
  { to: "/super-admin/credentials", label: "Credentials", icon: Shield },
  { to: "/super-admin/institutions", label: "Institutions", icon: Building2, disabled: true },
  { to: "/super-admin/billing", label: "Billing", icon: CreditCard, disabled: true },
  { to: "/super-admin/settings", label: "Settings", icon: BarChart3, disabled: true },
  { to: "/super-admin/reports", label: "Reports", icon: BarChart3, disabled: true },
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="super-admin">
      <RoleLayout navItems={superAdminNav} role="super-admin">
        {children}
      </RoleLayout>
    </RequireRole>
  );
}

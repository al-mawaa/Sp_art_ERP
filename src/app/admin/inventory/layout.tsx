"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingCart, 
  Users, 
  ClipboardList, 
  Undo2, 
  Activity,
  Inbox
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

const navItems = [
  { href: "/admin/inventory", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory/master", label: "Master Items", icon: Package },
  { href: "/admin/inventory/categories", label: "Categories", icon: Tags },
  { href: "/admin/inventory/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/admin/inventory/vendors", label: "Vendors", icon: Users },
  { href: "/admin/inventory/requests", label: "Requests", icon: Inbox },
  { href: "/admin/inventory/issues", label: "Issues", icon: ClipboardList },
  { href: "/admin/inventory/returns", label: "Returns", icon: Undo2 },
  { href: "/admin/inventory/movements", label: "Movements", icon: Activity },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Management" subtitle="Manage stock, purchases, and issues" />

      {/* Internal Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-border">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin/inventory" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="min-h-[60vh]">
        {children}
      </div>
    </div>
  );
}

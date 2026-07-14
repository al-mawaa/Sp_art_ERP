"use client";

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "sonner";

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = async () => {
    try {
      const res = await fetch("/api/admin/inventory/movements").then(r => r.json());
      if (res.success) setMovements(res.movements);
    } catch (e) {
      toast.error("Failed to fetch movements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovements(); }, []);

  const columns = [
    { key: "date", header: "Date", render: (r: any) => new Date(r.createdAt).toLocaleString() },
    { key: "item", header: "Item", render: (r: any) => <span className="font-bold">{r.itemId?.itemName || "Unknown"}</span> },
    { key: "type", header: "Type", render: (r: any) => (
      <span className={`px-2 py-1 text-xs font-bold rounded-full 
        ${r.type === 'Purchase' ? 'bg-blue-100 text-blue-700' : 
          r.type === 'Issue' ? 'bg-orange-100 text-orange-700' : 
          r.type === 'Return' ? 'bg-green-100 text-green-700' : 
          'bg-red-100 text-red-700'}`}>
        {r.type}
      </span>
    )},
    { key: "qty", header: "Qty Change", render: (r: any) => (
      <span className={r.quantity > 0 ? "text-success font-bold" : "text-destructive font-bold"}>
        {r.quantity > 0 ? "+" : ""}{r.quantity}
      </span>
    )},
    { key: "balance", header: "New Stock", render: (r: any) => r.newStock },
    { key: "remarks", header: "Remarks" },
    { key: "user", header: "User", render: (r: any) => r.createdByAdminId?.name || "-" },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Stock Movements & Audit Log
        </h2>
      </div>

      <div className="glass-card p-6">
        <DataTable columns={columns} rows={movements} searchKeys={["remarks"]} />
      </div>
    </div>
  );
}

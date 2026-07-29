import React, { useState, useEffect } from "react";
import { Package, UserPlus, AlertTriangle, CheckCircle, XCircle, Loader2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface OperationsProps {
  data: any;
}

interface InventoryItem {
  _id: string;
  itemName: string;
  currentStock: number;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  categoryId: string;
  categoryName?: string;
}

interface CRMLead {
  id: string;
  name: string;
  source: string;
  assignedStaff: string;
  status: string;
  followUpDate: string;
  phone: string;
}

export function OperationsOverview({ data }: OperationsProps) {
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryEnabled, setInventoryEnabled] = useState(true);

  const [crmLeads, setCrmLeads] = useState<CRMLead[]>([]);
  const [crmLoading, setCrmLoading] = useState(true);
  const [crmError, setCrmError] = useState<string | null>(null);

  // Fetch inventory data
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setInventoryLoading(true);
        setInventoryError(null);

        const response = await fetch('/api/admin/inventory/dashboard');
        if (!response.ok) {
          if (response.status === 404) {
            setInventoryEnabled(false);
            return;
          }
          throw new Error('Failed to fetch inventory data');
        }

        const result = await response.json();
        if (result.success && result.items) {
          // Enrich with category names via API
          const enrichedItems = await Promise.all(
            result.items.slice(0, 5).map(async (item: any) => {
              let categoryName = "Uncategorized";
              if (item.categoryId) {
                try {
                  const categoryResponse = await fetch(`/api/admin/inventory/categories/${item.categoryId}`);
                  if (categoryResponse.ok) {
                    const categoryResult = await categoryResponse.json();
                    if (categoryResult.success && categoryResult.category) {
                      categoryName = categoryResult.category.name || "Uncategorized";
                    }
                  }
                } catch (err) {
                  console.error("Error fetching category:", err);
                }
              }
              return {
                _id: item._id?.toString() || "",
                itemName: item.itemName || "Unknown Item",
                currentStock: item.currentStock || 0,
                lowStockThreshold: item.lowStockThreshold || 10,
                criticalStockThreshold: item.criticalStockThreshold || 5,
                categoryId: item.categoryId?.toString() || "",
                categoryName,
              };
            })
          );
          setInventoryItems(enrichedItems);
        } else {
          setInventoryEnabled(false);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setInventoryError("Failed to load inventory data");
        setInventoryEnabled(false);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  // Fetch CRM leads data
  useEffect(() => {
    const fetchCrmLeads = async () => {
      try {
        setCrmLoading(true);
        setCrmError(null);

        const response = await fetch('/api/admin/crm/leads');
        if (!response.ok) {
          throw new Error('Failed to fetch CRM leads');
        }

        const result = await response.json();
        if (result.success && result.leads) {
          setCrmLeads(result.leads);
        } else {
          setCrmLeads([]);
        }
      } catch (err) {
        console.error("Error fetching CRM leads:", err);
        setCrmError("Failed to load CRM leads");
      } finally {
        setCrmLoading(false);
      }
    };

    fetchCrmLeads();
  }, []);

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { status: "Out of Stock", color: "bg-destructive/10 text-destructive", icon: <XCircle className="w-3 h-3" /> };
    if (item.currentStock <= item.criticalStockThreshold) return { status: "Critical", color: "bg-destructive/10 text-destructive", icon: <AlertTriangle className="w-3 h-3" /> };
    if (item.currentStock <= item.lowStockThreshold) return { status: "Low Stock", color: "bg-warning/10 text-warning", icon: <AlertTriangle className="w-3 h-3" /> };
    return { status: "In Stock", color: "bg-success/10 text-success", icon: <CheckCircle className="w-3 h-3" /> };
  };

  const getLeadStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "enrolled":
        return "bg-success/10 text-success";
      case "lead":
        return "bg-blue-10 text-blue-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
      
      {/* INVENTORY WIDGET */}
      <div className="glass-card p-6 border-orange-500/20 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" /> Inventory
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8"
            onClick={() => router.push("/admin/inventory")}
          >
            View All
          </Button>
        </div>

        {inventoryLoading ? (
          <div className="flex items-center justify-center py-12 flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : inventoryError ? (
          <div className="text-center py-8 text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex-1">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{inventoryError}</p>
          </div>
        ) : !inventoryEnabled ? (
          <div className="text-center py-12 flex-1">
            <PackageOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">Inventory module is not available</p>
            <p className="text-sm text-muted-foreground mt-1">Contact administrator to enable</p>
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="text-center py-12 flex-1">
            <PackageOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No inventory items found</p>
            <p className="text-sm text-muted-foreground mt-1">Add items to get started</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            {inventoryItems.map((item) => {
              const stockStatus = getStockStatus(item);
              return (
                <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.itemName}</div>
                    <div className="text-xs text-muted-foreground">{item.categoryName}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="font-bold">{item.currentStock}</span>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stockStatus.color}`}>
                      {stockStatus.icon}
                      {stockStatus.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CRM WIDGET */}
      <div className="glass-card p-6 border-pink-500/20 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-pink-500" /> CRM Leads
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8"
            onClick={() => router.push("/admin/crm")}
          >
            View All
          </Button>
        </div>

        {crmLoading ? (
          <div className="flex items-center justify-center py-12 flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : crmError ? (
          <div className="text-center py-8 text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex-1">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{crmError}</p>
          </div>
        ) : crmLeads.length === 0 ? (
          <div className="text-center py-12 flex-1">
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No CRM leads found</p>
            <p className="text-sm text-muted-foreground mt-1">New leads will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            {crmLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{lead.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{lead.source}</span>
                    {lead.assignedStaff && <span>• {lead.assignedStaff}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getLeadStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                  {lead.followUpDate && (
                    <span className="text-xs text-muted-foreground">{lead.followUpDate}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

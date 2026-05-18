import { PageHeader } from "@/components/shared/PageHeader";
import { Settings as SettingsIcon, BarChart3 } from "lucide-react";

export function Settings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration" />
      <div className="card-soft p-10 text-center">
        <SettingsIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Branding, integrations and security settings will appear here.</p>
      </div>
    </div>
  );
}

export function Reports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Cross-institute analytics" />
      <div className="card-soft p-10 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Aggregated revenue, churn and engagement reports.</p>
      </div>
    </div>
  );
}

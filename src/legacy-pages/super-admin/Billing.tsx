import { Check, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function Billing() {
  return (
    <div className="space-y-6">
      <PageHeader title="Billing & Plans" subtitle="Pricing across the platform" />
      <div className="grid md:grid-cols-3 gap-5">
        {pricingPlans.map((p, i) => (
          <div key={p.name} className={cn(
            "card-pop p-6 relative overflow-hidden",
            i === 1 && "ring-2 ring-primary scale-[1.02]"
          )}>
            {i === 1 && <span className="absolute top-3 right-3 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Most popular</span>}
            <div className="font-display text-2xl font-bold text-secondary">{p.name}</div>
            <div className="mt-2 flex items-end gap-1">
              <IndianRupee className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="font-display text-4xl font-bold">{p.price.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground mb-1.5">/mo</span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {p.features.map(f => (
                <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-success" />{f}</li>
              ))}
            </ul>
            <Button className={cn("w-full mt-6 rounded-xl font-bold", i === 1 ? "gradient-primary text-white border-0" : "bg-secondary text-secondary-foreground")}>
              Choose {p.name}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

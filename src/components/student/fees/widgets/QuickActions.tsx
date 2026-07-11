import React from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, HeadphonesIcon } from "lucide-react";
import { toast } from "sonner";

export function QuickActions({ onPayClick }: { onPayClick: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button 
        variant="outline" 
        className="rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 bg-white shadow-sm"
        onClick={() => toast.success("Downloading receipt...")}
      >
        <Download size={16} className="mr-2" />
        Receipts
      </Button>
      <Button 
        variant="outline" 
        className="rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 bg-white shadow-sm"
        onClick={() => toast.info("Opening support chat...")}
      >
        <HeadphonesIcon size={16} className="mr-2" />
        Contact Admin
      </Button>
      <Button 
        className="rounded-xl bg-[#072654] hover:bg-blue-900 text-white shadow-pop font-bold"
        onClick={onPayClick}
      >
        <CreditCard size={16} className="mr-2" />
        Pay Now
      </Button>
    </div>
  );
}

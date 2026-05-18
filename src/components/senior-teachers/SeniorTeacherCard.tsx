"use client";

import { Mail, Phone } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { StatusPill } from "@/components/shared/StatusPill";
import { cn } from "@/lib/utils";

const SPECIALIZATION_TONE: Record<string, string> = {
  Watercolor: "from-info to-secondary",
  Sketching: "from-muted-foreground to-secondary",
  "Clay Art": "from-warning to-primary",
  Acrylic: "from-success to-info",
  "Digital Art": "from-fuchsia to-pink",
  "Mixed Media": "from-indigo to-violet",
  "Oil Painting": "from-orange to-amber",
  Calligraphy: "from-slate to-cyan",
};

export interface SeniorTeacherCardProps {
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  yearsOfExperience: number;
  role: string;
  status: "Active" | "Inactive";
  assignedClasses: number;
  profileImage?: string;
}

export function SeniorTeacherCard({
  fullName,
  email,
  phone,
  specialization,
  yearsOfExperience,
  role,
  status,
  assignedClasses,
}: SeniorTeacherCardProps) {
  const tone = SPECIALIZATION_TONE[specialization] || "from-primary to-secondary";

  return (
    <div className="card-soft overflow-hidden hover:shadow-card transition-all hover:-translate-y-0.5">
      <div className={cn("h-24 bg-gradient-to-br relative", tone)}>
        <div className="absolute -bottom-7 left-4">
          <Avatar name={fullName} size={56} className="ring-4 ring-card" />
        </div>
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase bg-white/30 backdrop-blur text-white px-2 py-0.5 rounded-full">
          SENIOR
        </span>
      </div>
      <div className="pt-9 p-4 space-y-3">
        <div>
          <div className="font-display font-bold text-base">{fullName}</div>
          <div className="text-xs text-muted-foreground">{specialization} • {yearsOfExperience}y exp</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{email}</div>
          <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{phone}</div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <StatusPill status={status} />
          <span className="text-xs font-bold text-muted-foreground">{assignedClasses} classes</span>
        </div>
      </div>
    </div>
  );
}

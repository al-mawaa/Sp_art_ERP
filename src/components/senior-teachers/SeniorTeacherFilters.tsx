"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const SPECIALIZATIONS = [
  "All",
  "Watercolor",
  "Sketching",
  "Clay Art",
  "Acrylic",
  "Digital Art",
  "Mixed Media",
];

const ROLES = [
  "All",
  "Senior Faculty",
  "Head Instructor",
  "Master Trainer",
  "Workshop Mentor",
  "Senior Teacher",
];

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  specialization: string;
  onSpecializationChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
}

export function SeniorTeacherFilters({
  query,
  onQueryChange,
  specialization,
  onSpecializationChange,
  role,
  onRoleChange,
}: Props) {
  return (
    <div className="card-soft p-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="flex-1 min-w-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Search senior teachers..."
          className="pl-9 rounded-xl"
        />
      </div>
      <div className="sm:w-64">
        <Label className="sr-only">Specialization</Label>
        <Select value={specialization} onValueChange={onSpecializationChange}>
          <SelectTrigger className="rounded-xl w-full"><SelectValue placeholder="Specialization" /></SelectTrigger>
          <SelectContent>
            {SPECIALIZATIONS.map(spec => (
              <SelectItem key={spec} value={spec}>{spec}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:w-64">
        <Label className="sr-only">Role</Label>
        <Select value={role} onValueChange={onRoleChange}>
          <SelectTrigger className="rounded-xl w-full"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            {ROLES.map(roleOption => (
              <SelectItem key={roleOption} value={roleOption}>{roleOption}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CourseFiltersBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  teacherFilter,
  onTeacherChange,
  teacherOptions,
  batchFilter,
  onBatchChange,
  batchOptions,
  paymentFilter,
  onPaymentChange,
  showPaymentFilter = true,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  teacherFilter: string;
  onTeacherChange: (v: string) => void;
  teacherOptions: string[];
  batchFilter: string;
  onBatchChange: (v: string) => void;
  batchOptions: string[];
  paymentFilter: string;
  onPaymentChange: (v: string) => void;
  showPaymentFilter?: boolean;
}) {
  return (
    <div className="card-soft p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        Search & filters
      </div>
      <div
        className={`grid gap-3 sm:grid-cols-2 ${showPaymentFilter ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
      >
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 rounded-xl"
            placeholder="Search courses, batch, teacher…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onChange={onStatusChange}
          placeholder="Status"
          options={[
            { v: "all", l: "All statuses" },
            { v: "Active", l: "Active" },
            { v: "Completed", l: "Completed" },
            { v: "Upcoming", l: "Upcoming" },
            { v: "Payment Pending", l: "Payment Pending" },
          ]}
        />
        <FilterSelect
          value={teacherFilter}
          onChange={onTeacherChange}
          placeholder="Teacher"
          options={[{ v: "all", l: "All teachers" }, ...teacherOptions.map(t => ({ v: t, l: t }))]}
        />
        <FilterSelect
          value={batchFilter}
          onChange={onBatchChange}
          placeholder="Batch"
          options={[{ v: "all", l: "All batches" }, ...batchOptions.map(b => ({ v: b, l: b }))]}
        />
        {showPaymentFilter && (
          <FilterSelect
            value={paymentFilter}
            onChange={onPaymentChange}
            placeholder="Payment"
            options={[
              { v: "all", l: "All payments" },
              { v: "paid", l: "Paid" },
              { v: "pending", l: "Pending" },
              { v: "failed", l: "Failed" },
              { v: "partial", l: "Partial" },
            ]}
          />
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { v: string; l: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="rounded-xl h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.v} value={o.v}>
            {o.l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

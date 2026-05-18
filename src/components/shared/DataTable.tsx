"use client";
import { ReactNode, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Col<T> = { key: string; header: string; render?: (row: T) => ReactNode; className?: string };

export function DataTable<T extends Record<string, string | number | boolean>>(
  {
    columns, rows, searchKeys, pageSize = 8, emptyMessage = "Nothing here yet",
  }: {
    columns: Col<T>[]; rows: T[]; searchKeys?: (keyof T)[]; pageSize?: number; emptyMessage?: string;
  },
) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!q || !searchKeys) return rows;
    return rows.filter(r => searchKeys.some(k => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase())));
  }, [q, rows, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div className="card-soft overflow-hidden">
      {searchKeys && (
        <div className="p-4 border-b border-border/60">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search..." className="pl-9 rounded-xl" />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              {columns.map(c => (
                <th key={c.key} className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-muted-foreground">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr><td colSpan={columns.length} className="text-center text-muted-foreground py-10">{emptyMessage}</td></tr>
            )}
            {slice.map((row, i) => (
              <tr key={i} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                {columns.map(c => (
                  <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : String(row[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border/60 text-sm">
          <span className="text-muted-foreground">Page {cur} of {pages} • {filtered.length} records</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={cur === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={cur === pages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

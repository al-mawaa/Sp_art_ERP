"use client";

import { useState } from "react";
import { Cake, X } from "lucide-react";

export function BirthdayBanner({ names, big = false }: { names: string[]; big?: boolean }) {
  const [open, setOpen] = useState(true);
  if (!open || names.length === 0) return null;
  return (
    <div className={`relative overflow-hidden rounded-2xl gradient-party text-white shadow-pop ${big ? "p-6 sm:p-8" : "p-4 sm:p-5"} animate-pop-in`}>
      <Balloons />
      <button onClick={() => setOpen(false)} className="absolute top-3 right-3 rounded-full bg-white/20 hover:bg-white/30 p-1.5 transition-colors" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
      <div className="relative flex items-center gap-4">
        <div className="rounded-2xl bg-white/25 backdrop-blur p-3 animate-wiggle">
          <Cake className={big ? "w-10 h-10" : "w-7 h-7"} />
        </div>
        <div>
          <div className={`font-display font-bold ${big ? "text-2xl sm:text-3xl" : "text-lg"}`}>
            {big ? "🎉 Happy Birthday!" : "🎂 Birthday today!"}
          </div>
          <div className={`opacity-95 ${big ? "text-base mt-1" : "text-sm"}`}>
            {big ? `Have a colorful day, ${names[0]}!` : names.join(", ")}
          </div>
        </div>
      </div>
    </div>
  );
}

function Balloons() {
  return (
    <svg className="absolute -right-4 -top-4 w-32 h-32 opacity-30" viewBox="0 0 100 100" aria-hidden>
      <g>
        <ellipse cx="25" cy="30" rx="10" ry="13" fill="white" />
        <line x1="25" y1="43" x2="25" y2="80" stroke="white" strokeWidth="1" />
        <ellipse cx="55" cy="20" rx="10" ry="13" fill="white" />
        <line x1="55" y1="33" x2="55" y2="80" stroke="white" strokeWidth="1" />
        <ellipse cx="80" cy="40" rx="10" ry="13" fill="white" />
        <line x1="80" y1="53" x2="80" y2="80" stroke="white" strokeWidth="1" />
      </g>
    </svg>
  );
}

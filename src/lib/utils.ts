import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '';
  const rounded = Math.round(value * 100) / 100;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(rounded)}%`;
}

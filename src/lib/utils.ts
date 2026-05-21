import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(rating: number | string | null | undefined): string {
  if (rating == null) return "";
  const num = Number(rating);
  if (isNaN(num)) return "";
  return num.toFixed(1).replace(/\.0$/, "");
}

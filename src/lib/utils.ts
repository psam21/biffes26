import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCategoryGradient(color: string): string {
  const gradients: Record<string, string> = {
    asian: "from-blue-900 to-blue-950",
    indian: "from-orange-900 to-orange-950",
    kannada: "from-green-900 to-green-950",
    world: "from-purple-900 to-purple-950",
    critics: "from-yellow-900 to-yellow-950",
    retrospective: "from-cyan-900 to-cyan-950",
    africa: "from-amber-900 to-amber-950",
    biopics: "from-indigo-900 to-indigo-950",
    restored: "from-gray-700 to-gray-900",
    gold: "from-yellow-600 to-amber-800",
    default: "from-zinc-800 to-zinc-900",
  };
  return gradients[color] || gradients.default;
}

export function getCategoryBorderColor(color: string): string {
  const borders: Record<string, string> = {
    asian: "border-blue-700",
    indian: "border-orange-700",
    kannada: "border-green-700",
    world: "border-purple-700",
    critics: "border-yellow-700",
    retrospective: "border-cyan-700",
    africa: "border-amber-700",
    biopics: "border-indigo-700",
    restored: "border-gray-600",
    gold: "border-yellow-500",
    default: "border-zinc-700",
  };
  return borders[color] || borders.default;
}

export function formatDuration(minutes: number): string {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

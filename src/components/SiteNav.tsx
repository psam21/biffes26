"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWatchlist } from "@/lib/watchlist-context";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/films", label: "A-Z", icon: "🎬" },
  { href: "/schedule", label: "Schedule", icon: "📅" },
  { href: "/recommendations", label: "Picks", icon: "✨" },
  { href: "/watchlist", label: "Watchlist", icon: "❤️" },
];

interface SiteNavProps {
  variant?: "full" | "minimal";
}

export function SiteNav({ variant = "full" }: SiteNavProps) {
  const pathname = usePathname();
  const { watchlist } = useWatchlist();

  if (variant === "minimal") {
    return (
      <nav aria-label="Main navigation" className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const hasWatchlistBadge = item.href === "/watchlist" && watchlist.length > 0 && !isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              // 4.4: Include badge count in link's accessible name
              aria-label={hasWatchlistBadge ? `${item.label} (${watchlist.length} films)` : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-amber-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {hasWatchlistBadge && (
                <span className="bg-amber-500 text-black text-[10px] px-1.5 rounded-full font-bold" aria-hidden="true">
                  {watchlist.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const hasWatchlistBadge = item.href === "/watchlist" && watchlist.length > 0 && !isActive;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            // 4.4: Include badge count in link's accessible name
            aria-label={hasWatchlistBadge ? `${item.label} (${watchlist.length} films)` : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? "bg-amber-500 text-black"
                : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            {hasWatchlistBadge && (
              <span className="bg-amber-500 text-black text-[10px] px-1.5 rounded-full font-bold" aria-hidden="true">
                {watchlist.length}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

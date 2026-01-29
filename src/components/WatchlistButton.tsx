"use client";

import { useWatchlist } from "@/lib/watchlist-context";
import { WatchlistIcon } from "./WatchlistIcon";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  filmId: string;
  variant?: "icon" | "full";
  className?: string;
}

export function WatchlistButton({ filmId, variant = "icon", className }: WatchlistButtonProps) {
  const { isInWatchlist, toggleWatchlist, isLoading } = useWatchlist();
  
  const inWatchlist = isInWatchlist(filmId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    await toggleWatchlist(filmId);
  };

  if (isLoading) {
    return (
      <div className={cn(
        "animate-pulse bg-zinc-700 rounded-full",
        variant === "icon" ? "w-8 h-8" : "w-24 h-8",
        className
      )} />
    );
  }

  if (variant === "full") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
          "transition-all duration-150 ease-out",
          "hover:scale-[1.02] active:scale-[0.98]",
          inWatchlist
            ? "bg-amber-500 hover:bg-amber-600 text-zinc-900"
            : "bg-zinc-700 hover:bg-zinc-600 text-white",
          className
        )}
      >
        <WatchlistIcon filled={inWatchlist} size={18} />
        <span>{inWatchlist ? "In Watchlist" : "Add to Watchlist"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg",
        "transition-all duration-150 ease-out",
        "hover:scale-110 active:scale-90",
        inWatchlist
          ? "bg-amber-500 hover:bg-amber-600 text-zinc-900"
          : "bg-black/70 hover:bg-black/90 text-zinc-300 hover:text-white backdrop-blur-sm",
        className
      )}
    >
      <WatchlistIcon filled={inWatchlist} size={22} />
    </button>
  );
}

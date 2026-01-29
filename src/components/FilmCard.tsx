"use client";

import { memo, useRef, useCallback } from "react";
import Image from "next/image";
import { Film } from "@/types";
import { cn, formatDuration } from "@/lib/utils";
import { WatchlistButton } from "./WatchlistButton";

interface FilmCardProps {
  film: Film;
  onClick: () => void;
  index: number;
}

function FilmCardComponent({ film, onClick, index }: FilmCardProps) {
  // Use ref instead of state to track error without re-render
  const hasTriedFallback = useRef(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageError = useCallback(() => {
    if (!hasTriedFallback.current && film.posterUrlRemote && imgRef.current) {
      hasTriedFallback.current = true;
      imgRef.current.src = film.posterUrlRemote;
    }
  }, [film.posterUrlRemote]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  // Limit stagger delay to prevent excessive animation times
  const staggerDelay = Math.min(index * 20, 500);

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${film.title} by ${film.director || 'Unknown'} - ${film.country}, ${film.year}`}
      style={{
        animationDelay: `${staggerDelay}ms`,
      }}
      className={cn(
        "film-card cursor-pointer rounded-lg overflow-hidden group",
        "bg-zinc-900 border border-zinc-800",
        // CSS animation for entrance
        "animate-fade-in-scale opacity-0",
        // CSS transitions for hover
        "transition-all duration-200 ease-out",
        "hover:-translate-y-1.5 hover:border-zinc-600",
        "focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-zinc-800">
        {film.posterUrl ? (
          <Image
            ref={imgRef}
            src={film.posterUrl}
            alt={film.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            onError={handleImageError}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-zinc-600 text-4xl">🎬</span>
          </div>
        )}

        {/* Rating badges (top-left) */}
        {(film.imdbRating || film.rottenTomatoes || film.letterboxdRating) && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {film.imdbRating && (
              <div className="flex items-center gap-1 bg-yellow-500/90 backdrop-blur-sm rounded px-1.5 py-0.5">
                <span className="text-[10px] font-bold text-black">IMDb</span>
                <span className="text-[10px] font-semibold text-black">{film.imdbRating}</span>
              </div>
            )}
            {film.rottenTomatoes && (
              <div className="flex items-center gap-1 bg-red-500/90 backdrop-blur-sm rounded px-1.5 py-0.5">
                <span className="text-[10px]">🍅</span>
                <span className="text-[10px] font-semibold text-white">{film.rottenTomatoes}</span>
              </div>
            )}
            {film.letterboxdRating && !film.imdbRating && (
              <div className="flex items-center gap-1 bg-orange-500/90 backdrop-blur-sm rounded px-1.5 py-0.5">
                <span className="text-[10px] font-bold text-white">LB</span>
                <span className="text-[10px] font-semibold text-white">{film.letterboxdRating}</span>
              </div>
            )}
          </div>
        )}

        {/* Watchlist button (top-right) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <WatchlistButton filmId={film.id} />
        </div>

        {/* Language badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-0.5">
          <span className="text-xs text-white/90">{film.language}</span>
        </div>

        {/* Duration badge */}
        {film.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-0.5">
            <span className="text-xs text-white/90">
              {formatDuration(film.duration)}
            </span>
          </div>
        )}
      </div>

      {/* Film info */}
      <div className="p-3 space-y-1">
        <h4 className="font-semibold text-white text-sm leading-tight line-clamp-2">
          {film.title}
        </h4>
        {film.director && (
          <p className="text-xs text-zinc-400 truncate">{film.director}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{film.country}</span>
          <span>•</span>
          <span>{film.year}</span>
        </div>
      </div>
    </div>
  );
}

// Memoize to prevent re-renders when parent state changes
export const FilmCard = memo(FilmCardComponent, (prevProps, nextProps) => {
  return prevProps.film.id === nextProps.film.id && 
         prevProps.index === nextProps.index;
});

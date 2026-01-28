"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import { Film } from "@/types";
import { cn, formatDuration } from "@/lib/utils";
import { WatchlistButton } from "./WatchlistButton";

interface FilmCardProps {
  film: Film;
  onClick: () => void;
  index: number;
}

export function FilmCard({ film, onClick, index }: FilmCardProps) {
  const [imgSrc, setImgSrc] = useState(film.posterUrl);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError && film.posterUrlRemote) {
      setImgSrc(film.posterUrlRemote);
      setHasError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  // Get best available rating normalized to 5-star scale
  const getRating = (): string | null => {
    if (film.imdbRating) {
      // IMDB is out of 10, convert to 5
      const score = (parseFloat(film.imdbRating) / 2).toFixed(1);
      return score;
    }
    if (film.letterboxdRating) {
      // Letterboxd is already out of 5
      return film.letterboxdRating;
    }
    return null;
  };
  const rating = getRating();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${film.title} by ${film.director || 'Unknown'} - ${film.country}, ${film.year}`}
      className={cn(
        "film-card cursor-pointer rounded-lg overflow-hidden group",
        "bg-zinc-900 border border-zinc-800",
        "hover:border-zinc-600 transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-zinc-800">
        {imgSrc ? (
          <Image
            src={imgSrc}
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
    </motion.div>
  );
}

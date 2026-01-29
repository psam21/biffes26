"use client";

import { memo } from "react";
import { Film } from "@/types";

interface RatingBadgesProps {
  film: Film;
  size?: "xs" | "sm" | "md";
  className?: string;
}

function RatingBadgesComponent({ film, size = "sm", className = "" }: RatingBadgesProps) {
  const hasAnyRating = film.imdbRating || film.rottenTomatoes || film.metacritic || film.letterboxdRating;
  
  if (!hasAnyRating) return null;

  const sizeClasses = {
    xs: "text-[8px] px-1 py-0.5 gap-0.5",
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
  };

  const baseClass = sizeClasses[size];

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {film.imdbRating && (
        <div className={`flex items-center bg-yellow-500/90 backdrop-blur-sm rounded ${baseClass}`}>
          <span className="font-bold text-black">IMDb</span>
          <span className="font-semibold text-black">{film.imdbRating}</span>
        </div>
      )}
      {film.rottenTomatoes && (
        <div className={`flex items-center bg-red-500/90 backdrop-blur-sm rounded ${baseClass}`}>
          <span>🍅</span>
          <span className="font-semibold text-white">{film.rottenTomatoes}</span>
        </div>
      )}
      {film.metacritic && (
        <div className={`flex items-center bg-[#ffcc33]/90 backdrop-blur-sm rounded ${baseClass}`}>
          <span className="font-bold text-black">MC</span>
          <span className="font-semibold text-black">{film.metacritic}</span>
        </div>
      )}
      {film.letterboxdRating && (
        <div className={`flex items-center bg-[#00e054]/90 backdrop-blur-sm rounded ${baseClass}`}>
          <span className="font-bold text-black">LB</span>
          <span className="font-semibold text-black">{film.letterboxdRating}</span>
        </div>
      )}
    </div>
  );
}

export const RatingBadges = memo(RatingBadgesComponent);

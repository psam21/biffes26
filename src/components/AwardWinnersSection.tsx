"use client";

import { memo } from "react";
import Image from "next/image";
import { Film } from "@/types";
import { RatingBadges } from "./RatingBadges";

interface FestivalGroup {
  name: string;
  key: string;
  emoji: string;
  color: string;
  films: Film[];
}

interface AwardWinnersSectionProps {
  festivalGroups: FestivalGroup[];
  totalCount: number;
  onFilmClick: (film: Film, filmList: Film[], index: number) => void;
}

function AwardWinnersSectionComponent({ 
  festivalGroups, 
  totalCount, 
  onFilmClick 
}: AwardWinnersSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 pb-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-white">
          🏆 Award-Winning Films
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          {totalCount} festival favorites grouped by prestige
        </p>
      </div>
      
      {/* Festival Groups */}
      {festivalGroups.map(festival => (
        <div key={festival.key} className="mb-6">
          <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-gradient-to-r ${festival.color}`}>
            <span className="text-lg">{festival.emoji}</span>
            <h3 className="text-sm font-semibold text-white">{festival.name}</h3>
            <span className="text-xs text-zinc-400">({festival.films.length})</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {festival.films.map((film, filmIndex) => (
              <button
                key={film.id}
                onClick={() => onFilmClick(film, festival.films, filmIndex)}
                className="group relative focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-lg"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/50 group-hover:border-yellow-500/50 transition-all">
                  {film.posterUrl ? (
                    <Image
                      src={film.posterUrl}
                      alt={film.title}
                      fill
                      sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 10vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs p-2 text-center">
                      {film.title}
                    </div>
                  )}
                  {/* Rating badges */}
                  <RatingBadges film={film} size="xs" className="absolute top-1 left-1" />
                </div>
                <p className="mt-1.5 text-xs text-zinc-400 group-hover:text-white transition-colors line-clamp-2 text-center leading-tight">
                  {film.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export const AwardWinnersSection = memo(AwardWinnersSectionComponent);

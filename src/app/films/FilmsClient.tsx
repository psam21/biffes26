"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Film } from "@/types";
import { WatchlistButton } from "@/components/WatchlistButton";
import { SiteNav } from "@/components/SiteNav";

interface Screening {
  date: string;
  time: string;
  venue: string;
  screen: string;
}

interface FilmsClientProps {
  films: Film[];
  screeningLookup: Record<string, Screening[]>;
}

const venueNames: Record<string, string> = {
  cinepolis: "LuLu",
  rajkumar: "Rajkumar",
  banashankari: "Suchitra",
  openair: "Open Air",
};

const venueColors: Record<string, string> = {
  cinepolis: "bg-blue-500/20 text-blue-300",
  rajkumar: "bg-amber-500/20 text-amber-300",
  banashankari: "bg-green-500/20 text-green-300",
  openair: "bg-purple-500/20 text-purple-300",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

function formatScreenName(venue: string, screen: string): string {
  if (venue === "openair") return "Open Air";
  if (screen === "Open Forum") return "Forum";
  const venueName = venueNames[venue] || venue;
  return `${venueName} #${screen}`;
}

export default function FilmsClient({ films, screeningLookup }: FilmsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLetter, setFilterLetter] = useState<string | null>(null);

  // Sort films alphabetically
  const sortedFilms = useMemo(() => {
    return [...films].sort((a, b) => a.title.localeCompare(b.title));
  }, [films]);

  // Get unique first letters
  const letters = useMemo(() => {
    const letterSet = new Set(sortedFilms.map(f => f.title[0].toUpperCase()));
    return Array.from(letterSet).sort();
  }, [sortedFilms]);

  // Filter films
  const filteredFilms = useMemo(() => {
    let result = sortedFilms;
    
    if (filterLetter) {
      result = result.filter(f => f.title[0].toUpperCase() === filterLetter);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.director?.toLowerCase().includes(q) ||
        f.country?.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [sortedFilms, filterLetter, searchQuery]);

  // Get screenings for a film
  const getScreenings = (film: Film): Screening[] => {
    return screeningLookup[film.title.toUpperCase()] || [];
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Site Navigation */}
          <div className="mb-3 -mx-1 overflow-x-auto scrollbar-hide">
            <SiteNav variant="minimal" />
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">
              🎬 All Films <span className="text-zinc-500 font-normal">({filteredFilms.length})</span>
            </h1>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search films, directors, countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Letter Filter */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterLetter(null)}
              className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors ${
                !filterLetter ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              All
            </button>
            {letters.map(letter => (
              <button
                key={letter}
                onClick={() => setFilterLetter(filterLetter === letter ? null : letter)}
                className={`flex-shrink-0 w-7 py-1 rounded text-xs font-medium transition-colors ${
                  filterLetter === letter ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Film Grid */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFilms.map((film) => {
            const screenings = getScreenings(film);
            
            return (
              <div
                key={film.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="flex gap-3 p-3">
                  {/* Poster */}
                  <Link href={`/film/${film.id}`} className="flex-shrink-0">
                    {film.posterUrl ? (
                      <Image
                        src={film.posterUrl}
                        alt={film.title}
                        width={60}
                        height={90}
                        className="w-[60px] h-[90px] object-cover rounded"
                      />
                    ) : (
                      <div className="w-[60px] h-[90px] bg-zinc-800 rounded flex items-center justify-center text-2xl">
                        🎬
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/film/${film.id}`} className="hover:text-amber-400 transition-colors">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{film.title}</h3>
                      </Link>
                      <WatchlistButton filmId={film.id} />
                    </div>
                    
                    <p className="text-xs text-zinc-500 mt-1 truncate">
                      {film.director && <span>{film.director}</span>}
                      {film.country && <span> • {film.country}</span>}
                    </p>
                    
                    {film.duration && (
                      <p className="text-xs text-zinc-600 mt-0.5">{film.duration} min</p>
                    )}

                    {/* Screenings */}
                    {screenings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {screenings.slice(0, 4).map((s, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${venueColors[s.venue] || "bg-zinc-700 text-zinc-300"}`}
                          >
                            {formatDate(s.date)} {s.time} · {formatScreenName(s.venue, s.screen)}
                          </span>
                        ))}
                        {screenings.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
                            +{screenings.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {screenings.length === 0 && (
                      <p className="text-[10px] text-zinc-600 mt-2 italic">No scheduled screenings</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFilms.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No films found matching your search.
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  CategoryCard,
  WatchlistIcon,
} from "@/components";
import { AwardWinnersSection } from "@/components/AwardWinnersSection";
import { Category, Film } from "@/types";
import { useWatchlist } from "@/lib/watchlist-context";

// Lazy load heavy modal components - only loaded when needed
const FilmDrawer = dynamic(() => import("@/components/FilmDrawer").then(m => ({ default: m.FilmDrawer })), {
  ssr: false,
  loading: () => null,
});

// Types for the data passed from server
interface FestivalData {
  festival: {
    name: string;
    edition: number;
    year: number;
    dates: string;
    totalFilms: number;
    totalCountries: number;
    venues: Array<{ name: string; address: string; mapUrl: string }>;
    lastUpdated: string;
  };
  categories: Category[];
  films: Film[];
}

interface ScheduleData {
  days: Array<{
    date: string;
    dayNumber: number;
    label: string;
    screenings: Array<{
      venue: string;
      screen: string;
      showings: Array<{
        time: string;
        film: string;
        director: string;
        country: string;
        year: number;
        language: string;
        duration: number;
      }>;
    }>;
  }>;
  schedule: {
    venues: Record<string, { name: string; location: string; screens?: number }>;
  };
}

interface HomeClientProps {
  data: FestivalData;
  scheduleData?: ScheduleData;
}

export default function HomeClient({ data, scheduleData }: HomeClientProps) {
  const { festival, categories, films } = data;
  
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Navigation context for swipe in drawer
  const [drawerFilms, setDrawerFilms] = useState<Film[]>([]);
  const [drawerIndex, setDrawerIndex] = useState(-1);
  
  const { watchlist } = useWatchlist();

  // Memoize search films - only recompute when query changes
  const searchFilms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return films.filter(film => 
      film.title.toLowerCase().includes(query) ||
      film.director?.toLowerCase().includes(query) ||
      film.country?.toLowerCase().includes(query)
    );
  }, [films, searchQuery]);

  // Memoize festival-grouped award-winning films
  const festivalGroupedFilms = useMemo(() => {
    const festivalGroups = [
      { name: 'Cannes Film Festival', key: 'cannes', emoji: '🌴', color: 'from-yellow-600/30 to-amber-600/20 border-yellow-500/40' },
      { name: 'Venice Film Festival', key: 'venice', emoji: '🦁', color: 'from-red-600/30 to-rose-600/20 border-red-500/40' },
      { name: 'Berlin Film Festival', key: 'berlin', emoji: '🐻', color: 'from-amber-600/30 to-orange-600/20 border-amber-500/40' },
      { name: 'Sundance Film Festival', key: 'sundance', emoji: '🎿', color: 'from-blue-600/30 to-cyan-600/20 border-blue-500/40' },
      { name: 'Toronto Film Festival', key: 'toronto', emoji: '🍁', color: 'from-red-600/30 to-pink-600/20 border-red-500/40' },
      { name: 'Locarno Film Festival', key: 'locarno', emoji: '🐆', color: 'from-purple-600/30 to-violet-600/20 border-purple-500/40' },
      { name: 'San Sebastián Film Festival', key: 'san sebast', emoji: '🌊', color: 'from-teal-600/30 to-emerald-600/20 border-teal-500/40' },
      { name: 'Karlovy Vary', key: 'karlovy', emoji: '💎', color: 'from-cyan-600/30 to-sky-600/20 border-cyan-500/40' },
      { name: 'National Film Awards (India)', key: 'national film award', emoji: '🇮🇳', color: 'from-orange-600/30 to-green-600/20 border-orange-500/40' },
      { name: 'Other Festivals', key: '__other__', emoji: '🎬', color: 'from-zinc-600/30 to-slate-600/20 border-zinc-500/40' },
    ];
    
    const awardFilms = films.filter(film => film.awardsWon);
    const usedFilmIds = new Set<string>();
    
    return festivalGroups.map(festival => {
      const festivalFilms = festival.key === '__other__' 
        ? awardFilms.filter(film => !usedFilmIds.has(film.id))
        : awardFilms.filter(film => {
            const matches = film.awardsWon?.toLowerCase().includes(festival.key);
            if (matches) usedFilmIds.add(film.id);
            return matches;
          });
      
      if (festivalFilms.length === 0) return null;
      return { ...festival, films: festivalFilms };
    }).filter(Boolean) as Array<{ name: string; key: string; emoji: string; color: string; films: Film[] }>;
  }, [films]);

  // Memoize award films count
  const awardFilmsCount = useMemo(() => 
    films.filter(film => film.awardsWon).length, [films]);

  const handleFilmClick = (film: Film, filmList?: Film[], index?: number, openInNewTab?: boolean) => {
    // Open in new tab if requested (e.g., middle-click or ctrl+click)
    if (openInNewTab) {
      window.open(`/film/${film.id}`, '_blank');
      return;
    }
    // Otherwise open drawer for quick preview
    setSelectedFilm(film);
    setDrawerFilms(filmList || []);
    setDrawerIndex(index ?? -1);
    setIsDrawerOpen(true);
  };

  const handleDrawerNavigate = (film: Film, index: number) => {
    setSelectedFilm(film);
    setDrawerIndex(index);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedFilm(null), 300);
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Hero Header */}
        <header className="pt-6 pb-6">
          <div className="max-w-7xl mx-auto px-4">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                17th{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                  BIFFes
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                <span>January 29 – February 6, 2026</span>
                <span className="mx-2 text-zinc-600">|</span>
                <a href="https://maps.app.goo.gl/qk8Kk9QQVWizdCqn7" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 hover:underline">LULU Mall</a>
                {" • "}
                <a href="https://maps.app.goo.gl/8JZbsK4CSEm4AWm36" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 hover:underline">Rajkumar Bhavana</a>
                {" • "}
                <a href="https://maps.app.goo.gl/ruU2WZ2T991hrSLo7" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 hover:underline">Suchitra</a>
              </p>
            </motion.div>

            {/* 4 Main Actions - Centered */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {/* Search */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className={`flex items-center gap-2 rounded-xl transition-all ${
                  showSearch
                    ? "bg-zinc-800 border border-zinc-600 px-3 py-2"
                    : "bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 px-3 py-2"
                }`}>
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="flex items-center gap-2"
                  >
                    <span className="text-lg">🔍</span>
                    {!showSearch && <span className="text-sm text-zinc-300 font-medium">Search</span>}
                  </button>
                  {showSearch && (
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Film, director, country..."
                      autoFocus
                      className="bg-transparent text-white text-sm placeholder:text-zinc-500 outline-none w-40 sm:w-48"
                    />
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showSearch && searchQuery.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto"
                  >
                    {searchFilms.length === 0 ? (
                      <div className="p-4 text-center text-zinc-500 text-sm">
                        No films found for &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      <div className="p-2">
                        <div className="text-xs text-zinc-500 px-2 py-1 mb-1">
                          {searchFilms.length} result{searchFilms.length !== 1 ? 's' : ''}
                        </div>
                        {searchFilms.slice(0, 8).map((film) => (
                          <button
                            key={film.id}
                            onClick={() => {
                              handleFilmClick(film);
                              setShowSearch(false);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg transition-colors text-left"
                          >
                            {film.posterUrl ? (
                              <Image
                                src={film.posterUrl}
                                alt={film.title}
                                width={40}
                                height={56}
                                className="w-10 h-14 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-14 bg-zinc-800 rounded flex items-center justify-center text-lg">
                                🎬
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white font-medium truncate">{film.title}</div>
                              <div className="text-xs text-zinc-500 truncate">
                                {film.director}{film.country ? ` • ${film.country}` : ''}
                              </div>
                            </div>
                          </button>
                        ))}
                        {searchFilms.length > 8 && (
                          <div className="text-xs text-zinc-500 text-center py-2">
                            +{searchFilms.length - 8} more results
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {/* Schedule */}
              <Link href="/schedule">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30"
                >
                  <span className="text-lg">📅</span>
                  <span className="text-sm text-white font-medium">Schedule</span>
                </motion.div>
              </Link>

              {/* All Films A-Z */}
              <Link href="/films">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30"
                >
                  <span className="text-lg">🎬</span>
                  <span className="text-sm text-white font-medium">A-Z</span>
                </motion.div>
              </Link>

              {/* Daily Recommendations */}
              <Link href="/recommendations">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30"
                >
                  <span className="text-lg">✨</span>
                  <span className="text-sm text-white font-medium">Daily Picks</span>
                </motion.div>
              </Link>

              {/* Watchlist */}
              <Link href="/watchlist">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                    watchlist.length > 0
                      ? "bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30"
                      : "bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700"
                  }`}
                >
                  <WatchlistIcon filled={watchlist.length > 0} size={18} className={watchlist.length > 0 ? "text-rose-400" : "text-zinc-400"} />
                  <span className={`text-sm font-medium ${watchlist.length > 0 ? "text-white" : "text-zinc-300"}`}>
                    Watchlist
                  </span>
                  {watchlist.length > 0 && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                      {watchlist.length}
                    </span>
                  )}
                </motion.div>
              </Link>
            </div>
          </div>
        </header>

        {/* Categories Grid - More compact */}
        <section className="max-w-7xl mx-auto px-4 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((category, index) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <CategoryCard
                  category={category}
                  index={index}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* Award Winners Section - Grouped by Festival */}
        <AwardWinnersSection
          festivalGroups={festivalGroupedFilms}
          totalCount={awardFilmsCount}
          onFilmClick={handleFilmClick}
        />

        {/* Footer with Credits */}
        <footer className="border-t border-zinc-800 py-6 px-4 mt-4">
          <div className="max-w-7xl mx-auto text-center text-zinc-500 text-xs space-y-3">
            <p>
              © 2026 BIFFes • Last updated:{" "}
              {new Date(festival.lastUpdated).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
              <span className="text-zinc-600">Data sources:</span>
              <a href="https://biffes.org" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">BIFFes.org</a>
              <span className="text-zinc-700">•</span>
              <a href="https://www.omdbapi.com" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline">OMDb API</a>
              <span className="text-zinc-700">•</span>
              <a href="https://www.imdb.com" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">IMDb</a>
              <span className="text-zinc-700">•</span>
              <a href="https://letterboxd.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Letterboxd</a>
              <span className="text-zinc-700">•</span>
              <a href="https://www.rottentomatoes.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">Rotten Tomatoes</a>
            </div>
            <p>
              <a 
                href="https://github.com/psam21/biffes26" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                Source Code
              </a>
            </p>
            <p className="text-zinc-600 mt-2">
              Built with <span className="text-red-500">❤️</span> for cinema lovers
            </p>
          </div>
        </footer>
      </motion.div>

      {/* Film Drawer */}
      <FilmDrawer
        film={selectedFilm}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        films={drawerFilms}
        currentIndex={drawerIndex}
        onNavigate={handleDrawerNavigate}
        scheduleData={scheduleData}
      />
    </main>
  );
}

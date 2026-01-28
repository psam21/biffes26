"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CategoryCard,
  FilmDrawer,
  FestivalTicker,
  CategoryView,
  FilmCard,
} from "@/components";
import { Category, Film, Venue } from "@/types";
import festivalData from "@/data/biffes_data.json";

// Convert various rating formats to a 5-star scale
function getRatingScore(film: Film): number | null {
  // IMDB rating is out of 10, convert to 5
  if (film.imdbRating) {
    const rating = parseFloat(film.imdbRating);
    if (!isNaN(rating)) return rating / 2;
  }
  // Letterboxd is already out of 5
  if (film.letterboxdRating) {
    const rating = parseFloat(film.letterboxdRating);
    if (!isNaN(rating)) return rating;
  }
  return null;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const { festival, categories, films } = festivalData as {
    festival: typeof festivalData.festival & { venues: Venue[]; lastUpdated: string };
    categories: Category[];
    films: Film[];
  };

  // Get films filtered by rating
  const getFilteredFilms = (minRating: number): Film[] => {
    return films.filter((film) => {
      const score = getRatingScore(film);
      return score !== null && score >= minRating;
    });
  };

  const fiveStarFilms = getFilteredFilms(4.5); // 4.5-5 stars
  const fourHalfStarFilms = getFilteredFilms(4.0); // 4-5 stars  
  const fourStarFilms = getFilteredFilms(3.5); // 3.5-5 stars

  // Restore state from URL hash on initial load
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const category = categories.find((c) => c.slug === hash || hash.startsWith(c.slug + "/"));
      if (category) {
        setSelectedCategory(category);
      }
    }
  }, [categories]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      // Close drawer first if open
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        setSelectedFilm(null);
        return;
      }
      // Clear rating filter or go back to home
      if (ratingFilter !== null) {
        setRatingFilter(null);
        return;
      }
      // Go back to home
      setSelectedCategory(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDrawerOpen, ratingFilter]);

  const handleCategoryClick = (category: Category) => {
    // Push state so back button works
    window.history.pushState({ category: category.id }, "", `#${category.slug}`);
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    window.history.pushState(null, "", "/");
    setSelectedCategory(null);
    setRatingFilter(null);
  };

  const handleRatingFilter = (minRating: number) => {
    window.history.pushState({ rating: minRating }, "", `#rated-${minRating}`);
    setRatingFilter(minRating);
  };

  const handleFilmClick = (film: Film) => {
    const base = ratingFilter !== null ? `rated-${ratingFilter}` : selectedCategory?.slug;
    window.history.pushState({ film: film.id }, "", `#${base}/${film.id}`);
    setSelectedFilm(film);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    window.history.back();
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedFilm(null), 300);
  };

  const getCategoryFilms = (categoryId: string): Film[] => {
    return films.filter((film) => film.categoryId === categoryId);
  };

  // Get current filtered films based on rating
  const getRatedFilms = (): Film[] => {
    if (ratingFilter === null) return [];
    return getFilteredFilms(ratingFilter);
  };

  const getRatingLabel = (rating: number): string => {
    if (rating >= 4.5) return "5 Star";
    if (rating >= 4.0) return "4.5 Star";
    return "4 Star";
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header - Reserved for future use */}

      <AnimatePresence mode="wait">
        {ratingFilter !== null ? (
          /* Rated Films View */
          <motion.div
            key={`rated-${ratingFilter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/20 py-12 px-4 border-b border-yellow-800/30">
              <div className="max-w-7xl mx-auto">
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={handleBackToCategories}
                  className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg px-2 py-1 -ml-2"
                  aria-label="Go back to all categories"
                >
                  <span>←</span>
                  <span>All Categories</span>
                </motion.button>

                <div className="flex items-start justify-between">
                  <div>
                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3"
                    >
                      <span className="text-yellow-500">★</span>
                      {getRatingLabel(ratingFilter)} Films
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mt-2 text-white/70"
                    >
                      Highly rated films from Letterboxd & IMDb
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2"
                  >
                    <span className="text-xl font-bold text-white">{getRatedFilms().length}</span>
                    <span className="text-sm text-white/60">films</span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Films Grid */}
            <div className="max-w-7xl mx-auto px-4 py-8">
              {getRatedFilms().length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {getRatedFilms().map((film, index) => (
                    <FilmCard
                      key={film.id}
                      film={film}
                      onClick={() => handleFilmClick(film)}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <span className="text-6xl mb-4 block">⭐</span>
                  <p className="text-zinc-400 text-lg mb-2">No rated films yet</p>
                  <p className="text-zinc-500 text-sm">
                    Run <code className="bg-zinc-800 px-2 py-1 rounded">npm run pipeline:ratings</code> with an OMDB API key to fetch ratings
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : selectedCategory ? (
          /* Category Detail View */
          <CategoryView
            key={selectedCategory.id}
            category={selectedCategory}
            films={getCategoryFilms(selectedCategory.id)}
            onBack={handleBackToCategories}
            onFilmClick={handleFilmClick}
          />
        ) : (
          /* Categories Grid View */
          <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Compact Header */}
            <header className="px-4 pt-6 pb-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  17th{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    BIFFes
                  </span>{" "}
                  2026
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                  January 29 – February 6, 2026
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  <a href="https://maps.app.goo.gl/qk8Kk9QQVWizdCqn7" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 hover:underline">LULU Mall</a>
                  {" • "}
                  <a href="https://maps.app.goo.gl/8JZbsK4CSEm4AWm36" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 hover:underline">Dr. Rajkumar Bhavana</a>
                  {" • "}
                  <a href="https://maps.app.goo.gl/ruU2WZ2T991hrSLo7" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 hover:underline">Suchitra Cinema</a>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  200+ Films | 60+ Countries | 9 Days
                </p>
              </motion.div>
            </header>

            {/* Categories Grid - More compact */}
            <section className="max-w-7xl mx-auto px-4 pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {categories.map((category, index) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onClick={() => handleCategoryClick(category)}
                    index={index}
                  />
                ))}
              </div>
            </section>

            {/* Award Winners Section - Grouped by Festival */}
            <section className="max-w-7xl mx-auto px-4 pb-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-white">
                  🏆 Award-Winning Films
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {films.filter(film => film.awardsWon).length} festival favorites grouped by prestige
                </p>
              </div>
              
              {/* Festival Groups */}
              {(() => {
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
                  
                  return (
                    <div key={festival.key} className="mb-6">
                      <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-gradient-to-r ${festival.color}`}>
                        <span className="text-lg">{festival.emoji}</span>
                        <h3 className="text-sm font-semibold text-white">{festival.name}</h3>
                        <span className="text-xs text-zinc-400">({festivalFilms.length})</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                        {festivalFilms.map((film) => (
                          <button
                            key={film.id}
                            onClick={() => handleFilmClick(film)}
                            className="group relative focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-lg"
                          >
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/50 group-hover:border-yellow-500/50 transition-all">
                              {film.posterUrl ? (
                                <img
                                  src={film.posterUrl}
                                  alt={film.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs p-2 text-center">
                                  {film.title}
                                </div>
                              )}
                              <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded font-medium">
                                🏆
                              </div>
                            </div>
                            <p className="mt-1.5 text-[10px] text-zinc-400 group-hover:text-white transition-colors line-clamp-2 text-center leading-tight">
                              {film.title}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </section>

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
                    href="https://github.com/pSamratv1/biffes26" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    Source Code
                  </a>
                </p>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Film Drawer */}
      <FilmDrawer
        film={selectedFilm}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </main>
  );
}

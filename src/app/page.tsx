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

            {/* Award Winners Section */}
            <section className="max-w-7xl mx-auto px-4 pb-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-white">
                  🏆 Award-Winning Films
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {films.filter(film => film.awardsWon).length} festival favorites and critically acclaimed selections
                </p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {films
                  .filter(film => film.awardsWon)
                  .sort((a, b) => {
                    // Prioritize major festivals: Cannes, Venice, Berlin, Sundance, Toronto
                    const majorFests = ['cannes', 'venice', 'berlin', 'sundance', 'toronto', 'locarno'];
                    const aHasMajor = majorFests.some(f => a.awardsWon?.toLowerCase().includes(f));
                    const bHasMajor = majorFests.some(f => b.awardsWon?.toLowerCase().includes(f));
                    if (aHasMajor && !bHasMajor) return -1;
                    if (!aHasMajor && bHasMajor) return 1;
                    return (b.awardsWon?.length || 0) - (a.awardsWon?.length || 0);
                  })
                  .map((film) => (
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
            </section>

            {/* Compact Footer */}
            <footer className="border-t border-zinc-800 py-4 px-4 mt-4">
              <div className="max-w-7xl mx-auto text-center text-zinc-500 text-xs">
                <p>
                  © 2026 BIFFes • Data from{" "}
                  <a
                    href="https://biffes.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-500 hover:underline"
                  >
                    biffes.org
                  </a>
                  {" • Last updated: "}
                  {new Date(festival.lastUpdated).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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

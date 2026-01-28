"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CategoryCard,
  FilmDrawer,
  FestivalTicker,
  CategoryView,
} from "@/components";
import { Category, Film, Venue } from "@/types";
import festivalData from "@/data/biffes_data.json";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { festival, categories, films } = festivalData as {
    festival: typeof festivalData.festival & { venues: Venue[] };
    categories: Category[];
    films: Film[];
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleFilmClick = (film: Film) => {
    setSelectedFilm(film);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedFilm(null), 300);
  };

  const getCategoryFilms = (categoryId: string): Film[] => {
    return films.filter((film) => film.categoryId === categoryId);
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Festival Ticker */}
      <FestivalTicker
        totalFilms={festival.totalFilms}
        totalCountries={festival.totalCountries}
        edition={festival.edition}
        dates={festival.dates}
        venues={festival.venues}
      />

      <AnimatePresence mode="wait">
        {selectedCategory ? (
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
                <p className="text-sm text-zinc-500 mt-1">
                  {festival.totalFilms}+ films • {festival.totalCountries} countries • {categories.length} categories
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

            {/* Compact Footer */}
            <footer className="border-t border-zinc-800 py-4 px-4">
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

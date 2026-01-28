"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CategoryCard,
  FilmDrawer,
  FestivalTicker,
  CategoryView,
} from "@/components";
import { Category, Film } from "@/types";
import festivalData from "@/data/biffes_data.json";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { festival, categories, films } = festivalData as {
    festival: typeof festivalData.festival;
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
            {/* Header */}
            <header className="px-4 py-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  17th{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    BIFFes
                  </span>{" "}
                  2026
                </h1>
                <p className="text-lg text-zinc-400">
                  Bengaluru International Film Festival
                </p>
                <p className="text-sm text-zinc-500 mt-2">
                  Explore {festival.totalFilms}+ films from {festival.totalCountries}{" "}
                  countries across {categories.length} curated categories
                </p>
              </motion.div>
            </header>

            {/* Categories Grid */}
            <section className="max-w-7xl mx-auto px-4 pb-16">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-semibold text-white mb-6"
              >
                Film Categories
              </motion.h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

            {/* Footer */}
            <footer className="border-t border-zinc-800 py-8 px-4">
              <div className="max-w-7xl mx-auto text-center text-zinc-500 text-sm">
                <p>
                  © 2026 Bengaluru International Film Festival (BIFFes). All
                  rights reserved.
                </p>
                <p className="mt-2">
                  Data sourced from{" "}
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

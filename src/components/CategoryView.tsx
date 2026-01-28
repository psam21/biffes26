"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Film as FilmIcon } from "lucide-react";
import { Category, Film } from "@/types";
import { FilmCard } from "./FilmCard";
import { cn, getCategoryGradient, getCategoryBorderColor } from "@/lib/utils";

interface CategoryViewProps {
  category: Category;
  films: Film[];
  onBack: () => void;
  onFilmClick: (film: Film, filmList?: Film[], index?: number) => void;
}

export function CategoryView({
  category,
  films,
  onBack,
  onFilmClick,
}: CategoryViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Category Header */}
      <div
        className={cn(
          "bg-gradient-to-br py-12 px-4 border-b",
          getCategoryGradient(category.color),
          getCategoryBorderColor(category.color)
        )}
      >
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg px-2 py-1 -ml-2"
            aria-label="Go back to all categories"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>All Categories</span>
          </motion.button>

          {/* Category info */}
          <div className="flex items-start justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold text-white"
              >
                {category.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-2 text-white/70 max-w-2xl"
              >
                {category.description}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2"
            >
              <FilmIcon className="w-5 h-5 text-white/80" />
              <span className="text-xl font-bold text-white">{films.length}</span>
              <span className="text-sm text-white/60">films</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Films Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence mode="popLayout">
            {films.map((film, index) => (
              <FilmCard
                key={film.id}
                film={film}
                onClick={() => onFilmClick(film, films, index)}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        {films.length === 0 && (
          <div className="text-center py-16">
            <FilmIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No films available in this category yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

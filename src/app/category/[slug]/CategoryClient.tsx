"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Film as FilmIcon } from "@/lib/icons";
import { Category, Film } from "@/types";
import { VirtualizedFilmGrid } from "@/components";
import { cn, getCategoryGradient, getCategoryBorderColor } from "@/lib/utils";

const FilmDrawer = dynamic(
  () => import("@/components/FilmDrawer").then((m) => ({ default: m.FilmDrawer })),
  { ssr: false, loading: () => null }
);

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

interface CategoryClientProps {
  category: Category;
  films: Film[];
  scheduleData?: ScheduleData;
}

export default function CategoryClient({ category, films, scheduleData }: CategoryClientProps) {
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerFilms, setDrawerFilms] = useState<Film[]>([]);
  const [drawerIndex, setDrawerIndex] = useState(-1);

  const handleFilmClick = (film: Film, filmList?: Film[], index?: number, openInNewTab?: boolean) => {
    if (openInNewTab) {
      window.open(`/film/${film.id}`, "_blank");
      return;
    }
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
        className="min-h-screen"
      >
        {/* Category Header */}
        <div
          className={cn(
            "bg-gradient-to-br py-8 sm:py-12 px-4 border-b",
            getCategoryGradient(category.color),
            getCategoryBorderColor(category.color)
          )}
        >
          <div className="max-w-7xl mx-auto">
            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 sm:mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg px-2 py-1 -ml-2"
            >
              <span>←</span>
              <span>Home</span>
            </Link>

            {/* Category info */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  {category.name}
                </h1>
                <p className="mt-2 text-white/70 max-w-2xl text-sm sm:text-base">
                  {category.description}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 self-start">
                <FilmIcon className="w-5 h-5 text-white/80" />
                <span className="text-xl font-bold text-white">{films.length}</span>
                <span className="text-sm text-white/60">films</span>
              </div>
            </div>
          </div>
        </div>

        {/* Films Grid */}
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <VirtualizedFilmGrid films={films} onFilmClick={handleFilmClick} />
        </div>
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

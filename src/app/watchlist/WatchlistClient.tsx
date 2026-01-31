"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { VirtualizedFilmGrid } from "@/components";
import { WatchlistSchedule } from "@/components/WatchlistSchedule";
import { SiteNav } from "@/components/SiteNav";
import { Film } from "@/types";
import { useWatchlist } from "@/lib/watchlist-context";

const FilmDrawer = dynamic(
  () => import("@/components/FilmDrawer").then((m) => ({ default: m.FilmDrawer })),
  { ssr: false, loading: () => null }
);
const ShareWatchlist = dynamic(
  () => import("@/components/ShareWatchlist").then((m) => ({ default: m.ShareWatchlist })),
  { ssr: false, loading: () => <div className="w-8 h-8 bg-zinc-700 rounded-lg animate-pulse" /> }
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

interface WatchlistClientProps {
  films: Film[];
  scheduleData: ScheduleData;
}

export default function WatchlistClient({ films, scheduleData }: WatchlistClientProps) {
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerFilms, setDrawerFilms] = useState<Film[]>([]);
  const [drawerIndex, setDrawerIndex] = useState(-1);

  const { watchlist, isLoading: watchlistLoading } = useWatchlist();

  const watchlistFilms = useMemo(
    () => films.filter((film) => watchlist.includes(film.id)),
    [films, watchlist]
  );

  const handleFilmClick = (film: Film, filmList?: Film[], index?: number) => {
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
        {/* Header */}
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 py-4 sm:py-6 px-4 border-b border-green-800/30">
          <div className="max-w-7xl mx-auto">
            {/* Site Navigation */}
            <div className="mb-4 -mx-1 overflow-x-auto scrollbar-hide">
              <SiteNav variant="minimal" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <span className="text-green-500">❤️</span>
                  My Watchlist
                </h1>
                <p className="mt-2 text-white/70 text-sm sm:text-base">
                  Films you want to watch at BIFFes 2026
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ShareWatchlist />
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-xl font-bold text-white">{watchlistFilms.length}</span>
                  <span className="text-sm text-white/60">films</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Watchlist Content */}
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-10">
          {watchlistLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading your watchlist...</p>
            </div>
          ) : watchlistFilms.length > 0 ? (
            <>
              {/* Schedule Section */}
              <WatchlistSchedule
                watchlistFilms={watchlistFilms}
                scheduleData={scheduleData}
                onFilmClick={(film) => handleFilmClick(film)}
              />

              {/* Divider */}
              <div className="border-t border-zinc-800" />

              {/* Films Grid */}
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                  <span>🎬</span>
                  All Watchlist Films
                </h3>
                <VirtualizedFilmGrid films={watchlistFilms} onFilmClick={handleFilmClick} />
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">📝</span>
              <p className="text-zinc-400 text-lg mb-2">Your watchlist is empty</p>
              <p className="text-zinc-500 text-sm mb-6">
                Click the{" "}
                <span className="inline-flex items-center justify-center w-5 h-5 bg-zinc-700 rounded-full text-xs">
                  +
                </span>{" "}
                button on any film to add it
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                Browse Films
              </Link>
            </div>
          )}
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

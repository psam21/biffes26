"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Film } from "@/types";
import {
  generateRecommendations,
  getCurrentFestivalDate,
  getFestivalDates,
  formatDateLabel,
  RecommendedShowing,
} from "@/lib/recommendations";
import { formatDuration } from "@/lib/utils";
import dynamic from "next/dynamic";
import { SiteNav } from "@/components/SiteNav";

const FilmDrawer = dynamic(() => import("@/components/FilmDrawer").then(m => ({ default: m.FilmDrawer })), {
  ssr: false,
  loading: () => null,
});

interface ScheduleData {
  schedule: {
    venues: Record<string, { name: string; location: string; screens?: number }>;
  };
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
}

interface RecommendationsClientProps {
  films: Film[];
  scheduleData: ScheduleData;
}

export default function RecommendationsClient({ films, scheduleData }: RecommendationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  
  const [selectedDate, setSelectedDate] = useState(dateParam || getCurrentFestivalDate());
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const festivalDates = getFestivalDates();

  // Update URL when date changes
  useEffect(() => {
    const newUrl = `/recommendations?date=${selectedDate}`;
    router.replace(newUrl, { scroll: false });
  }, [selectedDate, router]);

  const recommendations = useMemo(() => {
    return generateRecommendations(selectedDate, scheduleData, films, 6);
  }, [selectedDate, scheduleData, films]);

  // Calculate total watch time
  const totalMinutes = useMemo(() => {
    return recommendations.reduce((total, rec) => {
      return total + (rec.film.duration || 120);
    }, 0);
  }, [recommendations]);

  const handleFilmClick = (film: Film) => {
    setSelectedFilm(film);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedFilm(null), 300);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/recommendations?date=${selectedDate}`;
    const text = `Check out the best films to watch on ${formatDateLabel(selectedDate)} at BIFFes 2026!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "BIFFes 2026 Recommendations", text, url });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          {/* Site Navigation */}
          <div className="mb-3 -mx-1 overflow-x-auto scrollbar-hide">
            <SiteNav variant="minimal" />
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>✨</span>
              Daily Picks
            </h1>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm"
            >
              <span>📤</span>
              <span className="text-zinc-300 hidden sm:inline">Share</span>
            </button>
          </div>
          
          <p className="text-xs sm:text-sm text-amber-200/70 mb-3">
            Best films to watch each day, ranked by ratings
          </p>

          {/* Date Selector - horizontal scroll on mobile */}
          <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2 min-w-max sm:justify-center sm:flex-wrap">
              {festivalDates.map(({ date, label }) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    selectedDate === date
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {label}
                  {date === getCurrentFestivalDate() && selectedDate !== date && (
                    <span className="ml-1 text-amber-400">•</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            {formatDateLabel(selectedDate)}
          </h2>
          <div className="text-xs sm:text-sm text-zinc-400">
            {recommendations.length} films • {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">📅</span>
            <p className="text-zinc-400">No screenings found for this date</p>
            <p className="text-zinc-500 text-sm mt-1">Try selecting a different day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <motion.div
                key={`${rec.film.id}-${rec.time}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => handleFilmClick(rec.film)}
                  className="w-full p-3 sm:p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl sm:rounded-2xl transition-all border border-zinc-800 hover:border-zinc-700 text-left group"
                >
                  {/* Mobile: Stacked layout, Desktop: Row layout */}
                  <div className="flex gap-3">
                    {/* Poster */}
                    <div className="relative w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-zinc-800">
                      {rec.film.posterUrl ? (
                        <Image
                          src={rec.film.posterUrl}
                          alt={rec.film.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 640px) 64px, 80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🎬
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Time badge - inline on mobile */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base sm:text-lg font-bold text-amber-400">{rec.time}</span>
                        <span className="text-[10px] sm:text-xs text-zinc-500">→ {rec.endTime}</span>
                      </div>
                      
                      <h3 className="font-semibold text-white text-sm sm:text-base leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">
                        {rec.film.title}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] sm:text-xs text-zinc-500">
                        <span>{rec.film.language}</span>
                        <span>•</span>
                        <span>{formatDuration(rec.film.duration)}</span>
                        <span>•</span>
                        <span>Screen {rec.screen}</span>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {rec.reason}
                        </span>
                        {rec.alternativeShowings && rec.alternativeShowings.map((s, i) => (
                          <span key={i} className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            🔄 {s.dateLabel} {s.time}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <p className="text-xs sm:text-sm text-zinc-500 text-center">
            💡 Films ranked by IMDb, RT, Metacritic, Letterboxd & awards
          </p>
        </div>
      </div>

      {/* Film Drawer */}
      <FilmDrawer
        film={selectedFilm}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        films={recommendations.map(r => r.film)}
        currentIndex={selectedFilm ? recommendations.findIndex(r => r.film.id === selectedFilm.id) : -1}
        onNavigate={(film) => setSelectedFilm(film)}
        scheduleData={scheduleData}
      />
    </main>
  );
}

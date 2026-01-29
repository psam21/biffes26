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
import { RatingBadges } from "@/components/RatingBadges";
import { formatDuration } from "@/lib/utils";
import dynamic from "next/dynamic";

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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <span>←</span>
              <span className="text-sm">Back</span>
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm"
            >
              <span>📤</span>
              <span className="text-zinc-300">Share</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-3">
              <span>✨</span>
              Today&apos;s Best Films
            </h1>
            <p className="text-sm text-amber-200/70 mt-2">
              Optimized schedule based on ratings
            </p>
          </div>

          {/* Date Selector */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
            {festivalDates.map(({ date, label }) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
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
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {formatDateLabel(selectedDate)}
          </h2>
          <div className="text-sm text-zinc-400">
            {recommendations.length} films • {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">📅</span>
            <p className="text-zinc-400 text-lg">No screenings found for this date</p>
            <p className="text-zinc-500 text-sm mt-2">Try selecting a different day</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={`${rec.film.id}-${rec.time}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => handleFilmClick(rec.film)}
                  className="w-full flex gap-4 p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl transition-all border border-zinc-800 hover:border-zinc-700 text-left group"
                >
                  {/* Time Column */}
                  <div className="flex-shrink-0 text-center w-20">
                    <div className="text-xl font-bold text-amber-400">{rec.time}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">to {rec.endTime}</div>
                    <div className="mt-2 px-2 py-1 bg-zinc-800 rounded text-[11px] text-zinc-400 leading-tight">
                      {rec.venueName.includes('Cinepolis') ? 'LuLu Mall' : rec.venueName}
                      {rec.screen !== 'Main' && <><br />Screen {rec.screen}</>}
                    </div>
                  </div>

                  {/* Poster */}
                  <div className="relative w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800">
                    {rec.film.posterUrl ? (
                      <Image
                        src={rec.film.posterUrl}
                        alt={rec.film.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Film Info */}
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-white text-lg leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">
                        {rec.film.title}
                      </h3>
                      <RatingBadges film={rec.film} size="sm" className="flex-shrink-0" />
                    </div>
                    {rec.film.director && (
                      <p className="text-sm text-zinc-400 mt-1">
                        {rec.film.director}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                      <span>{rec.film.country}</span>
                      <span>•</span>
                      <span>{rec.film.language}</span>
                      <span>•</span>
                      <span>{formatDuration(rec.film.duration)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {rec.reason}
                      </span>
                      {rec.alternativeShowings && rec.alternativeShowings.length > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          🔄 Also: {rec.alternativeShowings.slice(0, 2).map(s => `${s.dateLabel} ${s.time}`).join(', ')}
                          {rec.alternativeShowings.length > 2 && ` +${rec.alternativeShowings.length - 2}`}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <p className="text-sm text-zinc-400 text-center">
            💡 This schedule is optimized to maximize film quality while avoiding time conflicts.
            <br />
            <span className="text-zinc-500">Films are ranked by IMDb, Rotten Tomatoes, Metacritic, Letterboxd ratings and awards.</span>
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
      />
    </main>
  );
}

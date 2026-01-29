"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Film } from "@/types";
import {
  generateRecommendations,
  getCurrentFestivalDate,
  getFestivalDates,
  formatDateLabel,
  RecommendedShowing,
} from "@/lib/recommendations";
import { RatingBadges } from "./RatingBadges";
import { formatDuration } from "@/lib/utils";

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

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleData: ScheduleData;
  films: Film[];
  onFilmClick: (film: Film) => void;
}

export function RecommendationsModal({
  isOpen,
  onClose,
  scheduleData,
  films,
  onFilmClick,
}: RecommendationsModalProps) {
  const [selectedDate, setSelectedDate] = useState(getCurrentFestivalDate());
  const festivalDates = getFestivalDates();

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
    onFilmClick(film);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-amber-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>✨</span>
                  Today&apos;s Best Films
                </h2>
                <p className="text-sm text-amber-200/70 mt-1">
                  Optimized schedule based on ratings
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors"
              >
                <span className="text-zinc-400 text-xl">×</span>
              </button>
            </div>

            {/* Date Selector */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {festivalDates.map(({ date, label }) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
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

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-180px)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-400">
                {formatDateLabel(selectedDate)}
              </h3>
              <div className="text-xs text-zinc-500">
                {recommendations.length} films • {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total
              </div>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">📅</span>
                <p className="text-zinc-400">No screenings found for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={`${rec.film.id}-${rec.time}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => handleFilmClick(rec.film)}
                      className="w-full flex gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-all border border-zinc-700/50 hover:border-zinc-600 text-left group"
                    >
                      {/* Time Column */}
                      <div className="flex-shrink-0 text-center w-16">
                        <div className="text-lg font-bold text-amber-400">{rec.time}</div>
                        <div className="text-[10px] text-zinc-500">to {rec.endTime}</div>
                        <div className="mt-1 text-[10px] text-zinc-600 leading-tight">
                          {rec.venueName.includes('Cinepolis') ? 'LuLu' : rec.venueName.split(' ')[0]}
                          <br />
                          {rec.screen !== 'Main' && `Screen ${rec.screen}`}
                        </div>
                      </div>

                      {/* Poster */}
                      <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-700">
                        {rec.film.posterUrl ? (
                          <Image
                            src={rec.film.posterUrl}
                            alt={rec.film.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🎬
                          </div>
                        )}
                      </div>

                      {/* Film Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">
                            {rec.film.title}
                          </h4>
                          <RatingBadges film={rec.film} size="xs" className="flex-shrink-0" />
                        </div>
                        {rec.film.director && (
                          <p className="text-xs text-zinc-400 mt-1 truncate">
                            {rec.film.director}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                          <span>{rec.film.country}</span>
                          <span>•</span>
                          <span>{rec.film.language}</span>
                          <span>•</span>
                          <span>{formatDuration(rec.film.duration)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {rec.reason}
                          </span>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Footer Note */}
            <div className="mt-6 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
              <p className="text-xs text-zinc-500 text-center">
                💡 Schedule optimized to avoid conflicts with 30-minute breaks between films
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

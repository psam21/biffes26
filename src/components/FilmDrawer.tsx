"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Clock, Globe, Languages, Calendar, User, ChevronLeft, ChevronRight, ExternalLink, MapPin } from "@/lib/icons";
import { Film } from "@/types";
import { cn, formatDuration } from "@/lib/utils";
import { WatchlistButton } from "./WatchlistButton";
import { VENUE_NAMES, getScheduleTitleVariants } from "@/lib/constants";

interface Screening {
  date: string;
  dayLabel: string;
  time: string;
  venue: string;
  screen: string;
}

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
        director?: string;
        country?: string;
        year?: number;
        language?: string;
        duration?: number;
      }>;
    }>;
  }>;
  schedule: {
    venues: Record<string, { name: string; location: string; screens?: number }>;
  };
}

// Use centralized venue names (5.6)
const venueNames = VENUE_NAMES;

const drawerVenueColors: Record<string, string> = {
  cinepolis: "bg-blue-500/15 border-blue-500/30 text-blue-300",
  rajkumar: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  banashankari: "bg-green-500/15 border-green-500/30 text-green-300",
  openair: "bg-purple-500/15 border-purple-500/30 text-purple-300",
};

// Use centralized getScheduleTitleVariants from constants (5.2)

function getScreeningsForFilm(filmTitle: string, scheduleData?: ScheduleData): Screening[] {
  if (!scheduleData) return [];
  const screenings: Screening[] = [];
  
  // Get all possible title variants to search for
  const titleVariants = getScheduleTitleVariants(filmTitle);

  for (const day of scheduleData.days) {
    for (const screening of day.screenings) {
      for (const showing of screening.showings) {
        const showingTitle = showing.film.toUpperCase();
        const showingTitleNormalized = showingTitle
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        
        // Check if showing matches any of our title variants
        if (titleVariants.includes(showingTitle) || 
            titleVariants.includes(showingTitleNormalized)) {
          screenings.push({
            date: day.date,
            dayLabel: day.label,
            time: showing.time,
            venue: screening.venue,
            screen: screening.screen,
          });
        }
      }
    }
  }

  // Sort by date and time
  screenings.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  return screenings;
}

// Get next upcoming screening
function getNextScreening(screenings: Screening[]): { screening: Screening; isNow: boolean; isToday: boolean } | null {
  if (screenings.length === 0) return null;
  
  // Get current IST time
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const istTime = new Date(utcTime + istOffset);
  const todayIST = istTime.toISOString().split('T')[0];
  const currentMinutes = istTime.getHours() * 60 + istTime.getMinutes();
  
  for (const screening of screenings) {
    const [hours, mins] = screening.time.split(':').map(Number);
    const screeningMinutes = hours * 60 + mins;
    
    // Future date
    if (screening.date > todayIST) {
      return { screening, isNow: false, isToday: false };
    }
    
    // Today - check if it's upcoming or currently showing
    if (screening.date === todayIST) {
      // Assume 2 hour duration for "now showing" check
      if (currentMinutes >= screeningMinutes && currentMinutes < screeningMinutes + 120) {
        return { screening, isNow: true, isToday: true };
      }
      if (screeningMinutes > currentMinutes) {
        return { screening, isNow: false, isToday: true };
      }
    }
  }
  
  return null;
}

function formatScreenName(venue: string, screen: string): string {
  if (venue === "openair") return "Open Air";
  return `Screen ${screen}`;
}

interface FilmDrawerProps {
  film: Film | null;
  isOpen: boolean;
  onClose: () => void;
  // Navigation props
  films?: Film[];
  currentIndex?: number;
  onNavigate?: (film: Film, index: number) => void;
  // Schedule props for showing screenings
  scheduleData?: ScheduleData;
}

export function FilmDrawer({ 
  film, 
  isOpen, 
  onClose, 
  films = [],
  currentIndex = -1,
  onNavigate,
  scheduleData 
}: FilmDrawerProps) {
  const [hasError, setHasError] = useState(false);
  const [direction, setDirection] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < films.length - 1;

  // Compute screenings for current film
  const screenings = useMemo(() => {
    if (!film) return [];
    return getScreeningsForFilm(film.title, scheduleData);
  }, [film, scheduleData]);

  // Get next/current screening
  const nextScreeningInfo = useMemo(() => {
    return getNextScreening(screenings);
  }, [screenings]);

  // 2.3: Add bounds checking to navigation callbacks
  const navigatePrev = useCallback(() => {
    if (canGoPrev && onNavigate && currentIndex > 0 && currentIndex <= films.length) {
      const prevFilm = films[currentIndex - 1];
      if (prevFilm) {
        setDirection(-1);
        onNavigate(prevFilm, currentIndex - 1);
      }
    }
  }, [canGoPrev, onNavigate, films, currentIndex]);

  const navigateNext = useCallback(() => {
    if (canGoNext && onNavigate && currentIndex >= 0 && currentIndex < films.length - 1) {
      const nextFilm = films[currentIndex + 1];
      if (nextFilm) {
        setDirection(1);
        onNavigate(nextFilm, currentIndex + 1);
      }
    }
  }, [canGoNext, onNavigate, films, currentIndex]);

  // Track current image source with fallback logic
  const currentImgSrc = useMemo(() => {
    if (!film) return "";
    return hasError && film.posterUrlRemote ? film.posterUrlRemote : film.posterUrl;
  }, [film, hasError]);

  // Reset error state when film changes
  useEffect(() => {
    if (film) {
      requestAnimationFrame(() => setHasError(false));
    }
  }, [film]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && canGoPrev) {
        navigatePrev();
      } else if (e.key === "ArrowRight" && canGoNext) {
        navigateNext();
      } else if (e.key === "Tab") {
        // 2.5: Keyboard trap - keep focus within drawer
        const drawer = drawerRef.current;
        if (!drawer) return;
        
        const focusableElements = drawer.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      drawerRef.current?.focus();
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, canGoPrev, canGoNext, navigatePrev, navigateNext]);

  const handleImageError = () => {
    if (!hasError && film?.posterUrlRemote) {
      setHasError(true);
    }
  };

  if (!film) return null;

  const hasNavigation = films.length > 1 && onNavigate;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Drawer - 3.5: Remove key to prevent full remount on navigation */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction >= 0 ? "-30%" : "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}

            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Film details: ${film.title}`}
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-lg z-50",
              "bg-zinc-900 border-l border-zinc-800",
              "overflow-y-auto focus:outline-none"
            )}
          >
            {/* Navigation buttons */}
            {hasNavigation && (
              <>
                {canGoPrev && (
                  <button
                    onClick={navigatePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors"
                    aria-label="Previous film"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                )}
                {canGoNext && (
                  <button
                    onClick={navigateNext}
                    className="absolute right-14 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors"
                    aria-label="Next film"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                )}
              </>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close film details"
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Film counter */}
            {hasNavigation && (
              <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-xs text-white font-medium">
                  {currentIndex + 1} / {films.length}
                </span>
              </div>
            )}

            {/* Poster header */}
            <div className="relative aspect-video bg-zinc-800">
              {currentImgSrc ? (
                <Image
                  src={currentImgSrc}
                  alt={film.title}
                  fill
                  className="object-cover"
                  priority
                  onError={handleImageError}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-zinc-600 text-6xl">🎬</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
              
              {/* Swipe hint */}
              {hasNavigation && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                  <ChevronLeft className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] text-zinc-400">swipe</span>
                  <ChevronRight className="w-3 h-3 text-zinc-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Next/Current Screening Banner */}
              {nextScreeningInfo && (
                <div className={`-mx-6 -mt-6 px-6 py-3 ${
                  nextScreeningInfo.isNow 
                    ? "bg-green-500/20 border-b border-green-500/30" 
                    : nextScreeningInfo.isToday
                    ? "bg-amber-500/20 border-b border-amber-500/30"
                    : "bg-blue-500/20 border-b border-blue-500/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {nextScreeningInfo.isNow ? (
                        <span className="flex items-center gap-1.5 text-green-400 font-semibold text-sm">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          NOW SHOWING
                        </span>
                      ) : nextScreeningInfo.isToday ? (
                        <span className="text-amber-400 font-semibold text-sm">⏰ TODAY</span>
                      ) : (
                        <span className="text-blue-400 font-semibold text-sm">📅 NEXT</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{nextScreeningInfo.screening.time}</div>
                      <div className="text-xs text-zinc-400">
                        {nextScreeningInfo.isToday ? "" : nextScreeningInfo.screening.dayLabel.split(" - ")[0] + " • "}
                        {venueNames[nextScreeningInfo.screening.venue]}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Title and Watchlist button */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{film.title}</h2>
                  {film.kannadaTitle && (
                    <p className="text-sm text-zinc-400 mt-1">
                      {film.kannadaTitle}
                    </p>
                  )}
                  {film.originalTitle && film.originalTitle !== film.kannadaTitle && (
                    <p className="text-sm text-zinc-500 mt-1">
                      {film.originalTitle}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/film/${film.id}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm text-zinc-300 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Full Page</span>
                  </Link>
                  <WatchlistButton filmId={film.id} variant="full" />
                </div>
              </div>

              {/* Meta info grid */}
              <div className="grid grid-cols-2 gap-4">
                {film.director && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-zinc-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">
                        Director
                      </p>
                      <p className="text-sm text-white">{film.director}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Country
                    </p>
                    <p className="text-sm text-white">{film.country}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Languages className="w-5 h-5 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Language
                    </p>
                    <p className="text-sm text-white">{film.language}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Year
                    </p>
                    <p className="text-sm text-white">{film.year}</p>
                  </div>
                </div>

                {film.duration > 0 && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-zinc-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">
                        Duration
                      </p>
                      <p className="text-sm text-white">
                        {formatDuration(film.duration)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ratings Section */}
              {(film.imdbRating || film.rottenTomatoes || film.metacritic || film.letterboxdRating) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                    Ratings
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {film.imdbRating && (
                      <a
                        href={film.imdbId ? `https://www.imdb.com/title/${film.imdbId}` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-2 hover:bg-yellow-500/30 transition-colors"
                      >
                        <span className="text-yellow-500 font-bold text-lg">IMDb</span>
                        <span className="text-white font-semibold">{film.imdbRating}/10</span>
                      </a>
                    )}
                    {film.rottenTomatoes && (
                      <a
                        href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(film.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 hover:bg-red-500/30 transition-colors"
                      >
                        <span className="text-red-500 font-bold">🍅</span>
                        <span className="text-white font-semibold">{film.rottenTomatoes}</span>
                      </a>
                    )}
                    {film.metacritic && (
                      <a
                        href={`https://www.metacritic.com/search/${encodeURIComponent(film.title)}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2 hover:bg-green-500/30 transition-colors"
                      >
                        <span className="text-green-500 font-bold text-sm">MC</span>
                        <span className="text-white font-semibold">{film.metacritic}</span>
                      </a>
                    )}
                    {film.letterboxdRating && (
                      <a
                        href={`https://letterboxd.com/search/${encodeURIComponent(film.title)}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-lg px-3 py-2 hover:bg-orange-500/30 transition-colors"
                      >
                        <span className="text-orange-500 font-bold text-sm">LB</span>
                        <span className="text-white font-semibold">{film.letterboxdRating}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Screenings */}
              {screenings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Screenings ({screenings.length})
                  </h3>
                  <div className="grid gap-2">
                    {screenings.map((s, i) => (
                      <Link
                        key={i}
                        href={`/schedule?day=${s.date.replace(/-/g, "").slice(-4)}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors hover:opacity-80 ${drawerVenueColors[s.venue] || "bg-zinc-800 border-zinc-700 text-zinc-300"}`}
                      >
                        <div className="text-center min-w-[50px]">
                          <div className="text-base font-bold">{s.time}</div>
                          <div className="text-[10px] opacity-70">{s.dayLabel}</div>
                        </div>
                        <div className="h-6 w-px bg-current opacity-20" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{venueNames[s.venue] || s.venue}</div>
                          <div className="text-[10px] opacity-70">{formatScreenName(s.venue, s.screen)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Synopsis */}
              {film.synopsis && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                    Synopsis
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {film.synopsis}
                  </p>
                </div>
              )}

              {/* Cast */}
              {film.cast && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                    Cast
                  </h3>
                  <p className="text-sm text-zinc-300">{film.cast}</p>
                </div>
              )}

              {/* Crew Grid */}
              {(film.producer || film.screenplay || film.cinematography || film.editor || film.music || film.sound) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                    Crew
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {film.producer && (
                      <div>
                        <p className="text-xs text-zinc-500">Producer</p>
                        <p className="text-zinc-300">{film.producer}</p>
                      </div>
                    )}
                    {film.screenplay && (
                      <div>
                        <p className="text-xs text-zinc-500">Screenplay</p>
                        <p className="text-zinc-300">{film.screenplay}</p>
                      </div>
                    )}
                    {film.cinematography && (
                      <div>
                        <p className="text-xs text-zinc-500">Cinematography</p>
                        <p className="text-zinc-300">{film.cinematography}</p>
                      </div>
                    )}
                    {film.editor && (
                      <div>
                        <p className="text-xs text-zinc-500">Editor</p>
                        <p className="text-zinc-300">{film.editor}</p>
                      </div>
                    )}
                    {film.music && (
                      <div>
                        <p className="text-xs text-zinc-500">Music</p>
                        <p className="text-zinc-300">{film.music}</p>
                      </div>
                    )}
                    {film.sound && (
                      <div>
                        <p className="text-xs text-zinc-500">Sound</p>
                        <p className="text-zinc-300">{film.sound}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Awards */}
              {(film.awardsWon || film.awardsNominated) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                    🏆 Awards & Festivals
                  </h3>
                  {film.awardsWon && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-xs text-yellow-500 font-semibold mb-1">Winner</p>
                      <p className="text-sm text-zinc-300">{film.awardsWon}</p>
                    </div>
                  )}
                  {film.awardsNominated && (
                    <div className="bg-zinc-800 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 font-semibold mb-1">Official Selection / Nominations</p>
                      <p className="text-sm text-zinc-400">{film.awardsNominated}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Film Courtesy */}
              {film.filmCourtesy && (
                <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                  Film courtesy: {film.filmCourtesy}
                </div>
              )}

              {/* Premiere badges */}
              <div className="flex flex-wrap gap-2">
                {film.isWorldPremiere && (
                  <span className="badge-premiere px-3 py-1 rounded-full text-xs font-semibold">
                    World Premiere
                  </span>
                )}
                {film.isAsiaPremiere && (
                  <span className="badge-premiere px-3 py-1 rounded-full text-xs font-semibold">
                    Asia Premiere
                  </span>
                )}
                {film.isIndiaPremiere && (
                  <span className="badge-premiere px-3 py-1 rounded-full text-xs font-semibold">
                    India Premiere
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

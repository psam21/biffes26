"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import Image from "next/image";
import { X, Clock, Globe, Languages, Calendar, User, ChevronLeft, ChevronRight } from "@/lib/icons";
import { Film } from "@/types";
import { cn, formatDuration } from "@/lib/utils";
import { WatchlistButton } from "./WatchlistButton";

interface FilmDrawerProps {
  film: Film | null;
  isOpen: boolean;
  onClose: () => void;
  // Navigation props
  films?: Film[];
  currentIndex?: number;
  onNavigate?: (film: Film, index: number) => void;
}

export function FilmDrawer({ 
  film, 
  isOpen, 
  onClose, 
  films = [],
  currentIndex = -1,
  onNavigate 
}: FilmDrawerProps) {
  const [hasError, setHasError] = useState(false);
  const [direction, setDirection] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < films.length - 1;

  const navigatePrev = useCallback(() => {
    if (canGoPrev && onNavigate) {
      setDirection(-1);
      onNavigate(films[currentIndex - 1], currentIndex - 1);
    }
  }, [canGoPrev, onNavigate, films, currentIndex]);

  const navigateNext = useCallback(() => {
    if (canGoNext && onNavigate) {
      setDirection(1);
      onNavigate(films[currentIndex + 1], currentIndex + 1);
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

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = 0.5;
    
    if (info.offset.x > threshold || info.velocity.x > velocity) {
      // Swiped right -> go to previous
      if (canGoPrev) navigatePrev();
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Swiped left -> go to next
      if (canGoNext) navigateNext();
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

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            key={film.id}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction >= 0 ? "-30%" : "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag={hasNavigation ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Film details: ${film.title}`}
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-lg z-50",
              "bg-zinc-900 border-l border-zinc-800",
              "overflow-y-auto focus:outline-none",
              hasNavigation && "cursor-grab active:cursor-grabbing"
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
                <WatchlistButton filmId={film.id} variant="full" />
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

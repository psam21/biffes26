"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Clock, Globe, Languages, Calendar, User } from "lucide-react";
import { Film } from "@/types";
import { cn, formatDuration } from "@/lib/utils";

interface FilmDrawerProps {
  film: Film | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FilmDrawer({ film, isOpen, onClose }: FilmDrawerProps) {
  const [imgSrc, setImgSrc] = useState(film?.posterUrl || "");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (film) {
      setImgSrc(film.posterUrl);
      setHasError(false);
    }
  }, [film]);

  const handleImageError = () => {
    if (!hasError && film?.posterUrlRemote) {
      setImgSrc(film.posterUrlRemote);
      setHasError(true);
    }
  };

  if (!film) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-lg z-50",
              "bg-zinc-900 border-l border-zinc-800",
              "overflow-y-auto"
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Poster header */}
            <div className="relative aspect-video bg-zinc-800">
              {imgSrc ? (
                <Image
                  src={imgSrc}
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
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-white">{film.title}</h2>
                {film.originalTitle && (
                  <p className="text-sm text-zinc-400 mt-1">
                    {film.originalTitle}
                  </p>
                )}
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
                      <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2">
                        <span className="text-red-500 font-bold">🍅</span>
                        <span className="text-white font-semibold">{film.rottenTomatoes}</span>
                      </div>
                    )}
                    {film.metacritic && (
                      <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                        <span className="text-green-500 font-bold text-sm">MC</span>
                        <span className="text-white font-semibold">{film.metacritic}</span>
                      </div>
                    )}
                    {film.letterboxdRating && (
                      <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-lg px-3 py-2">
                        <span className="text-orange-500 font-bold text-sm">LB</span>
                        <span className="text-white font-semibold">{film.letterboxdRating}</span>
                      </div>
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

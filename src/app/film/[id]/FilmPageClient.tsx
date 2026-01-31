"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Globe, Languages, Calendar, User, ExternalLink } from "@/lib/icons";
import { Film, Category } from "@/types";
import { formatDuration } from "@/lib/utils";
import { WatchlistButton } from "@/components/WatchlistButton";
import { RatingBadges } from "@/components/RatingBadges";

interface Screening {
  date: string;
  dayLabel: string;
  time: string;
  venue: string;
  screen: string;
}

interface FilmPageClientProps {
  film: Film;
  category?: Category;
  allFilms: Film[];
  screenings: Screening[];
}

const venueNames: Record<string, string> = {
  cinepolis: "LuLu Mall",
  rajkumar: "Dr. Rajkumar Bhavana",
  banashankari: "Suchitra Cinema",
  openair: "Open Air @ LuLu",
};

const venueColors: Record<string, string> = {
  cinepolis: "bg-blue-500/20 border-blue-500/30 text-blue-300",
  rajkumar: "bg-amber-500/20 border-amber-500/30 text-amber-300",
  banashankari: "bg-green-500/20 border-green-500/30 text-green-300",
  openair: "bg-purple-500/20 border-purple-500/30 text-purple-300",
};

function formatScreeningDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

function formatScreenName(venue: string, screen: string): string {
  if (venue === "openair") return "Open Air";
  if (screen === "Open Forum") return "Open Forum";
  return `Screen ${screen}`;
}

export function FilmPageClient({ film, category, allFilms, screenings }: FilmPageClientProps) {
  const [hasError, setHasError] = useState(false);

  const currentImgSrc = hasError && film.posterUrlRemote ? film.posterUrlRemote : film.posterUrl;

  // Get related films from same category
  const relatedFilms = allFilms
    .filter((f) => f.categoryId === film.categoryId && f.id !== film.id)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Festival</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-[300px_1fr] gap-8"
        >
          {/* Poster */}
          <div className="space-y-4">
            <div className="relative aspect-[2/3] bg-zinc-800 rounded-xl overflow-hidden shadow-2xl">
              {currentImgSrc ? (
                <Image
                  src={currentImgSrc}
                  alt={film.title}
                  fill
                  className="object-cover"
                  priority
                  onError={() => !hasError && film.posterUrlRemote && setHasError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-zinc-600 text-8xl">🎬</span>
                </div>
              )}
            </div>

            {/* Watchlist Button */}
            <WatchlistButton filmId={film.id} variant="full" className="w-full" />

            {/* Ratings */}
            {(film.imdbRating || film.rottenTomatoes || film.metacritic || film.letterboxdRating) && (
              <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                  Ratings
                </h3>
                <div className="flex flex-wrap gap-2">
                  {film.imdbRating && (
                    <a
                      href={film.imdbId ? `https://www.imdb.com/title/${film.imdbId}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-2 hover:bg-yellow-500/30 transition-colors"
                    >
                      <span className="text-yellow-500 font-bold">IMDb</span>
                      <span className="text-white font-semibold">{film.imdbRating}</span>
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
                      className="flex items-center gap-2 bg-amber-600/20 border border-amber-600/30 rounded-lg px-3 py-2 hover:bg-amber-600/30 transition-colors"
                    >
                      <span className="text-amber-500 font-bold text-sm">MC</span>
                      <span className="text-white font-semibold">{film.metacritic}</span>
                    </a>
                  )}
                  {film.letterboxdRating && (
                    <a
                      href={`https://letterboxd.com/search/${encodeURIComponent(film.title)}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2 hover:bg-green-500/30 transition-colors"
                    >
                      <span className="text-green-500 font-bold text-sm">LB</span>
                      <span className="text-white font-semibold">{film.letterboxdRating}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category Badge */}
            {category && (
              <Link
                href={`/#${category.slug}`}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-yellow-500 hover:text-yellow-400 transition-colors"
              >
                {category.name}
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}

            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{film.title}</h1>
              {film.kannadaTitle && (
                <p className="text-lg text-zinc-400 mt-2">{film.kannadaTitle}</p>
              )}
              {film.originalTitle && film.originalTitle !== film.kannadaTitle && (
                <p className="text-base text-zinc-500 mt-1">{film.originalTitle}</p>
              )}
            </div>

            {/* Premiere badges */}
            {(film.isWorldPremiere || film.isAsiaPremiere || film.isIndiaPremiere) && (
              <div className="flex flex-wrap gap-2">
                {film.isWorldPremiere && (
                  <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                    🌍 World Premiere
                  </span>
                )}
                {film.isAsiaPremiere && (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    🌏 Asia Premiere
                  </span>
                )}
                {film.isIndiaPremiere && (
                  <span className="bg-gradient-to-r from-orange-500 to-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    🇮🇳 India Premiere
                  </span>
                )}
              </div>
            )}

            {/* Meta info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-zinc-900/50 rounded-xl p-4">
              {film.director && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Director</p>
                    <p className="text-sm text-white">{film.director}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-zinc-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Country</p>
                  <p className="text-sm text-white">{film.country}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Languages className="w-5 h-5 text-zinc-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Language</p>
                  <p className="text-sm text-white">{film.language}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-zinc-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Year</p>
                  <p className="text-sm text-white">{film.year}</p>
                </div>
              </div>

              {film.duration > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Duration</p>
                    <p className="text-sm text-white">{formatDuration(film.duration)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Screenings */}
            {screenings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Screenings ({screenings.length})
                </h3>
                <div className="grid gap-2">
                  {screenings.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border ${venueColors[s.venue] || "bg-zinc-800 border-zinc-700 text-zinc-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[60px]">
                          <div className="text-lg font-bold">{s.time}</div>
                          <div className="text-xs opacity-70">{formatScreeningDate(s.date)}</div>
                        </div>
                        <div className="h-8 w-px bg-current opacity-20" />
                        <div>
                          <div className="font-medium">{venueNames[s.venue] || s.venue}</div>
                          <div className="text-xs opacity-70">{formatScreenName(s.venue, s.screen)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {screenings.length === 0 && (
              <div className="bg-zinc-900/50 rounded-lg p-4 text-center">
                <p className="text-zinc-500 text-sm">No scheduled screenings found</p>
              </div>
            )}

            {/* Synopsis */}
            {film.synopsis && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                  Synopsis
                </h3>
                <p className="text-zinc-300 leading-relaxed">{film.synopsis}</p>
              </div>
            )}

            {/* Cast */}
            {film.cast && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                  Cast
                </h3>
                <p className="text-zinc-300">{film.cast}</p>
              </div>
            )}

            {/* Crew Grid */}
            {(film.producer || film.screenplay || film.cinematography || film.editor || film.music || film.sound) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                  Crew
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
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
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                  🏆 Awards & Festivals
                </h3>
                {film.awardsWon && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-xs text-yellow-500 font-semibold mb-1">Winner</p>
                    <p className="text-sm text-zinc-300">{film.awardsWon}</p>
                  </div>
                )}
                {film.awardsNominated && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 font-semibold mb-1">
                      Official Selection / Nominations
                    </p>
                    <p className="text-sm text-zinc-400">{film.awardsNominated}</p>
                  </div>
                )}
              </div>
            )}

            {/* Film Courtesy */}
            {film.filmCourtesy && (
              <div className="text-sm text-zinc-500 pt-4 border-t border-zinc-800">
                Film courtesy: {film.filmCourtesy}
              </div>
            )}
          </div>
        </motion.div>

        {/* Related Films */}
        {relatedFilms.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-xl font-bold text-white">
              More from {category?.name || "This Category"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedFilms.map((relatedFilm) => (
                <Link
                  key={relatedFilm.id}
                  href={`/film/${relatedFilm.id}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden">
                    {relatedFilm.posterUrl ? (
                      <Image
                        src={relatedFilm.posterUrl}
                        alt={relatedFilm.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-zinc-600 text-4xl">🎬</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="mt-2 text-sm text-zinc-300 group-hover:text-white transition-colors line-clamp-2">
                    {relatedFilm.title}
                  </p>
                  <RatingBadges film={relatedFilm} size="xs" className="mt-1" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

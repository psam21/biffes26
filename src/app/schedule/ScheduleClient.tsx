"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Film } from "@/types";
import { RatingBadges } from "@/components/RatingBadges";
import { WatchlistButton } from "@/components/WatchlistButton";

// Lazy load FilmDrawer - only loaded when user clicks a film
const FilmDrawer = dynamic(() => import("@/components/FilmDrawer").then(m => ({ default: m.FilmDrawer })), {
  ssr: false,
  loading: () => null,
});

interface Showing {
  time: string;
  film: string;
  director: string;
  country: string;
  year: number;
  language: string;
  duration: number;
  special?: string;
  filmId?: string;
}

interface ScreenSchedule {
  venue: string;
  screen: string;
  showings: Showing[];
}

interface ForumEvent {
  time: string;
  title: string;
  type: string;
}

interface DaySchedule {
  date: string;
  dayNumber: number;
  label: string;
  screenings: ScreenSchedule[];
  forum: ForumEvent[];
}

interface ScheduleData {
  days: DaySchedule[];
  schedule: {
    venues: Record<string, { name: string; location: string; screens?: number }>;
    lastUpdated: string;
  };
}

interface ScheduleClientProps {
  scheduleData: ScheduleData;
  films: Film[];
}

const venueColors: Record<string, { bg: string; border: string; text: string }> = {
  cinepolis: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  rajkumar: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  banashankari: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
  openair: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
};

const venueIcons: Record<string, string> = {
  cinepolis: "🎬",
  rajkumar: "🏛️",
  banashankari: "🎭",
  openair: "🌙",
};

export default function ScheduleClient({ scheduleData, films }: ScheduleClientProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"compact" | "cards">("cards");
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const days = scheduleData.days;
  const venues = scheduleData.schedule.venues;

  // Create a mapping from film title (uppercase) to Film object
  const filmsByTitle = useMemo(() => {
    const map = new Map<string, Film>();
    films.forEach(film => {
      map.set(film.title.toUpperCase(), film);
    });
    return map;
  }, [films]);

  const currentDay = days[selectedDay];

  // Handle film click - navigate to film page
  const handleFilmClick = useCallback((filmTitle: string, openInNewTab = false) => {
    const film = filmsByTitle.get(filmTitle.toUpperCase());
    if (film) {
      if (openInNewTab) {
        window.open(`/film/${film.id}`, '_blank');
      } else {
        setSelectedFilm(film);
        setIsDrawerOpen(true);
      }
    }
  }, [filmsByTitle]);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedFilm(null), 300);
  }, []);

  // Filter screenings based on venue and search
  const filteredScreenings = useMemo(() => {
    let screenings = currentDay.screenings;
    
    if (selectedVenue) {
      screenings = screenings.filter(s => s.venue === selectedVenue);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      screenings = screenings.map(screen => ({
        ...screen,
        showings: screen.showings.filter(showing =>
          showing.film.toLowerCase().includes(query) ||
          showing.director?.toLowerCase().includes(query) ||
          showing.country?.toLowerCase().includes(query) ||
          showing.language?.toLowerCase().includes(query)
        )
      })).filter(screen => screen.showings.length > 0);
    }
    
    return screenings;
  }, [currentDay, selectedVenue, searchQuery]);

  // Group by venue for display
  const screeningsByVenue = useMemo(() => {
    const grouped: Record<string, ScreenSchedule[]> = {};
    filteredScreenings.forEach(screen => {
      if (!grouped[screen.venue]) grouped[screen.venue] = [];
      grouped[screen.venue].push(screen);
    });
    Object.values(grouped).forEach(screens => {
      screens.sort((a, b) => parseInt(a.screen) - parseInt(b.screen));
    });
    return grouped;
  }, [filteredScreenings]);

  const formatDuration = (mins: number) => {
    if (!mins) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
  };

  const getShowingAtTime = (screen: ScreenSchedule, time: string): Showing | null => {
    for (const showing of screen.showings) {
      if (showing.time === time) return showing;
    }
    return null;
  };

  const isTimeOccupied = (screen: ScreenSchedule, time: string): { occupied: boolean; showing?: Showing } => {
    const timeMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    
    for (const showing of screen.showings) {
      const showingStart = parseInt(showing.time.split(":")[0]) * 60 + parseInt(showing.time.split(":")[1]);
      const showingEnd = showingStart + (showing.duration || 120);
      
      if (timeMinutes > showingStart && timeMinutes < showingEnd) {
        return { occupied: true, showing };
      }
    }
    return { occupied: false };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back to Films</span>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              BIFFes 2026 Schedule
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("compact")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "compact" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
                title="Compact View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "cards" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
                title="Cards View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Day Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {days.map((day, index) => (
              <button
                key={day.date}
                onClick={() => setSelectedDay(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedDay === index
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <span className="block">{day.label.split(" - ")[0]}</span>
                <span className="block text-xs opacity-70">
                  {new Date(day.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-[120px] z-40 bg-gray-900/90 backdrop-blur-md border-b border-white/5 py-3 px-4">
        <div className="max-w-[1800px] mx-auto flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Search films, directors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2 pl-10 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedVenue(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !selectedVenue ? "bg-white/20 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              All Venues
            </button>
            {Object.entries(venues).map(([key, venue]) => (
              <button
                key={key}
                onClick={() => setSelectedVenue(selectedVenue === key ? null : key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  selectedVenue === key ? "bg-white/20 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <span>{venueIcons[key]}</span>
                <span>{venue.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-white/60">
          <span>📅 {currentDay.label}</span>
          <span>🎬 {filteredScreenings.reduce((acc, s) => acc + s.showings.length, 0)} screenings</span>
          <span>🏢 {new Set(filteredScreenings.map(s => s.venue)).size} venues</span>
        </div>

        {/* Forum Events */}
        {currentDay.forum && currentDay.forum.length > 0 && !selectedVenue && !searchQuery && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎤</span> Forum Events @ LuLu Mall UG Floor
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {currentDay.forum.map((event, idx) => (
                <div key={idx} className="bg-gradient-to-br from-pink-500/20 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
                  <div className="text-xs text-pink-400 font-medium mb-1">{event.time} • {event.type}</div>
                  <div className="font-medium text-white text-sm">{event.title}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {viewMode === "compact" ? (
            <motion.div
              key="compact-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {Object.entries(screeningsByVenue).map(([venueKey, screens]) => {
                // Get venue colors
                const colors = venueColors[venueKey] || { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400" };
                
                // Flatten all showings with screen info and sort by time
                const allShowings = screens.flatMap(screen => 
                  screen.showings.map(showing => ({
                    ...showing,
                    screen: screen.screen,
                  }))
                ).sort((a, b) => a.time.localeCompare(b.time));
                
                // Group by time slot
                const showingsByTime = allShowings.reduce((acc, showing) => {
                  if (!acc[showing.time]) acc[showing.time] = [];
                  acc[showing.time].push(showing);
                  return acc;
                }, {} as Record<string, typeof allShowings>);
                
                return (
                  <div key={venueKey} className="rounded-xl overflow-hidden border border-white/10">
                    {/* Venue Header */}
                    <div className={`px-4 py-2 ${colors.bg} border-b ${colors.border} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{venueIcons[venueKey]}</span>
                        <span className={`font-bold ${colors.text}`}>
                          {venues[venueKey as keyof typeof venues]?.name || venueKey}
                        </span>
                      </div>
                      <span className="text-xs text-white/50">
                        {venues[venueKey as keyof typeof venues]?.location || ""}
                      </span>
                    </div>
                    
                    {/* Compact List by Time */}
                    <div className="divide-y divide-white/10">
                      {Object.entries(showingsByTime).map(([time, showings]) => (
                        <div key={time} className="flex flex-col sm:flex-row">
                          {/* Time Column */}
                          <div className="w-full sm:w-20 flex-shrink-0 py-3 px-4 bg-black/30 sm:border-r border-b sm:border-b-0 border-white/10">
                            <span className="font-mono font-bold text-yellow-400 text-base">{time}</span>
                          </div>
                          {/* Films at this time - now as mini cards */}
                          <div className="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {showings.map((showing, idx) => {
                              const hasFilmData = filmsByTitle.has(showing.film.toUpperCase());
                              const filmData = filmsByTitle.get(showing.film.toUpperCase());
                              return (
                                <div 
                                  key={idx}
                                  className={`${colors.bg} ${colors.border} border rounded-lg p-3 relative group ${hasFilmData ? "cursor-pointer hover:bg-white/10 transition-colors" : ""}`}
                                  onClick={() => hasFilmData && handleFilmClick(showing.film)}
                                  role={hasFilmData ? "button" : undefined}
                                  tabIndex={hasFilmData ? 0 : undefined}
                                  onKeyDown={(e) => hasFilmData && e.key === "Enter" && handleFilmClick(showing.film)}
                                >
                                  {/* Watchlist button */}
                                  {filmData && (
                                    <div 
                                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <WatchlistButton filmId={filmData.id} />
                                    </div>
                                  )}
                                  {/* Screen badge */}
                                  {venueKey !== "openair" && (
                                    <span className={`text-[10px] ${colors.text} font-bold uppercase tracking-wide`}>
                                      Screen {showing.screen}
                                    </span>
                                  )}
                                  {/* Film title */}
                                  <h4 className="font-semibold text-white text-sm mt-1 leading-tight">
                                    {showing.film}
                                  </h4>
                                  {/* Director */}
                                  {showing.director && (
                                    <p className="text-xs text-white/60 mt-1 truncate">
                                      Dir: {showing.director}
                                    </p>
                                  )}
                                  {/* Ratings */}
                                  {filmData && (filmData.imdbRating || filmData.rottenTomatoes || filmData.letterboxdRating) && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {filmData.imdbRating && <span className="text-[9px] bg-yellow-500/80 text-black px-1.5 py-0.5 rounded font-bold">IMDb {filmData.imdbRating}</span>}
                                      {filmData.rottenTomatoes && <span className="text-[9px] bg-red-500/80 text-white px-1.5 py-0.5 rounded">🍅 {filmData.rottenTomatoes}</span>}
                                      {filmData.letterboxdRating && <span className="text-[9px] bg-green-500/80 text-black px-1.5 py-0.5 rounded font-bold">LB {filmData.letterboxdRating}</span>}
                                    </div>
                                  )}
                                  {/* Meta info */}
                                  <div className="flex flex-wrap gap-x-2 mt-2 text-[10px] text-white/50">
                                    <span>{showing.country}</span>
                                    <span>•</span>
                                    <span>{showing.language}</span>
                                    <span>•</span>
                                    <span>{showing.duration}&apos;</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="cards-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {Object.entries(screeningsByVenue).map(([venueKey, screens]) => (
                <div key={venueKey}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>{venueIcons[venueKey]}</span>
                    {venues[venueKey as keyof typeof venues]?.name || venueKey}
                    <span className="text-xs text-white/40 font-normal">
                      ({venues[venueKey as keyof typeof venues]?.location || ""})
                    </span>
                  </h2>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {screens.map((screen) => {
                      const screenId = `${venueKey}-${screen.screen}`;
                      
                      return (
                        <motion.div
                          key={screenId}
                          layout
                          className={`${venueColors[venueKey]?.bg || "bg-white/5"} ${venueColors[venueKey]?.border || "border-white/10"} border rounded-xl overflow-hidden`}
                        >
                          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <span className={`font-semibold ${venueColors[venueKey]?.text || "text-white"}`}>
                              {venueKey === "openair" ? "Open Air" : `Screen ${screen.screen}`}
                            </span>
                            <span className="text-xs text-white/50">
                              {screen.showings.length} shows
                            </span>
                          </div>
                          
                          <div className="divide-y divide-white/5">
                            {screen.showings.map((showing, idx) => {
                              const hasFilmData = filmsByTitle.has(showing.film.toUpperCase());
                              const filmData = filmsByTitle.get(showing.film.toUpperCase());
                              return (
                                <div
                                  key={idx}
                                  className={`p-3 transition-colors relative group ${
                                    showing.special ? "bg-yellow-500/10 border-l-2 border-yellow-400" : ""
                                  } ${hasFilmData ? "hover:bg-white/10 cursor-pointer" : "hover:bg-white/5"}`}
                                  onClick={() => hasFilmData && handleFilmClick(showing.film)}
                                  role={hasFilmData ? "button" : undefined}
                                  tabIndex={hasFilmData ? 0 : undefined}
                                  onKeyDown={(e) => hasFilmData && e.key === "Enter" && handleFilmClick(showing.film)}
                                >
                                  {/* Watchlist button */}
                                  {filmData && (
                                    <div 
                                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <WatchlistButton filmId={filmData.id} />
                                    </div>
                                  )}
                                  <div className="flex items-start gap-3">
                                    <div className="text-sm font-mono font-bold text-yellow-400 w-14 flex-shrink-0">
                                      {showing.time}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={`font-medium text-white text-sm leading-tight ${hasFilmData ? "hover:text-yellow-400" : ""}`} title={showing.film}>
                                        {showing.film}
                                        {hasFilmData && <span className="ml-1 text-[10px] text-yellow-400/60">↗</span>}
                                        {showing.special && (
                                          <span className="ml-2 text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold">
                                            {showing.special}
                                          </span>
                                        )}
                                      </div>
                                      {showing.director && (
                                        <div className="text-xs text-white/50 mt-0.5">
                                          {showing.director}
                                        </div>
                                      )}
                                      {filmData && <RatingBadges film={filmData} size="xs" className="mt-1 flex-row flex-wrap" />}
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40 flex-wrap">
                                        {showing.country && <span>{showing.country}</span>}
                                        {showing.year > 0 && <span>• {showing.year}</span>}
                                        {showing.language && <span>• {showing.language}</span>}
                                        {showing.duration > 0 && <span>• {formatDuration(showing.duration)}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {filteredScreenings.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <div className="text-4xl mb-4">🎬</div>
            <p>No screenings found matching your criteria</p>
          </div>
        )}
      </main>

      {/* Legend */}
      <div className="border-t border-white/10 py-4 px-4 bg-gray-900/50">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-wrap gap-4 text-xs text-white/50 justify-center">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${venueColors.cinepolis.bg} ${venueColors.cinepolis.border} border`}></div>
              <span>Cinepolis (LuLu Mall)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${venueColors.rajkumar.bg} ${venueColors.rajkumar.border} border`}></div>
              <span>Dr Rajkumar Bhavana</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${venueColors.banashankari.bg} ${venueColors.banashankari.border} border`}></div>
              <span>Suchitra (Banashankari)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${venueColors.openair.bg} ${venueColors.openair.border} border`}></div>
              <span>Open Air (7 PM daily)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4">
        <div className="max-w-[1800px] mx-auto text-center text-sm text-white/40">
          <p>Schedule data from official BIFFes 2026 program (Version 4)</p>
          <p className="mt-1">Subject to change • Last updated: {new Date(scheduleData.schedule.lastUpdated).toLocaleDateString()}</p>
        </div>
      </footer>

      {/* Film Detail Drawer */}
      <FilmDrawer
        film={selectedFilm}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}

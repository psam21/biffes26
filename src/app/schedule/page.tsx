"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import scheduleData from "@/data/schedule_data.json";
import festivalData from "@/data/biffes_data.json";
import Link from "next/link";
import { FilmDrawer } from "@/components/FilmDrawer";
import { Film } from "@/types";

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

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const days = scheduleData.days as DaySchedule[];
  const venues = scheduleData.schedule.venues;
  const films = festivalData.films as Film[];

  // Create a mapping from film title (uppercase) to Film object
  const filmsByTitle = useMemo(() => {
    const map = new Map<string, Film>();
    films.forEach(film => {
      // Store by uppercase title for matching with schedule data
      map.set(film.title.toUpperCase(), film);
    });
    return map;
  }, [films]);

  const currentDay = days[selectedDay];

  // Handle film click
  const handleFilmClick = useCallback((filmTitle: string) => {
    const film = filmsByTitle.get(filmTitle.toUpperCase());
    if (film) {
      setSelectedFilm(film);
      setIsDrawerOpen(true);
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
    // Sort screens within each venue
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

  // Find showing at a specific time for a screen
  const getShowingAtTime = (screen: ScreenSchedule, time: string): Showing | null => {
    for (const showing of screen.showings) {
      if (showing.time === time) return showing;
    }
    return null;
  };

  // Check if a time slot is occupied by an ongoing film
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
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "table" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
                title="Table View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
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
          {/* Search */}
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
          
          {/* Venue Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedVenue(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !selectedVenue
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              All Venues
            </button>
            {Object.entries(venues).map(([key, venue]) => (
              <button
                key={key}
                onClick={() => setSelectedVenue(selectedVenue === key ? null : key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  selectedVenue === key
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
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
        {/* Stats Bar */}
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
          {viewMode === "table" ? (
            /* TABLE VIEW - Like the PDF with screens as rows */
            <motion.div
              key="table-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {Object.entries(screeningsByVenue).map(([venueKey, screens]) => {
                // Get all unique times for this venue
                const venueTimes = new Set<string>();
                screens.forEach(s => s.showings.forEach(sh => venueTimes.add(sh.time)));
                const sortedTimes = Array.from(venueTimes).sort();
                
                return (
                  <div key={venueKey} className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 sticky top-[180px] bg-gray-900/95 py-2 z-30">
                      <span>{venueIcons[venueKey]}</span>
                      {venues[venueKey as keyof typeof venues]?.name || venueKey}
                      <span className="text-xs text-white/40 font-normal">
                        ({venues[venueKey as keyof typeof venues]?.location || ""})
                      </span>
                    </h2>
                    
                    <div className="overflow-x-auto -mx-4 px-4 pb-4">
                      <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className={`text-left py-2 px-3 text-sm font-semibold ${venueColors[venueKey]?.text || "text-white"} bg-gray-800/80 sticky left-0 z-10 min-w-[100px]`}>
                              Screen
                            </th>
                            {sortedTimes.map(time => (
                              <th key={time} className="text-center py-2 px-2 text-xs font-mono text-yellow-400/80 bg-gray-800/80 min-w-[150px]">
                                {time}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {screens.map((screen) => (
                            <tr key={`${venueKey}-${screen.screen}`} className="border-b border-white/5">
                              <td className={`py-2 px-3 font-semibold ${venueColors[venueKey]?.text || "text-white"} ${venueColors[venueKey]?.bg || ""} sticky left-0 z-10 bg-gray-900`}>
                                {venueKey === "openair" ? "Open Air" : `Screen ${screen.screen}`}
                              </td>
                              {sortedTimes.map(time => {
                                const showing = getShowingAtTime(screen, time);
                                const occupied = isTimeOccupied(screen, time);
                                
                                if (showing) {
                                  const hasFilmData = filmsByTitle.has(showing.film.toUpperCase());
                                  return (
                                    <td key={time} className="py-2 px-2 align-top">
                                      <div 
                                        className={`${venueColors[venueKey]?.bg || "bg-white/5"} ${venueColors[venueKey]?.border || "border-white/10"} border rounded-lg p-2 transition-colors ${hasFilmData ? "hover:bg-white/20 cursor-pointer hover:scale-[1.02] transform" : "cursor-default hover:bg-white/10"}`}
                                        onClick={() => hasFilmData && handleFilmClick(showing.film)}
                                        role={hasFilmData ? "button" : undefined}
                                        tabIndex={hasFilmData ? 0 : undefined}
                                        onKeyDown={(e) => hasFilmData && e.key === "Enter" && handleFilmClick(showing.film)}
                                      >
                                        <div className={`font-medium text-white text-xs leading-tight mb-1 ${hasFilmData ? "hover:text-yellow-400" : ""}`} title={showing.film}>
                                          {showing.film.length > 28 ? showing.film.slice(0, 28) + "…" : showing.film}
                                          {hasFilmData && <span className="ml-1 text-yellow-400/60">↗</span>}
                                        </div>
                                        {showing.director && (
                                          <div className="text-[10px] text-white/50 mb-1 truncate" title={showing.director}>
                                            {showing.director}
                                          </div>
                                        )}
                                        <div className="flex flex-wrap gap-1 text-[9px] text-white/40">
                                          {showing.language && <span className="bg-white/10 px-1 rounded">{showing.language}</span>}
                                          {showing.duration > 0 && <span className="bg-white/10 px-1 rounded">{formatDuration(showing.duration)}</span>}
                                          {showing.year > 0 && <span className="bg-white/10 px-1 rounded">{showing.year}</span>}
                                        </div>
                                      </div>
                                    </td>
                                  );
                                } else if (occupied.occupied) {
                                  return (
                                    <td key={time} className="py-2 px-2">
                                      <div className="h-full min-h-[70px] bg-white/5 rounded-lg border border-dashed border-white/10 flex items-center justify-center">
                                        <span className="text-[10px] text-white/20 italic">↑ ongoing</span>
                                      </div>
                                    </td>
                                  );
                                }
                                return (
                                  <td key={time} className="py-2 px-2">
                                    <div className="h-full min-h-[70px]"></div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            /* LIST VIEW - All cards expanded */
            <motion.div
              key="list-view"
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
                              return (
                                <div
                                  key={idx}
                                  className={`p-3 transition-colors ${
                                    showing.special ? "bg-yellow-500/10 border-l-2 border-yellow-400" : ""
                                  } ${hasFilmData ? "hover:bg-white/10 cursor-pointer" : "hover:bg-white/5"}`}
                                  onClick={() => hasFilmData && handleFilmClick(showing.film)}
                                  role={hasFilmData ? "button" : undefined}
                                  tabIndex={hasFilmData ? 0 : undefined}
                                  onKeyDown={(e) => hasFilmData && e.key === "Enter" && handleFilmClick(showing.film)}
                                >
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

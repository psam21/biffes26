"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import scheduleData from "@/data/schedule_data.json";
import Link from "next/link";

interface Showing {
  time: string;
  film: string;
  director: string;
  country: string;
  year: number;
  language: string;
  duration: number;
  special?: string;
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

const venueColors: Record<string, string> = {
  cinepolis: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  rajkumar: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  banashankari: "from-green-500/20 to-green-600/10 border-green-500/30",
  openair: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
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
  const [expandedScreens, setExpandedScreens] = useState<Set<string>>(new Set());

  const days = scheduleData.days as DaySchedule[];
  const venues = scheduleData.schedule.venues;

  const currentDay = days[selectedDay];

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
          showing.director.toLowerCase().includes(query) ||
          showing.country.toLowerCase().includes(query) ||
          showing.language.toLowerCase().includes(query)
        )
      })).filter(screen => screen.showings.length > 0);
    }
    
    return screenings;
  }, [currentDay, selectedVenue, searchQuery]);

  const toggleScreen = (screenId: string) => {
    setExpandedScreens(prev => {
      const next = new Set(prev);
      if (next.has(screenId)) {
        next.delete(screenId);
      } else {
        next.add(screenId);
      }
      return next;
    });
  };

  const formatDuration = (mins: number) => {
    if (!mins) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
            <div className="w-20" /> {/* Spacer for centering */}
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
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
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
      <main className="max-w-7xl mx-auto px-4 py-6">
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
              <span>🎤</span> Forum Events
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {currentDay.forum.map((event, idx) => (
                <div key={idx} className="bg-gradient-to-br from-pink-500/20 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
                  <div className="text-xs text-pink-400 font-medium mb-1">{event.time} • {event.type}</div>
                  <div className="font-medium text-white">{event.title}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Screenings by Venue */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedDay}-${selectedVenue}-${searchQuery}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {Object.entries(
              filteredScreenings.reduce((acc, screen) => {
                const venue = screen.venue;
                if (!acc[venue]) acc[venue] = [];
                acc[venue].push(screen);
                return acc;
              }, {} as Record<string, ScreenSchedule[]>)
            ).map(([venueKey, screens]) => (
              <div key={venueKey}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>{venueIcons[venueKey]}</span>
                  {venues[venueKey as keyof typeof venues]?.name || venueKey}
                  <span className="text-xs text-white/40 font-normal">
                    ({venues[venueKey as keyof typeof venues]?.location || ""})
                  </span>
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {screens.sort((a, b) => parseInt(a.screen) - parseInt(b.screen)).map((screen) => {
                    const screenId = `${venueKey}-${screen.screen}`;
                    const isExpanded = expandedScreens.has(screenId) || screen.showings.length <= 3;
                    const displayShowings = isExpanded ? screen.showings : screen.showings.slice(0, 3);
                    
                    return (
                      <motion.div
                        key={screenId}
                        layout
                        className={`bg-gradient-to-br ${venueColors[venueKey]} border rounded-xl overflow-hidden`}
                      >
                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                          <span className="font-semibold text-white/90">
                            Screen {screen.screen}
                          </span>
                          <span className="text-xs text-white/50">
                            {screen.showings.length} shows
                          </span>
                        </div>
                        
                        <div className="divide-y divide-white/5">
                          {displayShowings.map((showing, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`p-3 hover:bg-white/5 transition-colors ${
                                showing.special ? "bg-yellow-500/10 border-l-2 border-yellow-400" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-sm font-mono font-bold text-yellow-400 w-14 flex-shrink-0">
                                  {showing.time}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white text-sm leading-tight truncate" title={showing.film}>
                                    {showing.film}
                                    {showing.special && (
                                      <span className="ml-2 text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold">
                                        {showing.special}
                                      </span>
                                    )}
                                  </div>
                                  {showing.director && (
                                    <div className="text-xs text-white/50 mt-0.5 truncate">
                                      {showing.director}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40">
                                    {showing.country && <span>{showing.country}</span>}
                                    {showing.year > 0 && <span>• {showing.year}</span>}
                                    {showing.language && <span>• {showing.language}</span>}
                                    {showing.duration > 0 && <span>• {formatDuration(showing.duration)}</span>}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        
                        {screen.showings.length > 3 && !isExpanded && (
                          <button
                            onClick={() => toggleScreen(screenId)}
                            className="w-full py-2 text-xs text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
                          >
                            Show {screen.showings.length - 3} more →
                          </button>
                        )}
                        {isExpanded && screen.showings.length > 3 && (
                          <button
                            onClick={() => toggleScreen(screenId)}
                            className="w-full py-2 text-xs text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
                          >
                            ← Show less
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredScreenings.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <div className="text-4xl mb-4">🎬</div>
            <p>No screenings found matching your criteria</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-white/40">
          <p>Schedule data from official BIFFes 2026 program (Version 4)</p>
          <p className="mt-1">Subject to change • Last updated: {new Date(scheduleData.schedule.lastUpdated).toLocaleDateString()}</p>
        </div>
      </footer>
    </div>
  );
}

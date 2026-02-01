"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Film } from "@/types";
import { RatingBadges } from "@/components/RatingBadges";
import { WatchlistButton } from "@/components/WatchlistButton";
import { SiteNav } from "@/components/SiteNav";

// Lazy load FilmDrawer - only loaded when user clicks a film
const FilmDrawer = dynamic(() => import("@/components/FilmDrawer").then(m => ({ default: m.FilmDrawer })), {
  ssr: false,
  loading: () => null,
});

// Get current date in India timezone (IST = UTC+5:30)
function getTodayIST(): string {
  const now = new Date();
  // Convert to IST by adding 5:30 hours offset
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const istTime = new Date(utcTime + istOffset);
  return istTime.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

// Get current time in IST as minutes since midnight
function getCurrentTimeMinutesIST(): number {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const istTime = new Date(utcTime + istOffset);
  return istTime.getHours() * 60 + istTime.getMinutes();
}

// Check if a showing is currently playing
function isNowShowing(time: string, duration: number | undefined, isToday: boolean): boolean {
  if (!isToday) return false;
  const currentMinutes = getCurrentTimeMinutesIST();
  const [hours, mins] = time.split(':').map(Number);
  const showingStart = hours * 60 + mins;
  const showingEnd = showingStart + (duration || 120);
  return currentMinutes >= showingStart && currentMinutes < showingEnd;
}

interface Showing {
  time: string;
  film: string;
  director?: string;
  country?: string;
  year?: number;
  language?: string;
  duration?: number;
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
  const days = scheduleData.days;
  const venues = scheduleData.schedule.venues;

  // Get today's date in IST and find the matching day index
  const todayIST = useMemo(() => getTodayIST(), []);
  const todayIndex = useMemo(() => {
    const idx = days.findIndex(day => day.date === todayIST);
    // If today is before festival, show first day; if after, show last day
    if (idx === -1) {
      if (todayIST < days[0].date) return 0;
      if (todayIST > days[days.length - 1].date) return days.length - 1;
      return 0;
    }
    return idx;
  }, [days, todayIST]);

  const [selectedDay, setSelectedDay] = useState(() => {
    // Calculate on client side to avoid SSR mismatch
    if (typeof window === 'undefined') return 0;
    const today = getTodayIST();
    const idx = days.findIndex(day => day.date === today);
    if (idx === -1) {
      if (today < days[0].date) return 0;
      if (today > days[days.length - 1].date) return days.length - 1;
      return 0;
    }
    return idx;
  });
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Default to compact view on mobile (better for touch)
  const [viewMode, setViewMode] = useState<"compact" | "cards">(() => {
    if (typeof window === 'undefined') return "compact";
    return window.innerWidth < 768 ? "compact" : "cards";
  });
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(getCurrentTimeMinutesIST);

  // Update current time every minute for "Now Showing" indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeMinutes(getCurrentTimeMinutesIST());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Check if selected day is today (for Now Showing indicator)
  const isSelectedDayToday = days[selectedDay]?.date === todayIST;

  // Set correct day after hydration
  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      setSelectedDay(todayIndex);
      // Set compact view on mobile after hydration
      if (window.innerWidth < 768) {
        setViewMode("compact");
      }
    }
  }, [hasMounted, todayIndex]);

  // Check if a day is in the past (before today in IST)
  const isDayPast = useCallback((date: string) => date < todayIST, [todayIST]);

  // Ref for day tabs container to scroll to today
  const dayTabsRef = useRef<HTMLDivElement>(null);
  
  // Scroll to today's tab on mount
  useEffect(() => {
    if (dayTabsRef.current && todayIndex > 0) {
      const container = dayTabsRef.current;
      const buttons = container.querySelectorAll('button');
      if (buttons[todayIndex]) {
        const button = buttons[todayIndex] as HTMLElement;
        const scrollLeft = button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
    }
  }, [todayIndex]);

  // Create a mapping from film title (uppercase) to Film object
  // Include normalized versions and known aliases for better matching
  const filmsByTitle = useMemo(() => {
    const map = new Map<string, Film>();
    
    // Helper to normalize title for matching
    const normalize = (title: string) => {
      return title
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')         // Normalize whitespace
        .trim();
    };
    
    films.forEach(film => {
      const upper = film.title.toUpperCase();
      map.set(upper, film);
      
      // Also add normalized version
      const normalized = normalize(film.title);
      if (normalized !== upper) {
        map.set(normalized, film);
      }
    });
    
    // Known title variations in schedule vs database
    const titleAliases: Record<string, string> = {
      // Spelling variations
      'GANARRAAG': 'GANARAAG',
      'VAMYA': 'VANYA',
      'ROOSTER': 'KOKORAS',
      'SIRAT': 'SIRĀT',
      'SARKEET': 'SIRĀT',
      'PHOLDIBEE': 'PHOUOIBEE (THE GODDESS OF PADDY)',
      'REPUBLIC OF PIPULPIPAS': 'REPUBLIC OF PIPOLIPINAS',
      'HOMTIVENTAI \'25': "KONTINENTAL '25",
      'KONTINENTAL 25': "KONTINENTAL '25",
      'HY NAM INN': 'KY NAM INN',
      'CEMETARY OF CINEMA': 'THE CEMETERY OF CINEMA',
      'CEMETERY OF CINEMA': 'THE CEMETERY OF CINEMA',
      'THE MYSTERIOUS CASE OF THE FLAMINGO': 'THE MYSTERIOUS GAZE OF THE FLAMINGO',
      'SRIMANTHI DARSAIL PART 2': 'SRI JAGANNATHA DAASARU PART 2',
      'SRI JAGANNATHA DASKARU PART 2': 'SRI JAGANNATHA DAASARU PART 2',
      'SIR JAGANNATHA DASKARU PART 2': 'SRI JAGANNATHA DAASARU PART 2',
      
      // Title variations
      'KANTARA II (LEGEND CHAPTER-1)': 'KANTARA A LEGEND CHAPTER-1',
      'FIRE FLY': 'FLAMES',
      'MOSQUITOS': 'MOSQUITOES',
      'GEHEMU LAMAI': 'GEHENNU LAMAI',
      'GEHENU LAMAI': 'GEHENNU LAMAI',
      'ASAD AND BEAUTIFUL WORLD': 'A SAD AND BEAUTIFUL WORLD',
      'JHANE MOVES TO THE COUNTRY': 'JANINE MOVES TO THE COUNTRY',
      'THE SEASONS, TWO STRANGERS': 'TWO SEASONS, TWO STRANGERS',
      'ANMOL - LOVINGLY OURS': 'ANMOL- LOVINGLY OURS',
      'LA CHAPELLE': 'THE CHAPEL',
      'LA VIE EST BELLE': 'LIFE IS ROSY',
      'NATIONALITE IMMIGRE': 'NATIONALITY: IMMIGRANT',
      "WERODON, L'ENFANT DU BON DIEU": "WENDEMI, THE GOOD LORD'S CHILD",
      'TETES BRULEES': 'TÊTES BRÛLÉES',
      'SAMBA TRAORE': 'SAMBA TRAORÉ',
      'CALLE MALAGA': 'CALLE MÁLAGA',
      'BELEN': 'BELÉN',
      'NINO OF POPULAR ENTERTAINMENT': 'NINO',
      'THAAY! SAHEBA': 'THAAYI SAHEBA',
      'AGNIVATHWASI': 'AGNYATHAVASI',
      // 'ACCIDENT' is a different film from 'IT WAS JUST AN ACCIDENT' - no alias needed
      'SECRET OF A MOUNTAIN SERPENT': 'KOORMAVATARA',
      'WHAT DOES THE HARVEST SAY TO YOU': 'WHAT DOES THAT NATURE SAY TO YOU',
    };
    
    // Add aliases pointing to the same films
    Object.entries(titleAliases).forEach(([scheduleTitle, dbTitle]) => {
      const film = map.get(dbTitle.toUpperCase()) || map.get(normalize(dbTitle));
      if (film) {
        map.set(scheduleTitle.toUpperCase(), film);
        map.set(normalize(scheduleTitle), film);
      }
    });
    
    return map;
  }, [films]);
  
  // Helper to find film by schedule title
  const findFilmByTitle = useCallback((scheduleTitle: string): Film | undefined => {
    const upper = scheduleTitle.toUpperCase();
    if (filmsByTitle.has(upper)) return filmsByTitle.get(upper);
    
    // Try normalized version
    const normalized = upper.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (filmsByTitle.has(normalized)) return filmsByTitle.get(normalized);
    
    return undefined;
  }, [filmsByTitle]);

  const currentDay = days[selectedDay];

  // Find showing data from current day's screenings
  const findShowingData = useCallback((filmTitle: string): Showing | undefined => {
    const filmUpper = filmTitle.toUpperCase();
    for (const screening of currentDay.screenings) {
      for (const showing of screening.showings) {
        if (showing.film.toUpperCase() === filmUpper) {
          return showing;
        }
      }
    }
    return undefined;
  }, [currentDay]);

  // Handle film click - navigate to film page or show drawer
  const handleFilmClick = useCallback((filmTitle: string, openInNewTab = false) => {
    const film = findFilmByTitle(filmTitle);
    if (film) {
      if (openInNewTab) {
        window.open(`/film/${film.id}`, '_blank');
      } else {
        setSelectedFilm(film);
        setIsDrawerOpen(true);
      }
    } else {
      // Film not in database - create a temporary Film object from schedule data
      const showingData = findShowingData(filmTitle);
      const tempFilm: Film = {
        id: `schedule-${filmTitle.replace(/\s+/g, '-').toLowerCase()}`,
        title: filmTitle,
        director: showingData?.director || 'Director information unavailable',
        country: showingData?.country || '',
        year: showingData?.year || 0,
        duration: showingData?.duration || 0,
        language: showingData?.language || '',
        synopsis: 'This is a special screening at BIFFes 2026. Detailed information is not available in our database.',
        posterUrl: '',
        categoryId: 'special',
      };
      setSelectedFilm(tempFilm);
      setIsDrawerOpen(true);
    }
  }, [findFilmByTitle, findShowingData]);

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
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Site Navigation */}
          <div className="mb-3 -mx-1 overflow-x-auto scrollbar-hide">
            <SiteNav variant="minimal" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              📅 BIFFes 2026 Schedule
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
          <div ref={dayTabsRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {days.map((day, index) => {
              const isPast = isDayPast(day.date);
              const isToday = day.date === todayIST;
              const isSelected = selectedDay === index;
              
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(index)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all relative ${
                    isSelected
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black"
                      : isPast
                        ? "bg-white/5 text-white/30 hover:bg-white/10"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {isToday && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                  <span className="block">{day.label.split(" - ")[0]}</span>
                  <span className={`block text-xs ${isPast && !isSelected ? "opacity-50" : "opacity-70"}`}>
                    {isToday ? "Today" : new Date(day.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-[120px] z-40 bg-gray-900/90 backdrop-blur-md border-b border-white/5 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
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
      <main className="max-w-7xl mx-auto px-4 py-6">
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
                              const filmData = findFilmByTitle(showing.film);
                              const hasFilmData = !!filmData;
                              const nowShowing = isNowShowing(time, showing.duration, isSelectedDayToday);
                              return (
                                <div 
                                  key={idx}
                                  className={`${nowShowing ? "bg-green-500/20 border-green-400" : colors.bg + " " + colors.border} border rounded-lg p-3 relative group cursor-pointer hover:bg-white/10 transition-colors`}
                                  onClick={() => handleFilmClick(showing.film)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === "Enter" && handleFilmClick(showing.film)}
                                >
                                  {/* Now Showing badge */}
                                  {nowShowing && (
                                    <div className="absolute -top-2 left-2 flex items-center gap-1 bg-green-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                      <span className="w-1 h-1 bg-black rounded-full"></span>
                                      LIVE
                                    </div>
                                  )}
                                  {/* Watchlist button - only for films in database */}
                                  {filmData && (
                                    <div 
                                      className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
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
                                  {filmData?.director && (
                                    <p className="text-xs text-white/60 mt-1 truncate">
                                      Dir: {filmData.director}
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
                                  {filmData && (filmData.country || filmData.language || filmData.duration) && (
                                    <div className="flex flex-wrap gap-x-2 mt-2 text-[10px] text-white/50">
                                      {filmData.country && <span>{filmData.country}</span>}
                                      {filmData.country && filmData.language && <span>•</span>}
                                      {filmData.language && <span>{filmData.language}</span>}
                                      {(filmData.country || filmData.language) && filmData.duration && <span>•</span>}
                                      {filmData.duration && <span>{filmData.duration}&apos;</span>}
                                    </div>
                                  )}
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
                              const filmData = findFilmByTitle(showing.film);
                              const hasFilmData = !!filmData;
                              const nowShowing = isNowShowing(showing.time, showing.duration, isSelectedDayToday);
                              return (
                                <div
                                  key={idx}
                                  className={`p-3 transition-colors relative group ${
                                    nowShowing ? "bg-green-500/20 border-l-4 border-green-400" :
                                    showing.special ? "bg-yellow-500/10 border-l-2 border-yellow-400" : ""
                                  } hover:bg-white/10 cursor-pointer`}
                                  onClick={() => handleFilmClick(showing.film)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === "Enter" && handleFilmClick(showing.film)}
                                >
                                  {/* Now Showing badge */}
                                  {nowShowing && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                      <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                      NOW
                                    </div>
                                  )}
                                  {/* Watchlist button - only for films in database */}
                                  {filmData && (
                                    <div 
                                      className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <WatchlistButton filmId={filmData.id} />
                                    </div>
                                  )}
                                  <div className={`flex items-start gap-3 ${nowShowing ? "mt-6" : ""}`}>
                                    <div className="text-sm font-mono font-bold text-yellow-400 w-14 flex-shrink-0">
                                      {showing.time}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-white text-sm leading-tight hover:text-yellow-400" title={showing.film}>
                                        {showing.film}
                                        <span className="ml-1 text-[10px] text-yellow-400/60">↗</span>
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
                                        {showing.year && showing.year > 0 && <span>• {showing.year}</span>}
                                        {showing.language && <span>• {showing.language}</span>}
                                        {showing.duration && showing.duration > 0 && <span>• {formatDuration(showing.duration)}</span>}
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
        <div className="max-w-7xl mx-auto">
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
        <div className="max-w-7xl mx-auto text-center text-sm text-white/40">
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

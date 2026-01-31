"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Film } from "@/types";

interface Showing {
  time: string;
  film: string;
  director?: string;
  country?: string;
  year?: number;
  language?: string;
  duration?: number;
}

interface ScreenSchedule {
  venue: string;
  screen: string;
  showings: Showing[];
}

interface DaySchedule {
  date: string;
  dayNumber: number;
  label: string;
  screenings: ScreenSchedule[];
}

interface ScheduleData {
  days: DaySchedule[];
  schedule: {
    venues: Record<string, { name: string; location: string; screens?: number }>;
  };
}

interface WatchlistScheduleProps {
  watchlistFilms: Film[];
  scheduleData: ScheduleData;
  onFilmClick?: (film: Film) => void;
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

interface ScheduledShowing {
  date: string;
  dayNumber: number;
  dayLabel: string;
  time: string;
  venue: string;
  venueName: string;
  screen: string;
  film: Film;
  duration?: number;
}

export function WatchlistSchedule({ watchlistFilms, scheduleData, onFilmClick }: WatchlistScheduleProps) {
  const { days, schedule } = scheduleData;
  const venues = schedule.venues;

  // Create a map of film titles (uppercase) to film objects
  const filmsByTitle = useMemo(() => {
    const map = new Map<string, Film>();
    watchlistFilms.forEach(film => {
      map.set(film.title.toUpperCase(), film);
    });
    return map;
  }, [watchlistFilms]);

  // Find all showings for watchlist films
  const scheduledShowings = useMemo(() => {
    const showings: ScheduledShowing[] = [];

    days.forEach(day => {
      day.screenings.forEach(screening => {
        screening.showings.forEach(showing => {
          const film = filmsByTitle.get(showing.film.toUpperCase());
          if (film) {
            showings.push({
              date: day.date,
              dayNumber: day.dayNumber,
              dayLabel: day.label,
              time: showing.time,
              venue: screening.venue,
              venueName: venues[screening.venue]?.name || screening.venue,
              screen: screening.screen,
              film,
              duration: showing.duration,
            });
          }
        });
      });
    });

    // Sort by date and time
    return showings.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [days, filmsByTitle, venues]);

  // Group showings by day
  const showingsByDay = useMemo(() => {
    const grouped = new Map<string, ScheduledShowing[]>();
    scheduledShowings.forEach(showing => {
      const key = showing.date;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(showing);
    });
    return grouped;
  }, [scheduledShowings]);

  if (scheduledShowings.length === 0) {
    return (
      <div className="text-center py-8 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <span className="text-4xl mb-3 block">📅</span>
        <p className="text-zinc-400">No scheduled screenings found for your watchlist films</p>
        <p className="text-zinc-500 text-sm mt-1">Schedule data may not be available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📅</span>
            Your Schedule
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {scheduledShowings.length} screening{scheduledShowings.length !== 1 ? "s" : ""} across {showingsByDay.size} day{showingsByDay.size !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/schedule"
          className="text-sm text-green-400 hover:text-green-300 transition-colors"
        >
          Full Schedule →
        </Link>
      </div>

      {/* Schedule by Day */}
      <div className="space-y-4">
        {Array.from(showingsByDay.entries()).map(([date, dayShowings]) => {
          const dayLabel = dayShowings[0].dayLabel;
          const formattedDate = new Date(date).toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          return (
            <div key={date} className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/30">
              {/* Day Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-green-900/30 to-emerald-900/20 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{dayLabel}</span>
                  <span className="text-sm text-zinc-400">{formattedDate}</span>
                </div>
              </div>

              {/* Showings */}
              <div className="divide-y divide-zinc-800/50">
                {dayShowings.map((showing, idx) => {
                  const colors = venueColors[showing.venue] || venueColors.cinepolis;
                  return (
                    <div
                      key={`${showing.date}-${showing.time}-${showing.film.id}-${idx}`}
                      className="flex items-stretch hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => onFilmClick?.(showing.film)}
                    >
                      {/* Time */}
                      <div className="w-20 flex-shrink-0 py-3 px-4 bg-black/20 border-r border-zinc-800 flex items-center">
                        <span className="font-mono font-bold text-yellow-400">{showing.time}</span>
                      </div>

                      {/* Film Info */}
                      <div className="flex-1 py-3 px-4">
                        <h4 className="font-semibold text-white text-sm">{showing.film.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                          <span>{showing.film.director}</span>
                          <span>•</span>
                          <span>{showing.duration}&apos;</span>
                        </div>
                      </div>

                      {/* Venue */}
                      <div className={`w-40 flex-shrink-0 py-3 px-3 ${colors.bg} border-l ${colors.border} flex flex-col justify-center`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{venueIcons[showing.venue]}</span>
                          <span className={`text-xs font-medium ${colors.text} truncate`}>
                            {showing.venueName}
                          </span>
                        </div>
                        {showing.venue !== "openair" && (
                          <span className="text-[10px] text-zinc-500 mt-0.5">
                            Screen {showing.screen}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conflict Warning */}
      {(() => {
        // Check for time conflicts (showings within 30 mins of each other on same day)
        const conflicts: Array<[ScheduledShowing, ScheduledShowing]> = [];
        scheduledShowings.forEach((a, i) => {
          scheduledShowings.slice(i + 1).forEach(b => {
            if (a.date === b.date) {
              const [aHour, aMin] = a.time.split(":").map(Number);
              const [bHour, bMin] = b.time.split(":").map(Number);
              const aMinutes = aHour * 60 + aMin;
              const bMinutes = bHour * 60 + bMin;
              const aEnd = aMinutes + (a.duration || 120);
              // Check if b starts before a ends
              if (bMinutes < aEnd && bMinutes >= aMinutes) {
                conflicts.push([a, b]);
              }
            }
          });
        });

        if (conflicts.length === 0) return null;

        return (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-amber-400">Schedule Conflicts</h4>
                <p className="text-sm text-zinc-400 mt-1">
                  {conflicts.length} overlapping screening{conflicts.length !== 1 ? "s" : ""} detected. 
                  You may need to choose between some films.
                </p>
                <ul className="mt-2 space-y-1">
                  {conflicts.slice(0, 3).map(([a, b], idx) => (
                    <li key={idx} className="text-xs text-amber-300/80">
                      • {a.film.title} ({a.time}) overlaps with {b.film.title} ({b.time})
                    </li>
                  ))}
                  {conflicts.length > 3 && (
                    <li className="text-xs text-zinc-500">
                      ...and {conflicts.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

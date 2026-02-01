"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Stats {
  festival: {
    name: string;
    edition: number;
    year: number;
    dates: string;
    lastUpdated: string;
    venues: Array<{ name: string; address: string; mapUrl: string }>;
  };
  films: {
    total: number;
    totalMinutes: number;
    totalHours: number;
    avgDuration: number;
    longestFilm: { title: string; duration: number } | null;
    shortestFilm: { title: string; duration: number } | null;
    uniqueCountries: number;
    uniqueLanguages: number;
    topCountries: [string, number][];
    topLanguages: [string, number][];
    yearDistribution: { year: number; count: number }[];
  };
  ratings: {
    withImdb: number;
    withRT: number;
    withMC: number;
    withLB: number;
    withAnyRating: number;
    avgImdb: string | null;
    highestImdb: { title: string; rating: string } | null;
    awardWinners: number;
    awardNominated: number;
  };
  schedule: {
    totalDays: number;
    totalScreenings: number;
    totalScheduledMinutes: number;
    totalScheduledHours: number;
    venueStats: { key: string; name: string; location: string; screenings: number }[];
    dayScreenings: { label: string; count: number }[];
    peakHour: { hour: string; count: number } | null;
  };
  categories: {
    total: number;
    breakdown: { name: string; slug: string; filmCount: number; color: string }[];
  };
  meta: {
    totalPages: number;
    dataSize: number;
    scheduleSize: number;
    totalDataKB: number;
  };
}

interface PlatformStats {
  totalSyncCodes: number | null;
  totalWatchlists: number | null;
  loading: boolean;
  error: boolean;
}

function StatCard({ 
  label, 
  value, 
  suffix = "", 
  icon,
  delay = 0,
  color = "text-white"
}: { 
  label: string; 
  value: string | number; 
  suffix?: string;
  icon?: string;
  delay?: number;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {value}{suffix && <span className="text-sm font-normal text-zinc-500 ml-1">{suffix}</span>}
          </p>
        </div>
        {icon && <span className="text-2xl opacity-50">{icon}</span>}
      </div>
    </motion.div>
  );
}

function BarChart({ 
  data, 
  maxValue,
  color = "bg-amber-500"
}: { 
  data: { label: string; value: number }[];
  maxValue: number;
  color?: string;
}) {
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <motion.div 
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center gap-3"
        >
          <span className="text-xs text-zinc-400 w-20 truncate" title={item.label}>{item.label}</span>
          <div className="flex-1 h-5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ delay: i * 0.03 + 0.2, duration: 0.5 }}
              className={`h-full ${color} rounded-full`}
            />
          </div>
          <span className="text-xs font-mono text-zinc-300 w-8 text-right">{item.value}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default function DataClient({ stats }: { stats: Stats }) {
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalSyncCodes: null,
    totalWatchlists: null,
    loading: true,
    error: false,
  });
  const [currentTime, setCurrentTime] = useState<string>("");

  // Fetch platform stats from API
  useEffect(() => {
    async function fetchPlatformStats() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setPlatformStats({
            totalSyncCodes: data.syncCodesCreated ?? null,
            totalWatchlists: data.activeWatchlists ?? null,
            loading: false,
            error: false,
          });
        } else {
          setPlatformStats(prev => ({ ...prev, loading: false, error: true }));
        }
      } catch {
        setPlatformStats(prev => ({ ...prev, loading: false, error: true }));
      }
    }
    fetchPlatformStats();
  }, []);

  // Update current time
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString("en-IN", { 
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium"
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const maxCountry = stats.films.topCountries[0]?.[1] || 1;
  const maxLanguage = stats.films.topLanguages[0]?.[1] || 1;
  const maxVenue = stats.schedule.venueStats[0]?.screenings || 1;

  return (
    <main id="main-content" className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-gradient-to-br from-violet-900/30 to-indigo-900/20 border-b border-violet-800/30">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link 
            href="/"
            className="text-violet-400 hover:text-violet-300 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
          >
            ← Back to Festival
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-violet-400">📊</span>
              Data Observatory
            </h1>
            <p className="text-zinc-400 mt-2">
              Real-time statistics and insights for {stats.festival.name} {stats.festival.year}
            </p>
            {currentTime && (
              <p className="text-xs text-zinc-500 mt-2 font-mono">
                IST: {currentTime}
              </p>
            )}
          </motion.div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        
        {/* Hero Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Films" value={stats.films.total} icon="🎬" delay={0} color="text-amber-400" />
            <StatCard label="Countries" value={stats.films.uniqueCountries} icon="🌍" delay={0.05} color="text-emerald-400" />
            <StatCard label="Languages" value={stats.films.uniqueLanguages} icon="🗣️" delay={0.1} color="text-blue-400" />
            <StatCard label="Categories" value={stats.categories.total} icon="📁" delay={0.15} color="text-purple-400" />
          </div>
        </section>

        {/* Duration Stats */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-amber-400">⏱️</span> Runtime Analysis
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="Total Runtime" 
              value={stats.films.totalHours} 
              suffix="hours"
              delay={0}
            />
            <StatCard 
              label="Average Film" 
              value={stats.films.avgDuration} 
              suffix="min"
              delay={0.05}
            />
            {stats.films.longestFilm && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 col-span-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Longest Film</p>
                <p className="text-lg font-semibold text-white truncate">{stats.films.longestFilm.title}</p>
                <p className="text-sm text-amber-400">{stats.films.longestFilm.duration} minutes</p>
              </div>
            )}
          </div>
        </section>

        {/* Geographic Distribution */}
        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">🌍</span> Films by Country
            </h2>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
              <BarChart 
                data={stats.films.topCountries.map(([label, value]) => ({ label, value }))}
                maxValue={maxCountry}
                color="bg-emerald-500"
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">🗣️</span> Films by Language
            </h2>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
              <BarChart 
                data={stats.films.topLanguages.map(([label, value]) => ({ label, value }))}
                maxValue={maxLanguage}
                color="bg-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Ratings Intelligence */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-400">⭐</span> Ratings Intelligence
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard 
              label="IMDb Ratings" 
              value={stats.ratings.withImdb}
              suffix={`/ ${stats.films.total}`}
              delay={0}
              color="text-yellow-400"
            />
            <StatCard 
              label="Rotten Tomatoes" 
              value={stats.ratings.withRT}
              suffix={`/ ${stats.films.total}`}
              delay={0.05}
              color="text-red-400"
            />
            <StatCard 
              label="Metacritic" 
              value={stats.ratings.withMC}
              suffix={`/ ${stats.films.total}`}
              delay={0.1}
              color="text-amber-400"
            />
            <StatCard 
              label="Letterboxd" 
              value={stats.ratings.withLB}
              suffix={`/ ${stats.films.total}`}
              delay={0.15}
              color="text-green-400"
            />
            <StatCard 
              label="Any Rating" 
              value={Math.round((stats.ratings.withAnyRating / stats.films.total) * 100)}
              suffix="%"
              delay={0.2}
              color="text-violet-400"
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {stats.ratings.avgImdb && (
              <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/10 border border-yellow-800/30 rounded-xl p-4">
                <p className="text-xs text-yellow-500/70 uppercase tracking-wider mb-1">Average IMDb</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.ratings.avgImdb}<span className="text-lg text-yellow-600">/10</span></p>
              </div>
            )}
            <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/10 border border-amber-800/30 rounded-xl p-4">
              <p className="text-xs text-amber-500/70 uppercase tracking-wider mb-1">🏆 Award Winners</p>
              <p className="text-3xl font-bold text-amber-400">{stats.ratings.awardWinners}</p>
              <p className="text-xs text-zinc-500 mt-1">+{stats.ratings.awardNominated} nominated</p>
            </div>
            {stats.ratings.highestImdb && (
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-800/30 rounded-xl p-4">
                <p className="text-xs text-green-500/70 uppercase tracking-wider mb-1">Highest Rated</p>
                <p className="text-sm font-semibold text-white truncate">{stats.ratings.highestImdb.title}</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{stats.ratings.highestImdb.rating}</p>
              </div>
            )}
          </div>
        </section>

        {/* Schedule Analytics */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">📅</span> Schedule Analytics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="Festival Days" 
              value={stats.schedule.totalDays}
              icon="📆"
              delay={0}
            />
            <StatCard 
              label="Total Screenings" 
              value={stats.schedule.totalScreenings}
              icon="🎞️"
              delay={0.05}
            />
            <StatCard 
              label="Screen Hours" 
              value={stats.schedule.totalScheduledHours}
              suffix="hrs"
              delay={0.1}
            />
            {stats.schedule.peakHour && (
              <StatCard 
                label="Peak Hour" 
                value={stats.schedule.peakHour.hour}
                suffix={`(${stats.schedule.peakHour.count})`}
                delay={0.15}
                color="text-cyan-400"
              />
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Screenings by Venue</h3>
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                <BarChart 
                  data={stats.schedule.venueStats.map(v => ({ label: v.name.split(' ')[0], value: v.screenings }))}
                  maxValue={maxVenue}
                  color="bg-cyan-500"
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Screenings by Day</h3>
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                <BarChart 
                  data={stats.schedule.dayScreenings.map(d => ({ 
                    label: d.label.replace('Day ', 'D').split(' - ')[0], 
                    value: d.count 
                  }))}
                  maxValue={Math.max(...stats.schedule.dayScreenings.map(d => d.count))}
                  color="bg-violet-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Year Distribution */}
        {stats.films.yearDistribution.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-pink-400">📅</span> Production Years
            </h2>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-end justify-between gap-2 h-32">
                {stats.films.yearDistribution.map((item, i) => (
                  <motion.div
                    key={item.year}
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.count / Math.max(...stats.films.yearDistribution.map(d => d.count))) * 100}%` }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    className="flex-1 bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-sm min-h-[4px] relative group"
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                      {item.year}: {item.count}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-zinc-500">
                <span>{stats.films.yearDistribution[stats.films.yearDistribution.length - 1]?.year}</span>
                <span>{stats.films.yearDistribution[0]?.year}</span>
              </div>
            </div>
          </section>
        )}

        {/* Platform Stats */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-rose-400">🎟️</span> Platform Activity
          </h2>
          {platformStats.loading ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse h-20" />
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse h-20" />
            </div>
          ) : platformStats.error ? (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-zinc-500">Platform stats unavailable</p>
              <p className="text-xs text-zinc-600 mt-1">Redis connection required</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {platformStats.totalSyncCodes !== null && (
                <StatCard 
                  label="Share Codes Created" 
                  value={platformStats.totalSyncCodes}
                  icon="🔗"
                  color="text-rose-400"
                />
              )}
              {platformStats.totalWatchlists !== null && (
                <StatCard 
                  label="Active Watchlists" 
                  value={platformStats.totalWatchlists}
                  icon="❤️"
                  color="text-rose-400"
                />
              )}
              <div className="bg-gradient-to-br from-rose-900/20 to-pink-900/10 border border-rose-800/30 rounded-xl p-4">
                <p className="text-xs text-rose-500/70 uppercase tracking-wider mb-1">Sync Code Format</p>
                <p className="font-mono text-lg text-rose-400">XXXXXX</p>
                <p className="text-xs text-zinc-500 mt-1">6 chars • 32^6 possibilities</p>
              </div>
            </div>
          )}
        </section>

        {/* Categories Breakdown */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400">📁</span> Category Distribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.categories.breakdown.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
              >
                <p className="text-xs text-zinc-500 truncate" title={cat.name}>{cat.name}</p>
                <p className="text-xl font-bold text-white">{cat.filmCount}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Technical Meta */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-zinc-400">⚙️</span> Technical Meta
          </h2>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-800">
              <div className="p-4 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Static Pages</p>
                <p className="text-2xl font-bold text-zinc-300 mt-1">{stats.meta.totalPages}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Data Size</p>
                <p className="text-2xl font-bold text-zinc-300 mt-1">{stats.meta.totalDataKB} <span className="text-sm">KB</span></p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Build</p>
                <p className="text-sm font-mono text-zinc-400 mt-2">Next.js 16</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Last Updated</p>
                <p className="text-xs font-mono text-zinc-400 mt-2">{new Date(stats.festival.lastUpdated).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800 pt-8 text-center">
          <p className="text-sm text-zinc-500">
            Data computed at build time • Refresh page for live platform stats
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            ← Back to Festival
          </Link>
        </footer>
      </div>
    </main>
  );
}

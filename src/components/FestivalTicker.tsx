"use client";

import { motion } from "framer-motion";
import { Film, Globe, MapPin, Calendar } from "lucide-react";

interface FestivalTickerProps {
  totalFilms: number;
  totalCountries: number;
  edition: number;
  dates: string;
}

export function FestivalTicker({
  totalFilms,
  totalCountries,
  edition,
  dates,
}: FestivalTickerProps) {
  const stats = [
    { icon: Film, label: "Films", value: totalFilms },
    { icon: Globe, label: "Countries", value: totalCountries },
    { icon: Calendar, label: "Edition", value: `${edition}th` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b border-zinc-700"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2"
              >
                <stat.icon className="w-4 h-4 text-yellow-500" />
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-white">
                    {stat.value}
                  </span>
                  <span className="text-xs text-zinc-400">{stat.label}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Date & Venue */}
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{dates}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Bengaluru, India</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

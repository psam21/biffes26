"use client";

import { motion } from "framer-motion";
import { Film, Globe, MapPin, Calendar } from "@/lib/icons";
import { Venue } from "@/types";

interface FestivalTickerProps {
  totalFilms: number;
  totalCountries: number;
  edition: number;
  dates: string;
  venues: Venue[];
}

export function FestivalTicker({
  totalFilms,
  totalCountries,
  edition,
  dates,
  venues,
}: FestivalTickerProps) {
  // Use official festival stats: 200+ films from 60+ countries
  const stats = [
    { icon: Film, label: "Films", value: "200+" },
    { icon: Globe, label: "Countries", value: "60+" },
    { icon: Calendar, label: "Edition", value: `${edition}th` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b border-zinc-700"
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Stats */}
          <div className="flex items-center gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-1.5"
              >
                <stat.icon className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-sm font-bold text-white">{stat.value}</span>
                <span className="text-xs text-zinc-500">{stat.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dates}</span>
          </div>

          {/* Venues */}
          <div className="flex items-center gap-3 text-xs">
            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            {venues.map((venue, i) => (
              <span key={venue.name}>
                <a
                  href={venue.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-500 hover:text-yellow-400 hover:underline transition-colors"
                >
                  {venue.name}
                </a>
                {i < venues.length - 1 && <span className="text-zinc-600 ml-3">•</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Film } from "@/types";
import { cn, formatDuration } from "@/lib/utils";

interface FilmCardProps {
  film: Film;
  onClick: () => void;
  index: number;
}

export function FilmCard({ film, onClick, index }: FilmCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      className={cn(
        "film-card cursor-pointer rounded-lg overflow-hidden",
        "bg-zinc-900 border border-zinc-800",
        "hover:border-zinc-600 transition-colors duration-200"
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-zinc-800">
        {film.posterUrl ? (
          <Image
            src={film.posterUrl}
            alt={film.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-zinc-600 text-4xl">🎬</span>
          </div>
        )}

        {/* Language badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-0.5">
          <span className="text-xs text-white/90">{film.language}</span>
        </div>

        {/* Duration badge */}
        {film.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-0.5">
            <span className="text-xs text-white/90">
              {formatDuration(film.duration)}
            </span>
          </div>
        )}
      </div>

      {/* Film info */}
      <div className="p-3 space-y-1">
        <h4 className="font-semibold text-white text-sm leading-tight line-clamp-2">
          {film.title}
        </h4>
        {film.director && (
          <p className="text-xs text-zinc-400 truncate">{film.director}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{film.country}</span>
          <span>•</span>
          <span>{film.year}</span>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Film, ChevronRight } from "lucide-react";
import { Category } from "@/types";
import { cn, getCategoryGradient, getCategoryBorderColor } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
  onClick: () => void;
  index: number;
}

export function CategoryCard({ category, onClick, index }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl p-6 border overflow-hidden",
        "bg-gradient-to-br",
        getCategoryGradient(category.color),
        getCategoryBorderColor(category.color),
        "hover:shadow-xl hover:shadow-black/30 transition-shadow duration-300"
      )}
    >
      {/* Film count badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
        <Film className="w-3.5 h-3.5 text-white/80" />
        <span className="text-sm font-medium text-white/90">
          {category.filmCount}
        </span>
      </div>

      {/* Category info */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-white pr-16">{category.name}</h3>
        <p className="text-sm text-white/70 line-clamp-2">
          {category.description}
        </p>
      </div>

      {/* View films link */}
      <div className="mt-4 flex items-center text-sm text-white/80 group">
        <span className="group-hover:underline">View Films</span>
        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Decorative element */}
      <div
        className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle, white 0%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}

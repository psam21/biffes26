"use client";

import { Film } from "@/lib/icons";
import { Category } from "@/types";
import { cn, getCategoryGradient, getCategoryBorderColor } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
  index: number;
  actualFilmCount?: number;
}

export function CategoryCard({ category, onClick, index, actualFilmCount }: CategoryCardProps) {
  const displayCount = actualFilmCount ?? category.filmCount;
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${category.name} - ${displayCount} films`}
      style={{
        animationDelay: `${Math.min(index * 30, 300)}ms`,
      }}
      className={cn(
        "relative cursor-pointer rounded-lg p-3 border overflow-hidden",
        "bg-gradient-to-br",
        getCategoryGradient(category.color),
        getCategoryBorderColor(category.color),
        // CSS animation for entrance
        "animate-fade-in-up opacity-0",
        // CSS transitions for hover/active
        "transition-all duration-200 ease-out",
        "hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30",
        "active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
      )}
    >
      {/* Film count badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
        <Film className="w-3 h-3 text-white/80" />
        <span className="text-xs font-medium text-white/90">
          {displayCount}
        </span>
      </div>

      {/* Category info */}
      <div>
        <h3 className="text-sm font-semibold text-white pr-12 leading-tight line-clamp-2">
          {category.name}
        </h3>
      </div>

      {/* Decorative element */}
      <div
        className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, white 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

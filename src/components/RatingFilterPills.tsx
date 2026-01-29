"use client";

import { memo } from "react";

interface RatingOption {
  min: number;
  label: string;
  count: number;
}

interface RatingFilterPillsProps {
  options: RatingOption[];
  onFilter: (minRating: number) => void;
}

function RatingFilterPillsComponent({ options, onFilter }: RatingFilterPillsProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 pb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-zinc-500">Filter by rating:</span>
        {options.map(({ min, label, count }) => (
          <button
            key={min}
            onClick={() => onFilter(min)}
            disabled={count === 0}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              count > 0
                ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
                : "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>
    </section>
  );
}

export const RatingFilterPills = memo(RatingFilterPillsComponent);

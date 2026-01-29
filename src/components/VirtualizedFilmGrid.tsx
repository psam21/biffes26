"use client";

import { useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Film } from "@/types";
import { FilmCard } from "./FilmCard";

interface VirtualizedFilmGridProps {
  films: Film[];
  onFilmClick: (film: Film, filmList: Film[], index: number) => void;
  emptyState?: React.ReactNode;
}

// Column breakpoints matching Tailwind classes
const BREAKPOINTS = {
  xl: 1280,  // 6 columns
  lg: 1024,  // 5 columns
  md: 768,   // 4 columns
  sm: 640,   // 3 columns
  default: 0 // 2 columns
};

function getColumnCount(width: number): number {
  if (width >= BREAKPOINTS.xl) return 6;
  if (width >= BREAKPOINTS.lg) return 5;
  if (width >= BREAKPOINTS.md) return 4;
  if (width >= BREAKPOINTS.sm) return 3;
  return 2;
}

// Card dimensions (aspect-[2/3] poster + info section)
const GAP = 16; // gap-4 = 1rem = 16px
const CARD_ASPECT_RATIO = 2 / 3;
const INFO_HEIGHT = 140; // title (2 lines) + director + country/year + padding

export function VirtualizedFilmGrid({ 
  films, 
  onFilmClick,
  emptyState 
}: VirtualizedFilmGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Track container width for responsive columns
  const containerWidth = useRef(0);
  
  // Get current column count based on window width
  const getColumns = useCallback(() => {
    if (typeof window === 'undefined') return 2;
    return getColumnCount(window.innerWidth);
  }, []);
  
  const columns = useMemo(() => getColumns(), [getColumns]);
  
  // Calculate row count
  const rowCount = Math.ceil(films.length / columns);
  
  // Estimate row height based on container width
  const estimateRowHeight = useCallback(() => {
    if (!parentRef.current) return 300;
    const containerW = parentRef.current.offsetWidth;
    containerWidth.current = containerW;
    const cardWidth = (containerW - (columns - 1) * GAP) / columns;
    const posterHeight = cardWidth / CARD_ASPECT_RATIO;
    return posterHeight + INFO_HEIGHT + GAP;
  }, [columns]);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateRowHeight,
    overscan: 2, // Render 2 extra rows above/below viewport
  });

  if (films.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowFilms = films.slice(startIndex, startIndex + columns);
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                minHeight: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {rowFilms.map((film, colIndex) => {
                  const filmIndex = startIndex + colIndex;
                  return (
                    <FilmCard
                      key={film.id}
                      film={film}
                      onClick={() => onFilmClick(film, films, filmIndex)}
                      index={0} // Remove staggered animation for virtualized grid
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

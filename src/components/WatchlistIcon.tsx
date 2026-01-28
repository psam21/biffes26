"use client";

import { cn } from "@/lib/utils";

interface WatchlistIconProps {
  className?: string;
  filled?: boolean;
  size?: number;
}

export function WatchlistIcon({ className, filled = false, size = 24 }: WatchlistIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("transition-all duration-200", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Film reel / ticket shape with bookmark */}
      {filled ? (
        <>
          {/* Filled version - for active watchlist state */}
          <path
            d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V21L12 17L4 21V4Z"
            fill="currentColor"
          />
          {/* Film perforations */}
          <circle cx="7" cy="6" r="1" fill="black" fillOpacity="0.3" />
          <circle cx="7" cy="10" r="1" fill="black" fillOpacity="0.3" />
          <circle cx="17" cy="6" r="1" fill="black" fillOpacity="0.3" />
          <circle cx="17" cy="10" r="1" fill="black" fillOpacity="0.3" />
          {/* Check mark */}
          <path
            d="M9 10L11 12L15 8"
            stroke="black"
            strokeOpacity="0.4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          {/* Outline version - for empty/add state */}
          <path
            d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V21L12 17L4 21V4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Film perforations */}
          <circle cx="7" cy="6" r="1" fill="currentColor" fillOpacity="0.5" />
          <circle cx="7" cy="10" r="1" fill="currentColor" fillOpacity="0.5" />
          <circle cx="17" cy="6" r="1" fill="currentColor" fillOpacity="0.5" />
          <circle cx="17" cy="10" r="1" fill="currentColor" fillOpacity="0.5" />
          {/* Plus sign */}
          <path
            d="M12 7V13M9 10H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

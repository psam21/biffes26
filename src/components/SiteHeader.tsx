"use client";

import Link from "next/link";
import { SiteNav } from "./SiteNav";

interface SiteHeaderProps {
  variant?: "full" | "compact";
  sticky?: boolean;
  className?: string;
}

export function SiteHeader({ variant = "compact", sticky = true, className = "" }: SiteHeaderProps) {
  return (
    <header 
      className={`${sticky ? "sticky top-0 z-50" : ""} bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Festival Hero Banner */}
        <div className={`${variant === "full" ? "py-4" : "py-2"}`}>
          <Link href="/" className="block group">
            <h1 className={`font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent ${
              variant === "full" ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
            }`}>
              🎬 17th BIFFes
              <span className="hidden sm:inline"> – Bangalore International Film Festival</span>
            </h1>
            <p className={`text-zinc-400 ${variant === "full" ? "text-sm mt-1" : "text-xs"}`}>
              <span className="text-zinc-300">January 30 – February 6, 2026</span>
              <span className="mx-2 text-zinc-600">|</span>
              <span className="text-zinc-500">LULU Mall • Rajkumar Bhavana • Suchitra</span>
            </p>
          </Link>
        </div>
        
        {/* Navigation */}
        <div className="pb-2 -mx-1 overflow-x-auto scrollbar-hide">
          <SiteNav variant="minimal" />
        </div>
      </div>
    </header>
  );
}

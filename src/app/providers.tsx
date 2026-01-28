"use client";

import { WatchlistProvider } from "@/lib/watchlist-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WatchlistProvider>
      {children}
    </WatchlistProvider>
  );
}

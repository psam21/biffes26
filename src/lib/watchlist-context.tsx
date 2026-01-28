"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface WatchlistContextType {
  watchlist: string[];
  userId: string | null;
  isInWatchlist: (filmId: string) => boolean;
  addToWatchlist: (filmId: string) => Promise<void>;
  removeFromWatchlist: (filmId: string) => Promise<void>;
  toggleWatchlist: (filmId: string) => Promise<void>;
  isLoading: boolean;
  syncCode: string | null;
  generateSyncCode: () => Promise<string | null>;
  loadFromSyncCode: (code: string) => Promise<boolean>;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

// Generate a UUID for anonymous users
function generateUserId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate a short sync code (6 characters)
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0/O, 1/I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user ID and load watchlist
  useEffect(() => {
    const initUser = async () => {
      let id = localStorage.getItem("biffes_user_id");
      if (!id) {
        id = generateUserId();
        localStorage.setItem("biffes_user_id", id);
      }
      setUserId(id);

      // Load existing sync code if any
      const existingCode = localStorage.getItem("biffes_sync_code");
      if (existingCode) {
        setSyncCode(existingCode);
      }

      // Load watchlist from server
      try {
        const res = await fetch(`/api/watchlist?userId=${id}`);
        if (res.ok) {
          const data = await res.json();
          setWatchlist(data.watchlist || []);
        }
      } catch (error) {
        console.error("Failed to load watchlist:", error);
        // Try to load from localStorage as fallback
        const localWatchlist = localStorage.getItem("biffes_watchlist");
        if (localWatchlist) {
          setWatchlist(JSON.parse(localWatchlist));
        }
      }
      setIsLoading(false);
    };

    initUser();
  }, []);

  // Sync to localStorage as backup
  useEffect(() => {
    if (watchlist.length > 0) {
      localStorage.setItem("biffes_watchlist", JSON.stringify(watchlist));
    }
  }, [watchlist]);

  const isInWatchlist = useCallback((filmId: string) => {
    return watchlist.includes(filmId);
  }, [watchlist]);

  const addToWatchlist = useCallback(async (filmId: string) => {
    if (!userId || watchlist.includes(filmId)) return;

    // Optimistic update
    setWatchlist(prev => [...prev, filmId]);

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, filmId, action: "add" }),
      });
      
      if (!res.ok) {
        // Revert on failure
        setWatchlist(prev => prev.filter(id => id !== filmId));
      }
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      setWatchlist(prev => prev.filter(id => id !== filmId));
    }
  }, [userId, watchlist]);

  const removeFromWatchlist = useCallback(async (filmId: string) => {
    if (!userId || !watchlist.includes(filmId)) return;

    // Optimistic update
    setWatchlist(prev => prev.filter(id => id !== filmId));

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, filmId, action: "remove" }),
      });
      
      if (!res.ok) {
        // Revert on failure
        setWatchlist(prev => [...prev, filmId]);
      }
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
      setWatchlist(prev => [...prev, filmId]);
    }
  }, [userId, watchlist]);

  const toggleWatchlist = useCallback(async (filmId: string) => {
    if (isInWatchlist(filmId)) {
      await removeFromWatchlist(filmId);
    } else {
      await addToWatchlist(filmId);
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

  const generateSyncCode = useCallback(async (): Promise<string | null> => {
    if (!userId) return null;

    try {
      const code = generateShortCode();
      const res = await fetch("/api/watchlist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code, action: "create" }),
      });

      if (res.ok) {
        setSyncCode(code);
        localStorage.setItem("biffes_sync_code", code);
        return code;
      }
    } catch (error) {
      console.error("Failed to generate sync code:", error);
    }
    return null;
  }, [userId]);

  const loadFromSyncCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/watchlist/sync?code=${code.toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.watchlist) {
          setWatchlist(data.watchlist);
          // Update our user's watchlist in Redis too
          if (userId) {
            await fetch("/api/watchlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, watchlist: data.watchlist, action: "sync" }),
            });
          }
          return true;
        }
      }
    } catch (error) {
      console.error("Failed to load from sync code:", error);
    }
    return false;
  }, [userId]);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        userId,
        isInWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        isLoading,
        syncCode,
        generateSyncCode,
        loadFromSyncCode,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}

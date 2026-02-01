"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";

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

// Cache configuration
const CACHE_VERSION = 1;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes - don't re-sync more often than this
const STORAGE_KEYS = {
  userId: "biffes_user_id",
  watchlist: "biffes_watchlist",
  syncCode: "biffes_sync_code",
  lastSync: "biffes_last_sync",
  cacheVersion: "biffes_cache_version",
} as const;

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

// Check if we should sync with server (not too recently)
function shouldSyncWithServer(): boolean {
  try {
    const lastSync = localStorage.getItem(STORAGE_KEYS.lastSync);
    if (!lastSync) return true;
    const elapsed = Date.now() - parseInt(lastSync, 10);
    return elapsed > SYNC_INTERVAL_MS;
  } catch {
    return true;
  }
}

// Mark sync timestamp
function markSynced(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.lastSync, Date.now().toString());
  } catch {
    // Storage full or unavailable
  }
}

// Check and migrate cache if version changed
function checkCacheVersion(): void {
  try {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.cacheVersion);
    if (storedVersion !== CACHE_VERSION.toString()) {
      // Version mismatch - could clear cache here if needed for breaking changes
      localStorage.setItem(STORAGE_KEYS.cacheVersion, CACHE_VERSION.toString());
    }
  } catch {
    // Storage unavailable
  }
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // 2.6: Track if initial server sync has completed to prevent race condition
  const [hasInitialSync, setHasInitialSync] = useState(false);
  
  // Track pending changes for debounced sync
  const pendingChangesRef = useRef<{ add: Set<string>; remove: Set<string> }>({
    add: new Set(),
    remove: new Set(),
  });
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize user ID and load watchlist
  useEffect(() => {
    // Guard: only run on client side
    if (typeof window === 'undefined') return;
    
    const initUser = async () => {
      try {
        checkCacheVersion();
        
        let id = localStorage.getItem(STORAGE_KEYS.userId);
        if (!id) {
          id = generateUserId();
          localStorage.setItem(STORAGE_KEYS.userId, id);
        }
        setUserId(id);

        // Load existing sync code if any
        const existingCode = localStorage.getItem(STORAGE_KEYS.syncCode);
        if (existingCode) {
          setSyncCode(existingCode);
        }

        // Load from localStorage first (instant) - this is the cache
        const localWatchlist = localStorage.getItem(STORAGE_KEYS.watchlist);
        const localData: string[] = localWatchlist ? JSON.parse(localWatchlist) : [];
        if (localData.length > 0) {
          setWatchlist(localData);
        }
        
        // Mark loading done immediately - user sees cached data
        setIsLoading(false);

        // Background sync with server (if not recently synced)
        if (shouldSyncWithServer()) {
          try {
            const res = await fetch(`/api/watchlist?userId=${id}`);
            if (res.ok) {
              const data = await res.json();
              const serverData: string[] = data.watchlist || [];
              
              // Smart merge: union of local and server
              if (serverData.length > 0 || localData.length > 0) {
                const merged = [...new Set([...localData, ...serverData])];
                
                // Only update if different
                if (JSON.stringify(merged.sort()) !== JSON.stringify(localData.sort())) {
                  setWatchlist(merged);
                  localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(merged));
                }
                
                // Push merged to server if we had local-only items
                if (merged.length > serverData.length) {
                  await fetch("/api/watchlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: id, watchlist: merged, action: "sync" }),
                  });
                }
              }
              markSynced();
              setHasInitialSync(true); // 2.6: Mark initial sync complete
            }
          } catch (error) {
            console.error("Background sync failed:", error);
            // Keep using localStorage data - already set above
            setHasInitialSync(true); // 2.6: Mark complete even on error
          }
        } else {
          setHasInitialSync(true); // 2.6: No sync needed, mark complete
        }
      } catch (error) {
        console.error("Failed to initialize watchlist:", error);
        setIsLoading(false);
        setHasInitialSync(true);
      }
    };

    initUser();
  }, []);

  // 2.6: Only sync to localStorage after initial server sync completes (prevents race)
  useEffect(() => {
    if (!isLoading && hasInitialSync) {
      localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(watchlist));
    }
  }, [watchlist, isLoading, hasInitialSync]);
  
  // Debounced server sync - batches rapid changes
  const scheduleServerSync = useCallback((currentUserId: string, currentWatchlist: string[]) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(async () => {
      // Only sync if there were pending changes
      if (pendingChangesRef.current.add.size > 0 || pendingChangesRef.current.remove.size > 0) {
        try {
          await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              userId: currentUserId, 
              watchlist: currentWatchlist, 
              action: "sync" 
            }),
          });
          // Clear pending changes on success
          pendingChangesRef.current.add.clear();
          pendingChangesRef.current.remove.clear();
          markSynced();
        } catch (error) {
          console.error("Debounced sync failed:", error);
        }
      }
    }, 1000); // 1 second debounce
  }, []);

  const isInWatchlist = useCallback((filmId: string) => {
    return watchlist.includes(filmId);
  }, [watchlist]);

  const addToWatchlist = useCallback(async (filmId: string) => {
    if (!userId || watchlist.includes(filmId)) return;

    // Optimistic update - instant UI response
    const newWatchlist = [...watchlist, filmId];
    setWatchlist(newWatchlist);
    
    // Track pending change
    pendingChangesRef.current.add.add(filmId);
    pendingChangesRef.current.remove.delete(filmId);
    
    // Schedule debounced sync (batches rapid adds)
    scheduleServerSync(userId, newWatchlist);
  }, [userId, watchlist, scheduleServerSync]);

  const removeFromWatchlist = useCallback(async (filmId: string) => {
    if (!userId || !watchlist.includes(filmId)) return;

    // Optimistic update - instant UI response
    const newWatchlist = watchlist.filter(id => id !== filmId);
    setWatchlist(newWatchlist);
    
    // Track pending change
    pendingChangesRef.current.remove.add(filmId);
    pendingChangesRef.current.add.delete(filmId);
    
    // Schedule debounced sync (batches rapid removes)
    scheduleServerSync(userId, newWatchlist);
  }, [userId, watchlist, scheduleServerSync]);

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
        localStorage.setItem(STORAGE_KEYS.syncCode, code);
        return code;
      }
    } catch (error) {
      console.error("Failed to generate sync code:", error);
    }
    return null;
  }, [userId]);

  // 2.2: Improved error handling - returns result with error type
  const loadFromSyncCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/watchlist/sync?code=${code.toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.watchlist) {
          setWatchlist(data.watchlist);
          localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(data.watchlist));
          markSynced();
          
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
        // Code found but no watchlist data
        console.warn("Sync code found but no watchlist data");
        return false;
      }
      // Code not found (404) or other error
      if (res.status === 404) {
        console.warn("Sync code not found");
      } else {
        console.error("Server error loading sync code:", res.status);
      }
      return false;
    } catch (error) {
      // Network error - different from "code not found"
      console.error("Network error loading sync code:", error);
      return false;
    }
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

/**
 * Optimized hook for WatchlistButton - only re-renders when this specific film's
 * watchlist status changes, not when ANY film is added/removed.
 */
export function useWatchlistItem(filmId: string) {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlistItem must be used within a WatchlistProvider");
  }
  
  const { watchlist, toggleWatchlist, isLoading } = context;
  
  // Memoize the inWatchlist value for this specific film
  const inWatchlist = useMemo(() => watchlist.includes(filmId), [watchlist, filmId]);
  
  // Memoize the toggle function for this film
  const toggle = useCallback(() => toggleWatchlist(filmId), [toggleWatchlist, filmId]);
  
  return { inWatchlist, toggle, isLoading };
}

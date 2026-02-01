import { NextResponse } from "next/server";
import { getLastUpdated, getFestivalData, redis } from "@/lib/upstash";
import staticData from "@/data/biffes_data.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if Upstash is configured
    const isUpstashConfigured = !!(
      process.env.UPSTASH_REDIS_REST_URL && 
      process.env.UPSTASH_REDIS_REST_TOKEN
    );

    let redisLastUpdated: string | null = null;
    let redisFilmCount: number | null = null;
    let syncCodesCreated: number | null = null;
    let activeWatchlists: number | null = null;

    if (isUpstashConfigured && redis) {
      redisLastUpdated = await getLastUpdated();
      const data = await getFestivalData();
      if (data) {
        redisFilmCount = data.films.length;
      }
      
      // Count sync codes and watchlists using SCAN
      try {
        // Count sync codes (pattern: biffes:sync:*)
        let syncCursor = 0;
        let syncCount = 0;
        do {
          const [newCursor, keys] = await redis.scan(syncCursor, { match: "biffes:sync:*", count: 100 });
          syncCursor = Number(newCursor);
          syncCount += keys.length;
        } while (syncCursor !== 0);
        syncCodesCreated = syncCount;

        // Count watchlists (pattern: biffes:watchlist:*)
        let watchlistCursor = 0;
        let watchlistCount = 0;
        do {
          const [newCursor, keys] = await redis.scan(watchlistCursor, { match: "biffes:watchlist:*", count: 100 });
          watchlistCursor = Number(newCursor);
          watchlistCount += keys.length;
        } while (watchlistCursor !== 0);
        activeWatchlists = watchlistCount;
      } catch (scanError) {
        console.error("Error scanning Redis keys:", scanError);
      }
    }

    return NextResponse.json({
      status: "ok",
      upstash: {
        configured: isUpstashConfigured,
        lastUpdated: redisLastUpdated,
        filmCount: redisFilmCount,
      },
      static: {
        lastUpdated: (staticData as { festival: { lastUpdated: string } }).festival.lastUpdated,
        filmCount: (staticData as { films: unknown[] }).films.length,
      },
      source: isUpstashConfigured && redisLastUpdated ? "upstash" : "static",
      syncCodesCreated,
      activeWatchlists,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: "error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

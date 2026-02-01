import { NextRequest, NextResponse } from "next/server";
import { redis, isRedisAvailable } from "@/lib/upstash";

// Redis key pattern for watchlists: biffes:watchlist:{userId}
const getWatchlistKey = (userId: string) => `biffes:watchlist:${userId}`;
const getRateLimitKey = (ip: string) => `biffes:ratelimit:${ip}`;

// Rate limiting: max 60 requests per minute per IP (2.1)
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60; // seconds

async function checkRateLimit(request: NextRequest): Promise<{ allowed: boolean; remaining: number }> {
  if (!isRedisAvailable()) {
    return { allowed: true, remaining: RATE_LIMIT_MAX }; // Skip rate limiting if Redis unavailable
  }
  
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const key = getRateLimitKey(ip);
  
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    return { 
      allowed: current <= RATE_LIMIT_MAX, 
      remaining: Math.max(0, RATE_LIMIT_MAX - current) 
    };
  } catch {
    return { allowed: true, remaining: RATE_LIMIT_MAX }; // Allow on error
  }
}

export async function GET(request: NextRequest) {
  // Rate limiting (2.1)
  const { allowed, remaining } = await checkRateLimit(request);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" }, 
      { status: 429, headers: { "X-RateLimit-Remaining": remaining.toString() } }
    );
  }
  
  const userId = request.nextUrl.searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json({ watchlist: [], source: "none" });
    }

    const watchlist = await redis.get<string[]>(getWatchlistKey(userId));
    return NextResponse.json({ 
      watchlist: watchlist || [], 
      source: "redis" 
    });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json({ watchlist: [], error: "fetch_failed" });
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting (2.1)
  const { allowed, remaining } = await checkRateLimit(request);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" }, 
      { status: 429, headers: { "X-RateLimit-Remaining": remaining.toString() } }
    );
  }
  
  try {
    const body = await request.json();
    const { userId, filmId, action, watchlist: syncWatchlist } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json({ success: false, error: "Redis not configured" });
    }

    const key = getWatchlistKey(userId);

    if (action === "sync" && Array.isArray(syncWatchlist)) {
      // Full sync - replace entire watchlist
      await redis.set(key, syncWatchlist);
      return NextResponse.json({ success: true, watchlist: syncWatchlist });
    }

    if (!filmId) {
      return NextResponse.json({ error: "filmId required" }, { status: 400 });
    }

    // Get current watchlist
    const current = await redis.get<string[]>(key) || [];

    let updated: string[];
    if (action === "add") {
      if (current.includes(filmId)) {
        return NextResponse.json({ success: true, watchlist: current });
      }
      updated = [...current, filmId];
    } else if (action === "remove") {
      updated = current.filter(id => id !== filmId);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await redis.set(key, updated);
    
    return NextResponse.json({ success: true, watchlist: updated });
  } catch (error) {
    console.error("Error updating watchlist:", error);
    return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 });
  }
}

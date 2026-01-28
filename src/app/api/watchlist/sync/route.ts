import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";

// Redis key pattern for sync codes: biffes:sync:{code}
const getSyncKey = (code: string) => `biffes:sync:${code.toUpperCase()}`;
const getWatchlistKey = (userId: string) => `biffes:watchlist:${userId}`;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    }

    // Get the userId associated with this sync code
    const userId = await redis.get<string>(getSyncKey(code.toUpperCase()));
    
    if (!userId) {
      return NextResponse.json({ error: "Invalid sync code" }, { status: 404 });
    }

    // Get that user's watchlist
    const watchlist = await redis.get<string[]>(getWatchlistKey(userId)) || [];
    
    return NextResponse.json({ watchlist, code: code.toUpperCase() });
  } catch (error) {
    console.error("Error fetching sync code:", error);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code, action } = body;

    if (!userId || !code) {
      return NextResponse.json({ error: "userId and code required" }, { status: 400 });
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    }

    if (action === "create") {
      // Store the sync code -> userId mapping (expires in 30 days)
      await redis.set(getSyncKey(code), userId, { ex: 30 * 24 * 60 * 60 });
      
      return NextResponse.json({ success: true, code: code.toUpperCase() });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error creating sync code:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}

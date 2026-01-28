import { NextResponse } from "next/server";
import { getLastUpdated, getFestivalData } from "@/lib/upstash";
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

    if (isUpstashConfigured) {
      redisLastUpdated = await getLastUpdated();
      const data = await getFestivalData();
      if (data) {
        redisFilmCount = data.films.length;
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

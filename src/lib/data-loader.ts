import { getFestivalData, type FestivalData } from "./upstash";
import staticData from "@/data/biffes_data.json";

/**
 * Load festival data with fallback chain:
 * 1. Try Upstash Redis (cloud)
 * 2. Fall back to static JSON (build-time data)
 */
export async function loadFestivalData(): Promise<FestivalData> {
  // Try Redis first (if configured)
  const redisData = await getFestivalData();
  if (redisData) {
    console.log("📡 Loaded data from Upstash Redis");
    return redisData;
  }

  // Fall back to static data
  console.log("📁 Using static JSON data");
  return staticData as FestivalData;
}

/**
 * For client-side components that need synchronous access,
 * export the static data directly
 */
export function getStaticFestivalData(): FestivalData {
  return staticData as FestivalData;
}

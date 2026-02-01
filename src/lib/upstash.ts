import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client
// Set these in Vercel Environment Variables:
// - UPSTASH_REDIS_REST_URL
// - UPSTASH_REDIS_REST_TOKEN

// Only create Redis client if credentials are available
const hasRedisCredentials = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = hasRedisCredentials
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : (null as unknown as Redis); // Type assertion for conditional usage

// Check if Redis is available
export function isRedisAvailable(): boolean {
  return hasRedisCredentials && redis !== null;
}

// Keys for storing data
export const REDIS_KEYS = {
  FESTIVAL_DATA: "biffes:festival",
  FILMS: "biffes:films",
  CATEGORIES: "biffes:categories",
  LAST_UPDATED: "biffes:lastUpdated",
  FILM_IDS: "biffes:filmIds",           // Set of known film IDs
  CATEGORY_COUNTS: "biffes:catCounts",  // Map of category -> film count
} as const;

// Type for the festival data structure
export interface FestivalData {
  festival: {
    name: string;
    edition: number;
    year: number;
    dates: string;
    totalFilms: number;
    totalCountries: number;
    venues: Array<{
      name: string;
      address: string;
      mapUrl: string;
    }>;
    lastUpdated: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    filmCount: number;
    color: string;
    hasSubcategories: boolean;
  }>;
  films: Array<{
    id: string;
    title: string;
    originalTitle?: string;
    kannadaTitle?: string;
    director: string;
    country: string;
    year: number;
    duration: number;
    language: string;
    synopsis: string;
    posterUrl: string;
    posterUrlRemote?: string;
    categoryId: string;
    producer?: string;
    screenplay?: string;
    cinematography?: string;
    editor?: string;
    music?: string;
    sound?: string;
    cast?: string;
    awardsWon?: string;
    awardsNominated?: string;
    filmCourtesy?: string;
    imdbRating?: string;
    rottenTomatoes?: string;
    metacritic?: string;
    letterboxdRating?: string;
    imdbId?: string;
  }>;
}

// Get festival data from Redis (with fallback to static JSON)
export async function getFestivalData(): Promise<FestivalData | null> {
  try {
    if (!isRedisAvailable()) {
      console.log("Upstash not configured, using static data");
      return null;
    }

    const data = await redis.get<FestivalData>(REDIS_KEYS.FESTIVAL_DATA);
    return data;
  } catch (error) {
    console.error("Error fetching from Redis:", error);
    return null;
  }
}

// TTL for festival data: 7 days (keeps data fresh, auto-expires after festival)
const FESTIVAL_DATA_TTL_SECONDS = 7 * 24 * 60 * 60;

// Save festival data to Redis with TTL
export async function saveFestivalData(data: FestivalData): Promise<boolean> {
  try {
    if (!isRedisAvailable()) return false;
    await redis.set(REDIS_KEYS.FESTIVAL_DATA, data, { ex: FESTIVAL_DATA_TTL_SECONDS });
    await redis.set(REDIS_KEYS.LAST_UPDATED, new Date().toISOString(), { ex: FESTIVAL_DATA_TTL_SECONDS });
    return true;
  } catch (error) {
    console.error("Error saving to Redis:", error);
    return false;
  }
}

// Get last update time
export async function getLastUpdated(): Promise<string | null> {
  try {
    if (!isRedisAvailable()) return null;
    return await redis.get<string>(REDIS_KEYS.LAST_UPDATED);
  } catch {
    return null;
  }
}

// Get stored film IDs for diff comparison
export async function getStoredFilmIds(): Promise<Set<string>> {
  try {
    if (!isRedisAvailable()) return new Set();
    const ids = await redis.get<string[]>(REDIS_KEYS.FILM_IDS);
    return new Set(ids || []);
  } catch {
    return new Set();
  }
}

// Save film IDs (2.5: add TTL to match festival data)
export async function saveFilmIds(ids: string[]): Promise<void> {
  try {
    if (!isRedisAvailable()) return;
    await redis.set(REDIS_KEYS.FILM_IDS, ids, { ex: FESTIVAL_DATA_TTL_SECONDS });
  } catch (error) {
    console.error("Error saving film IDs:", error);
  }
}

// Get stored category counts for quick-check
export async function getCategoryCounts(): Promise<Record<string, number>> {
  try {
    if (!isRedisAvailable()) return {};
    const counts = await redis.get<Record<string, number>>(REDIS_KEYS.CATEGORY_COUNTS);
    return counts || {};
  } catch {
    return {};
  }
}

// Save category counts (2.5: add TTL to match festival data)
export async function saveCategoryCounts(counts: Record<string, number>): Promise<void> {
  try {
    if (!isRedisAvailable()) return;
    await redis.set(REDIS_KEYS.CATEGORY_COUNTS, counts, { ex: FESTIVAL_DATA_TTL_SECONDS });
  } catch (error) {
    console.error("Error saving category counts:", error);
  }
}

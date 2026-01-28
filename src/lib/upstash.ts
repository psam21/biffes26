import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client
// Set these in Vercel Environment Variables:
// - UPSTASH_REDIS_REST_URL
// - UPSTASH_REDIS_REST_TOKEN
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
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

// Save festival data to Redis
export async function saveFestivalData(data: FestivalData): Promise<boolean> {
  try {
    await redis.set(REDIS_KEYS.FESTIVAL_DATA, data);
    await redis.set(REDIS_KEYS.LAST_UPDATED, new Date().toISOString());
    return true;
  } catch (error) {
    console.error("Error saving to Redis:", error);
    return false;
  }
}

// Get last update time
export async function getLastUpdated(): Promise<string | null> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return null;
    return await redis.get<string>(REDIS_KEYS.LAST_UPDATED);
  } catch {
    return null;
  }
}

// Get stored film IDs for diff comparison
export async function getStoredFilmIds(): Promise<Set<string>> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return new Set();
    const ids = await redis.get<string[]>(REDIS_KEYS.FILM_IDS);
    return new Set(ids || []);
  } catch {
    return new Set();
  }
}

// Save film IDs
export async function saveFilmIds(ids: string[]): Promise<void> {
  try {
    await redis.set(REDIS_KEYS.FILM_IDS, ids);
  } catch (error) {
    console.error("Error saving film IDs:", error);
  }
}

// Get stored category counts for quick-check
export async function getCategoryCounts(): Promise<Record<string, number>> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return {};
    const counts = await redis.get<Record<string, number>>(REDIS_KEYS.CATEGORY_COUNTS);
    return counts || {};
  } catch {
    return {};
  }
}

// Save category counts
export async function saveCategoryCounts(counts: Record<string, number>): Promise<void> {
  try {
    await redis.set(REDIS_KEYS.CATEGORY_COUNTS, counts);
  } catch (error) {
    console.error("Error saving category counts:", error);
  }
}

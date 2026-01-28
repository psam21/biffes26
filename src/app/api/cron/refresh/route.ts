import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { 
  saveFestivalData, 
  getFestivalData,
  getStoredFilmIds,
  saveFilmIds,
  getCategoryCounts,
  saveCategoryCounts,
  type FestivalData 
} from "@/lib/upstash";

// Protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

const BASE_URL = "https://biffes.org";
const OMDB_API_KEY = process.env.OMDB_API_KEY || "";

// Category definitions
const CATEGORIES = [
  { id: "18", name: "Opening Film", slug: "opening-film", color: "gold" },
  { id: "19", name: "Closing Film", slug: "closing-film", color: "gold" },
  { id: "1", name: "Asian Cinema Competition", slug: "asian-cinema", color: "asian" },
  { id: "2", name: "Indian Cinema Competition", slug: "indian-cinema", color: "indian" },
  { id: "3", name: "Kannada Cinema Competition", slug: "kannada-cinema", color: "kannada" },
  { id: "6", name: "Critics' Week", slug: "critics-week", color: "critics" },
  { id: "4", name: "Contemporary World Cinema", slug: "world-cinema", color: "world" },
  { id: "25", name: "Chronicles of Africa", slug: "africa", color: "africa" },
  { id: "7", name: "Bio-Pics", slug: "biopics", color: "biopics" },
  { id: "12", name: "Centenary Tributes", slug: "centenary-tributes", color: "retrospective" },
  { id: "26", name: "Voice for Equality", slug: "voice-equality", color: "world" },
  { id: "29", name: "Mid Festival Favourite", slug: "mid-festival", color: "gold" },
  { id: "24", name: "50 Years of Cinematic Journey", slug: "50-years", color: "retrospective" },
];

interface Film {
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
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch with timeout
async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BIFFes-Bot/1.0)" },
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Scrape film list from a category (returns film IDs and basic info)
async function scrapeCategory(categoryId: string): Promise<{ films: Film[]; count: number }> {
  const films: Film[] = [];
  const url = `${BASE_URL}/films?category_id=${categoryId}`;

  try {
    const response = await fetchWithTimeout(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    $("h3").each((_, el) => {
      const $h3 = $(el);
      const $link = $h3.find("a[href*='/filmdetails/']");
      if ($link.length === 0) return;

      const href = $link.attr("href") || "";
      const idMatch = href.match(/filmdetails\/(\d+)/);
      if (!idMatch) return;

      const id = idMatch[1];
      const title = $link.text().trim();
      
      const $card = $h3.parent();
      let posterUrl = $card.find("img").first().attr("src") || "";
      if (!posterUrl) {
        posterUrl = $h3.prev("img").attr("src") || $h3.prevAll("img").first().attr("src") || "";
      }
      
      const infoText = $card.text();
      const yearMatch = infoText.match(/(\d{4})\s*[•·]/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 2025;

      if (title && !films.find(f => f.id === id)) {
        films.push({
          id,
          title,
          director: "",
          country: "",
          year,
          duration: 0,
          language: "",
          synopsis: "",
          posterUrl: posterUrl.startsWith("http") ? posterUrl : posterUrl ? `${BASE_URL}${posterUrl}` : "",
          categoryId,
        });
      }
    });
  } catch (error) {
    console.error(`Error scraping category ${categoryId}:`, error);
  }

  return { films, count: films.length };
}

// Extract field from movie information section
function extractField($: cheerio.CheerioAPI, fieldName: string): string {
  let value = "";
  $(".text-color-movie").each((_, el) => {
    const label = $(el).text().trim().toLowerCase();
    if (label.includes(fieldName.toLowerCase())) {
      const valueEl = $(el).parent().find("p.text").first();
      value = valueEl.text().trim();
    }
  });
  return value;
}

// Scrape detailed film info
async function scrapeFilmDetails(film: Film): Promise<Film> {
  const url = `${BASE_URL}/filmdetails/${film.id}`;

  try {
    const response = await fetchWithTimeout(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const pageText = $("body").text();

    // Extract Kannada title
    const kannadaTitleEl = $("h2, h3, .kn-language-content").filter((_, el) => {
      const text = $(el).text().trim();
      return /[\u0C80-\u0CFF]/.test(text);
    }).first();
    const kannadaTitle = kannadaTitleEl.text().trim() || "";

    // Country
    const headerInfo = $(".filmdetails, .entry-meta").text();
    const countryMatch = headerInfo.match(/(INDIA|IRAN|JAPAN|SOUTH KOREA|KOREA|CHINA|NEPAL|PHILIPPINES|MYANMAR|BANGLADESH|SRI LANKA|PAKISTAN|THAILAND|INDONESIA|VIETNAM|MALAYSIA|SINGAPORE|TAIWAN|HONG KONG|KYRGYZSTAN|KAZAKHSTAN|UZBEKISTAN|MONGOLIA|AFGHANISTAN|USA|UK|FRANCE|GERMANY|ITALY|SPAIN|BRAZIL|ARGENTINA|MEXICO|CANADA|AUSTRALIA|NEW ZEALAND|POLAND|BELGIUM|NETHERLANDS|SWEDEN|NORWAY|DENMARK|FINLAND|SWITZERLAND|AUSTRIA)/i);
    const country = countryMatch ? countryMatch[1] : film.country;

    // Language
    const langLineMatch = headerInfo.match(/\/\s*([A-Z][A-Z\s|]+)\s*\/\s*\d{4}/i);
    let language = "";
    if (langLineMatch) {
      const langs = langLineMatch[1].split("|").map(l => l.trim().toLowerCase());
      language = [...new Set(langs)]
        .map(l => l.charAt(0).toUpperCase() + l.slice(1))
        .filter((l, i, arr) => {
          if (l === "Persian" && arr.includes("Farsi")) return false;
          if (l === "Chinese" && arr.includes("Mandarin")) return false;
          return true;
        })
        .join(" | ");
    }

    // Duration
    const durationMatch = pageText.match(/(\d+)\s*mins?/i);
    const duration = durationMatch ? parseInt(durationMatch[1]) : film.duration;

    // Year
    const yearMatch = headerInfo.match(/\/\s*(20[12]\d)\s*\//i);
    const year = yearMatch ? parseInt(yearMatch[1]) : film.year;

    // Synopsis
    const synopsisEl = $("#tab1 p.text, #tab1 .text").first();
    let synopsis = synopsisEl.text().trim();
    synopsis = synopsis.replace(/[\u0C80-\u0CFF]+/g, "").trim();
    synopsis = synopsis.replace(/\s+/g, " ").slice(0, 800);

    // Crew
    const producer = extractField($, "producer");
    const screenplay = extractField($, "screenplay");
    const cinematography = extractField($, "photography") || extractField($, "cinematograph");
    const editor = extractField($, "editor");
    const music = extractField($, "music");
    const sound = extractField($, "sound");
    const cast = extractField($, "cast");
    
    // Awards
    const awardsWon = extractField($, "awards - winner");
    const awardsNominated = extractField($, "nomination") || extractField($, "official selection") || extractField($, "screened");

    // Poster
    const posterImg = $("img[src*='stills_img'], img[src*='poster']").first();
    const posterUrl = posterImg.attr("src") || film.posterUrl;

    return {
      ...film,
      kannadaTitle: kannadaTitle || film.kannadaTitle,
      country: country || film.country,
      language: language || film.language,
      duration: duration || film.duration,
      year: year || film.year,
      synopsis: synopsis || film.synopsis,
      posterUrl: posterUrl.startsWith("http") ? posterUrl : `${BASE_URL}${posterUrl}`,
      producer, screenplay, cinematography, editor, music, sound, cast,
      awardsWon, awardsNominated,
    };
  } catch (error) {
    console.error(`Error scraping film ${film.id}:`, error);
    return film;
  }
}

// Fetch OMDB ratings
async function fetchOMDBRatings(film: Film): Promise<Film> {
  if (!OMDB_API_KEY) return film;

  try {
    const searchTitle = film.title.replace(/[^\w\s]/g, "").trim();
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(searchTitle)}&y=${film.year}`;
    
    const response = await fetchWithTimeout(url, 5000);
    const data = await response.json();

    if (data.Response === "True") {
      const ratings: Partial<Film> = {
        imdbId: data.imdbID,
        imdbRating: data.imdbRating !== "N/A" ? data.imdbRating : undefined,
      };

      if (data.Ratings) {
        for (const rating of data.Ratings) {
          if (rating.Source === "Rotten Tomatoes") {
            ratings.rottenTomatoes = rating.Value;
          } else if (rating.Source === "Metacritic") {
            ratings.metacritic = rating.Value;
          }
        }
      }

      return { ...film, ...ratings };
    }
  } catch (error) {
    console.error(`OMDB error for ${film.title}:`, error);
  }

  return film;
}

function getDescription(name: string): string {
  const descriptions: Record<string, string> = {
    "Opening Film": "The prestigious opening film of the festival",
    "Closing Film": "The grand finale film of the festival",
    "Asian Cinema Competition": "Outstanding films from across Asia competing for top honors",
    "Indian Cinema Competition": "The best of contemporary Indian cinema from all languages",
    "Kannada Cinema Competition": "Celebrating excellence in Kannada language cinema",
    "Critics' Week": "Films selected by acclaimed critics for their artistic merit",
    "Contemporary World Cinema": "A curated selection of the finest films from around the globe",
    "Chronicles of Africa": "Stories from the African continent",
    "Bio-Pics": "Biographical films celebrating extraordinary lives",
    "Centenary Tributes": "Honoring filmmakers completing 100 years",
    "Voice for Equality": "Films championing social justice and equality",
    "Mid Festival Favourite": "Audience favourite selections mid-festival",
    "50 Years of Cinematic Journey": "Celebrating half a century of exceptional filmmaking",
  };
  return descriptions[name] || "Curated film selection";
}

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron or has the secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  console.log("🎬 Starting BIFFes incremental data refresh...");

  try {
    // Load existing data from Redis
    const existingData = await getFestivalData();
    const existingFilmIds = await getStoredFilmIds();
    const existingCategoryCounts = await getCategoryCounts();
    
    // Create a map of existing films for quick lookup
    const existingFilmsMap = new Map<string, Film>();
    if (existingData?.films) {
      for (const film of existingData.films) {
        existingFilmsMap.set(film.id, film as Film);
      }
    }

    console.log(`📊 Existing: ${existingFilmIds.size} films in ${Object.keys(existingCategoryCounts).length} categories`);

    // Step 1: Quick-check categories for changes
    console.log("🔍 Step 1: Checking categories for changes...");
    const newCategoryCounts: Record<string, number> = {};
    const changedCategories: string[] = [];
    const allScrapedFilms: Film[] = [];
    const newFilmIds = new Set<string>();

    for (const cat of CATEGORIES) {
      const { films, count } = await scrapeCategory(cat.id);
      newCategoryCounts[cat.id] = count;
      
      // Check if this category changed
      const oldCount = existingCategoryCounts[cat.id] || 0;
      if (count !== oldCount) {
        changedCategories.push(cat.name);
        console.log(`   📁 ${cat.name}: ${oldCount} → ${count} films`);
      }
      
      // Track all films
      for (const film of films) {
        if (!newFilmIds.has(film.id)) {
          newFilmIds.add(film.id);
          allScrapedFilms.push(film);
        }
      }
      
      await delay(200);
    }

    // Identify new vs existing films
    const newFilms: Film[] = [];
    const existingFilms: Film[] = [];
    
    for (const film of allScrapedFilms) {
      if (existingFilmIds.has(film.id) && existingFilmsMap.has(film.id)) {
        // Keep existing film data (already has details)
        existingFilms.push(existingFilmsMap.get(film.id)!);
      } else {
        newFilms.push(film);
      }
    }

    console.log(`\n📈 Changes detected:`);
    console.log(`   • ${changedCategories.length} categories changed`);
    console.log(`   • ${newFilms.length} new films to fetch`);
    console.log(`   • ${existingFilms.length} existing films (cached)`);

    // Step 2: Only fetch details for NEW films
    if (newFilms.length > 0) {
      console.log(`\n📝 Step 2: Fetching details for ${newFilms.length} new films...`);
      for (let i = 0; i < newFilms.length; i++) {
        newFilms[i] = await scrapeFilmDetails(newFilms[i]);
        console.log(`   [${i + 1}/${newFilms.length}] ${newFilms[i].title}`);
        await delay(250);
      }
    } else {
      console.log("\n⏭️  Step 2: No new films to fetch");
    }

    // Combine existing + new films
    const allFilms = [...existingFilms, ...newFilms];

    // Step 3: Fetch ratings only for films without ratings
    const filmsNeedingRatings = allFilms.filter(f => !f.imdbRating && !f.imdbId);
    
    if (OMDB_API_KEY && filmsNeedingRatings.length > 0) {
      console.log(`\n⭐ Step 3: Fetching ratings for ${filmsNeedingRatings.length} films...`);
      for (let i = 0; i < filmsNeedingRatings.length; i++) {
        const idx = allFilms.findIndex(f => f.id === filmsNeedingRatings[i].id);
        if (idx !== -1) {
          allFilms[idx] = await fetchOMDBRatings(allFilms[idx]);
        }
        await delay(200);
      }
    } else if (!OMDB_API_KEY) {
      console.log("\n⏭️  Step 3: Skipping ratings (no OMDB_API_KEY)");
    } else {
      console.log("\n⏭️  Step 3: All films already have ratings");
    }

    // Step 4: Build category data
    const categoryData = CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: getDescription(cat.name),
      filmCount: allFilms.filter(f => f.categoryId === cat.id).length,
      color: cat.color,
      hasSubcategories: false,
    }));

    // Step 5: Save to Upstash
    console.log("\n💾 Step 4: Saving to Upstash...");
    
    const festivalData: FestivalData = {
      festival: {
        name: "Bengaluru International Film Festival",
        edition: 17,
        year: 2026,
        dates: "January 29 – February 6, 2026",
        totalFilms: allFilms.length,
        totalCountries: new Set(allFilms.map(f => f.country).filter(Boolean)).size,
        venues: [
          {
            name: "LULU Mall",
            address: "Mysore Deviation Road, Rajajinagar, Bengaluru-560023",
            mapUrl: "https://maps.app.goo.gl/qk8Kk9QQVWizdCqn7",
          },
          {
            name: "Dr. Rajkumar Bhavana",
            address: "Chamrajpet, Bengaluru-560002",
            mapUrl: "https://maps.app.goo.gl/8JZbsK4CSEm4AWm36",
          },
          {
            name: "Suchitra Cinema",
            address: "Banashankari Stage II, Bengaluru-560070",
            mapUrl: "https://maps.app.goo.gl/ruU2WZ2T991hrSLo7",
          },
        ],
        lastUpdated: new Date().toISOString(),
      },
      categories: categoryData,
      films: allFilms,
    };

    // Save all data
    const saved = await saveFestivalData(festivalData);
    await saveFilmIds(Array.from(newFilmIds));
    await saveCategoryCounts(newCategoryCounts);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (saved) {
      const summary = {
        success: true,
        mode: "incremental",
        message: newFilms.length > 0 
          ? `Added ${newFilms.length} new films` 
          : "No changes detected",
        stats: {
          totalFilms: allFilms.length,
          newFilms: newFilms.length,
          cachedFilms: existingFilms.length,
          changedCategories: changedCategories.length,
          countries: festivalData.festival.totalCountries,
          withRatings: allFilms.filter(f => f.imdbRating).length,
          duration: `${duration}s`,
        },
        lastUpdated: festivalData.festival.lastUpdated,
      };
      
      console.log(`\n✅ Refresh complete in ${duration}s`);
      console.log(`   📽️  Total: ${allFilms.length} films`);
      console.log(`   🆕 New: ${newFilms.length} films`);
      console.log(`   💾 Cached: ${existingFilms.length} films`);
      
      return NextResponse.json(summary);
    } else {
      throw new Error("Failed to save to Upstash");
    }
  } catch (error) {
    console.error("❌ Refresh failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

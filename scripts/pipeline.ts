import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://biffes.org";
const OMDB_API_KEY = process.env.OMDB_API_KEY || ""; // Free API key from omdbapi.com

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
  director: string;
  country: string;
  year: number;
  duration: number;
  language: string;
  synopsis: string;
  posterUrl: string;
  posterUrlRemote?: string;
  categoryId: string;
  imdbRating?: string;
  rottenTomatoes?: string;
  metacritic?: string;
  imdbId?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  filmCount: number;
  color: string;
  hasSubcategories: boolean;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Scrape film list from a category
async function scrapeCategory(categoryId: string): Promise<Film[]> {
  const films: Film[] = [];
  const url = `${BASE_URL}/films?category_id=${categoryId}`;

  try {
    console.log(`  📁 Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Parse film cards - based on biffes.org structure
    $("a[href*='/filmdetails/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      const idMatch = href.match(/filmdetails\/(\d+)/);
      if (!idMatch) return;

      const id = idMatch[1];
      const title = $el.find("h3, .title").text().trim() || $el.text().trim();
      const posterUrl = $el.find("img").attr("src") || "";
      
      // Extract year and language from nearby text
      const infoText = $el.parent().text();
      const yearMatch = infoText.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 2025;

      if (title && !films.find(f => f.id === id)) {
        films.push({
          id,
          title: title.toUpperCase() === title ? title : title,
          director: "",
          country: "",
          year,
          duration: 0,
          language: "",
          synopsis: "",
          posterUrl: posterUrl.startsWith("http") ? posterUrl : `${BASE_URL}${posterUrl}`,
          categoryId,
        });
      }
    });

    console.log(`     Found ${films.length} films`);
  } catch (error) {
    console.error(`  ❌ Error scraping category ${categoryId}:`, (error as Error).message);
  }

  return films;
}

// Scrape detailed film info from film detail page
async function scrapeFilmDetails(film: Film): Promise<Film> {
  const url = `${BASE_URL}/filmdetails/${film.id}`;

  try {
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const pageText = $("body").text();

    // Extract director - look for pattern after title
    const directorMatch = pageText.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*\n*\s*INDIA|IRAN|JAPAN|KOREA|CHINA|NEPAL|PHILIPPINES|MYANMAR/i);
    
    // Extract from structured data if available
    const infoSection = $(".film-info, .movie-info, [class*='detail']").text();
    
    // Country extraction
    const countryMatch = pageText.match(/(INDIA|IRAN|JAPAN|SOUTH KOREA|KOREA|CHINA|NEPAL|PHILIPPINES|MYANMAR|BANGLADESH|SRI LANKA|PAKISTAN|THAILAND|INDONESIA|VIETNAM|MALAYSIA|SINGAPORE|TAIWAN|HONG KONG|KYRGYZSTAN|KAZAKHSTAN|UZBEKISTAN|MONGOLIA|AFGHANISTAN|USA|UK|FRANCE|GERMANY|ITALY|SPAIN|BRAZIL|ARGENTINA|MEXICO|CANADA|AUSTRALIA|NEW ZEALAND)/i);
    const country = countryMatch ? countryMatch[1] : "";

    // Language extraction
    const langMatch = pageText.match(/(KANNADA|HINDI|MALAYALAM|TAMIL|TELUGU|BENGALI|MARATHI|GUJARATI|PUNJABI|ASSAMESE|MANIPURI|ODIA|URDU|ENGLISH|FARSI|PERSIAN|JAPANESE|KOREAN|MANDARIN|CHINESE|NEPALI|TAGALOG|ROHINGYA|KYRGYZ|RUSSIAN|ARABIC|FRENCH|GERMAN|SPANISH|PORTUGUESE|ITALIAN|KARBI)/gi);
    const language = langMatch ? [...new Set(langMatch)].map(l => l.charAt(0) + l.slice(1).toLowerCase()).join(" | ") : "";

    // Duration extraction
    const durationMatch = pageText.match(/(\d+)\s*mins?/i);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 0;

    // Synopsis extraction
    const synopsisEl = $("p").filter((_, el) => {
      const text = $(el).text();
      return text.length > 100 && text.length < 1000 && !text.includes("©");
    }).first();
    const synopsis = synopsisEl.text().trim().slice(0, 500);

    // Better poster URL
    const posterImg = $("img[src*='stills_img'], img[src*='poster']").first();
    const posterUrl = posterImg.attr("src") || film.posterUrl;

    return {
      ...film,
      director: film.director || "",
      country: country || film.country,
      language: language || film.language,
      duration: duration || film.duration,
      synopsis: synopsis || film.synopsis,
      posterUrl: posterUrl.startsWith("http") ? posterUrl : `${BASE_URL}${posterUrl}`,
    };
  } catch (error) {
    console.error(`  ⚠️  Could not get details for ${film.title}`);
    return film;
  }
}

// Fetch ratings from OMDB API (IMDB data)
async function fetchRatings(film: Film): Promise<Film> {
  if (!OMDB_API_KEY) {
    return film;
  }

  try {
    // Search by title and year
    const searchUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(film.title)}&y=${film.year}`;
    const response = await axios.get(searchUrl, { timeout: 10000 });
    
    if (response.data.Response === "True") {
      const data = response.data;
      
      // Extract ratings
      const rtRating = data.Ratings?.find((r: any) => r.Source === "Rotten Tomatoes")?.Value;
      const mcRating = data.Ratings?.find((r: any) => r.Source === "Metacritic")?.Value;

      return {
        ...film,
        imdbRating: data.imdbRating !== "N/A" ? data.imdbRating : undefined,
        rottenTomatoes: rtRating,
        metacritic: mcRating,
        imdbId: data.imdbID,
      };
    }
  } catch (error) {
    // Silent fail - ratings are optional
  }

  return film;
}

// Try to fetch ratings from Letterboxd (scraping)
async function fetchLetterboxdRating(film: Film): Promise<string | undefined> {
  try {
    const searchTitle = film.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const url = `https://letterboxd.com/film/${searchTitle}/`;
    
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      const rating = $('meta[name="twitter:data2"]').attr("content");
      if (rating) {
        return rating.replace(" out of 5", "/5");
      }
    }
  } catch {
    // Silent fail
  }
  return undefined;
}

// Download poster to local
async function downloadPoster(film: Film): Promise<string> {
  const postersDir = path.join(process.cwd(), "public", "posters");
  if (!fs.existsSync(postersDir)) {
    fs.mkdirSync(postersDir, { recursive: true });
  }

  const ext = film.posterUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[0] || ".jpg";
  const filename = `${film.id}${ext}`;
  const filepath = path.join(postersDir, filename);

  // Skip if already downloaded
  if (fs.existsSync(filepath)) {
    return `/posters/${filename}`;
  }

  try {
    const fixedUrl = film.posterUrl.replace("biffes.org//", "biffes.org/");
    const response = await axios.get(fixedUrl, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://biffes.org/" },
      timeout: 15000,
    });

    fs.writeFileSync(filepath, response.data);
    console.log(`     📷 Downloaded: ${filename}`);
    return `/posters/${filename}`;
  } catch {
    console.log(`     ⚠️  Failed to download poster for ${film.id}`);
    return film.posterUrl.replace("biffes.org//", "biffes.org/");
  }
}

// Main pipeline
async function main() {
  const args = process.argv.slice(2);
  const skipScrape = args.includes("--skip-scrape");
  const skipPosters = args.includes("--skip-posters");
  const skipRatings = args.includes("--skip-ratings");

  console.log("\n🎬 BIFFes 2026 Data Pipeline\n");
  console.log("━".repeat(50));

  let allFilms: Film[] = [];
  const categoryData: Category[] = [];

  // Step 1: Scrape films from biffes.org
  if (!skipScrape) {
    console.log("\n📥 Step 1: Scraping films from biffes.org...\n");

    for (const cat of CATEGORIES) {
      console.log(`\n🎯 ${cat.name}`);
      const films = await scrapeCategory(cat.id);
      
      // Get details for each film
      for (let i = 0; i < films.length; i++) {
        const film = films[i];
        console.log(`  [${i + 1}/${films.length}] ${film.title}`);
        const detailed = await scrapeFilmDetails(film);
        allFilms.push(detailed);
        await delay(300);
      }

      categoryData.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: getDescription(cat.name),
        filmCount: films.length,
        color: cat.color,
        hasSubcategories: false,
      });

      await delay(500);
    }
  } else {
    // Load existing data
    const existing = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/data/biffes_data.json"), "utf-8"));
    allFilms = existing.films;
    categoryData.push(...existing.categories);
    console.log(`\n⏭️  Skipping scrape, loaded ${allFilms.length} existing films`);
  }

  // Step 2: Fetch ratings
  if (!skipRatings && OMDB_API_KEY) {
    console.log("\n\n⭐ Step 2: Fetching ratings...\n");
    
    for (let i = 0; i < allFilms.length; i++) {
      const film = allFilms[i];
      console.log(`  [${i + 1}/${allFilms.length}] ${film.title}`);
      allFilms[i] = await fetchRatings(film);
      
      // Also try Letterboxd for festival films
      if (!allFilms[i].imdbRating) {
        const lbRating = await fetchLetterboxdRating(film);
        if (lbRating) {
          (allFilms[i] as any).letterboxdRating = lbRating;
        }
      }
      
      await delay(200);
    }
  } else if (!OMDB_API_KEY) {
    console.log("\n\n⏭️  Skipping ratings (no OMDB_API_KEY set)");
    console.log("   Get a free API key at: https://www.omdbapi.com/apikey.aspx");
  }

  // Step 3: Download posters
  if (!skipPosters) {
    console.log("\n\n📷 Step 3: Downloading posters...\n");
    
    for (let i = 0; i < allFilms.length; i++) {
      const film = allFilms[i];
      const remoteUrl = film.posterUrl.replace("biffes.org//", "biffes.org/");
      const localPath = await downloadPoster(film);
      
      allFilms[i] = {
        ...film,
        posterUrl: localPath,
        posterUrlRemote: remoteUrl,
      };
    }
  }

  // Step 4: Save data
  console.log("\n\n💾 Step 4: Saving data...\n");

  const festivalData = {
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

  fs.writeFileSync(
    path.join(process.cwd(), "src/data/biffes_data.json"),
    JSON.stringify(festivalData, null, 2)
  );

  // Summary
  console.log("━".repeat(50));
  console.log("\n✅ Pipeline complete!\n");
  console.log(`   📽️  Films: ${allFilms.length}`);
  console.log(`   🌍 Countries: ${festivalData.festival.totalCountries}`);
  console.log(`   📁 Categories: ${categoryData.length}`);
  
  const withRatings = allFilms.filter(f => f.imdbRating).length;
  if (withRatings > 0) {
    console.log(`   ⭐ With ratings: ${withRatings}`);
  }
  
  console.log(`\n   📄 Output: src/data/biffes_data.json`);
  console.log(`   🕐 Updated: ${new Date().toLocaleString()}\n`);
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

main().catch(console.error);

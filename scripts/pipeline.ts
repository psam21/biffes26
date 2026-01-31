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
  // Crew info
  producer?: string;
  screenplay?: string;
  cinematography?: string;
  editor?: string;
  music?: string;
  sound?: string;
  cast?: string;
  // Awards
  awardsWon?: string;
  awardsNominated?: string;
  filmCourtesy?: string;
  // Ratings
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

    // Parse film cards - look for h3 titles that link to filmdetails
    $("h3").each((_, el) => {
      const $h3 = $(el);
      const $link = $h3.find("a[href*='/filmdetails/']");
      if ($link.length === 0) return;

      const href = $link.attr("href") || "";
      const idMatch = href.match(/filmdetails\/(\d+)/);
      if (!idMatch) return;

      const id = idMatch[1];
      const title = $link.text().trim();
      
      // Find poster - look at previous siblings or parent's img
      const $card = $h3.parent();
      let posterUrl = $card.find("img").first().attr("src") || "";
      if (!posterUrl) {
        posterUrl = $h3.prev("img").attr("src") || $h3.prevAll("img").first().attr("src") || "";
      }
      
      // Extract year and language from nearby text (usually a sibling link or div)
      const infoText = $card.text();
      const yearMatch = infoText.match(/(\d{4})\s*[•·]/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 2025;
      
      // Language is usually after the bullet
      const langMatch = infoText.match(/[•·]\s*([A-Z\s|]+?)(?:\n|$)/);
      const language = langMatch ? langMatch[1].trim() : "";

      if (title && !films.find(f => f.id === id)) {
        films.push({
          id,
          title,
          director: "",
          country: "",
          year,
          duration: 0,
          language,
          synopsis: "",
          posterUrl: posterUrl.startsWith("http") ? posterUrl : posterUrl ? `${BASE_URL}${posterUrl}` : "",
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

// Helper to extract field from movie information section
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

    // Extract Kannada title (usually after English title)
    const kannadaTitleEl = $("h2, h3, .kn-language-content").filter((_, el) => {
      const text = $(el).text().trim();
      return /[\u0C80-\u0CFF]/.test(text); // Kannada Unicode range
    }).first();
    const kannadaTitle = kannadaTitleEl.text().trim() || "";

    // Country extraction - from header info line
    const headerInfo = $(".filmdetails, .entry-meta").text();
    const countryMatch = headerInfo.match(/(INDIA|IRAN|JAPAN|SOUTH KOREA|KOREA|CHINA|NEPAL|PHILIPPINES|MYANMAR|BANGLADESH|SRI LANKA|PAKISTAN|THAILAND|INDONESIA|VIETNAM|MALAYSIA|SINGAPORE|TAIWAN|HONG KONG|KYRGYZSTAN|KAZAKHSTAN|UZBEKISTAN|MONGOLIA|AFGHANISTAN|USA|UK|FRANCE|GERMANY|ITALY|SPAIN|BRAZIL|ARGENTINA|MEXICO|CANADA|AUSTRALIA|NEW ZEALAND|POLAND|BELGIUM|NETHERLANDS|SWEDEN|NORWAY|DENMARK|FINLAND|SWITZERLAND|AUSTRIA)/i);
    const country = countryMatch ? countryMatch[1] : film.country;

    // Language extraction from header - format is "COUNTRY / LANGUAGE / YEAR / DURATION"
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

    // Duration extraction
    const durationMatch = pageText.match(/(\d+)\s*mins?/i);
    const duration = durationMatch ? parseInt(durationMatch[1]) : film.duration;

    // Year extraction
    const yearMatch = headerInfo.match(/\/\s*(20[12]\d)\s*\//i);
    const year = yearMatch ? parseInt(yearMatch[1]) : film.year;

    // Synopsis from tab1 (first tab content)
    const synopsisEl = $("#tab1 p.text, #tab1 .text").first();
    let synopsis = synopsisEl.text().trim();
    // Remove Kannada text (keep only English)
    synopsis = synopsis.replace(/[\u0C80-\u0CFF]+/g, "").trim();
    // Clean up extra whitespace
    synopsis = synopsis.replace(/\s+/g, " ").slice(0, 800);

    // Extract crew from MOVIE INFORMATION tab (tab2)
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
    
    // Film courtesy
    const filmCourtesy = $("b:contains('FILM COURTESY')").parent().parent().find("p").text().trim() ||
                         $(".extraText").find("p").text().trim();

    // Better poster URL
    const posterImg = $("img[src*='stills_img'], img[src*='poster']").first();
    const posterUrl = posterImg.attr("src") || film.posterUrl;

    return {
      ...film,
      kannadaTitle: kannadaTitle || film.kannadaTitle,
      director: film.director || "",
      country: country || film.country,
      language: language || film.language,
      duration: duration || film.duration,
      year: year || film.year,
      synopsis: synopsis || film.synopsis,
      posterUrl: posterUrl.startsWith("http") ? posterUrl : `${BASE_URL}${posterUrl}`,
      // Crew
      producer: producer || film.producer,
      screenplay: screenplay || film.screenplay,
      cinematography: cinematography || film.cinematography,
      editor: editor || film.editor,
      music: music || film.music,
      sound: sound || film.sound,
      cast: cast || film.cast,
      // Awards
      awardsWon: awardsWon || film.awardsWon,
      awardsNominated: awardsNominated || film.awardsNominated,
      filmCourtesy: filmCourtesy || film.filmCourtesy,
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
  const fullRefresh = args.includes("--full");

  console.log("\n🎬 BIFFes 2026 Data Pipeline\n");
  console.log("━".repeat(50));

  let allFilms: Film[] = [];
  const categoryData: Category[] = [];

  // Load existing data for incremental updates
  const dataPath = path.join(process.cwd(), "src/data/biffes_data.json");
  let existingFilms: Map<string, Film> = new Map();
  let existingCategories: Category[] = [];
  
  if (fs.existsSync(dataPath)) {
    const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    existing.films.forEach((f: Film) => existingFilms.set(f.id, f));
    existingCategories = existing.categories || [];
  }

  // Step 1: Scrape films from biffes.org
  if (!skipScrape) {
    console.log("\n📥 Step 1: Scraping films from biffes.org...\n");

    const scrapedFilms: Film[] = [];
    const newFilmIds: Set<string> = new Set();
    const changedFilms: Set<string> = new Set();
    const categoryChanges: Map<string, string> = new Map(); // id -> old category

    // First pass: quick scrape all categories to get film IDs and detect changes
    console.log("  🔍 Scanning categories for changes...\n");
    
    for (const cat of CATEGORIES) {
      const films = await scrapeCategory(cat.id);
      
      for (const film of films) {
        scrapedFilms.push(film);
        
        const existing = existingFilms.get(film.id);
        if (!existing) {
          newFilmIds.add(film.id);
        } else if (existing.categoryId !== film.categoryId) {
          changedFilms.add(film.id);
          categoryChanges.set(film.id, existing.categoryId);
        }
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

      await delay(300);
    }

    // Report what we found
    const removedFilms = [...existingFilms.keys()].filter(id => !scrapedFilms.find(f => f.id === id));
    
    console.log("\n  📊 Change Summary:");
    console.log(`     • New films: ${newFilmIds.size}`);
    console.log(`     • Category changes: ${changedFilms.size}`);
    console.log(`     • Removed films: ${removedFilms.length}`);
    console.log(`     • Unchanged: ${scrapedFilms.length - newFilmIds.size - changedFilms.size}`);

    if (fullRefresh) {
      console.log("\n  🔄 Full refresh requested - fetching all details...\n");
    }

    // Second pass: only fetch details for new/changed films (or all if --full)
    const filmsNeedingDetails = fullRefresh 
      ? scrapedFilms 
      : scrapedFilms.filter(f => newFilmIds.has(f.id) || changedFilms.has(f.id));

    if (filmsNeedingDetails.length > 0) {
      console.log(`\n  📥 Fetching details for ${filmsNeedingDetails.length} films...\n`);
      
      for (let i = 0; i < filmsNeedingDetails.length; i++) {
        const film = filmsNeedingDetails[i];
        const status = newFilmIds.has(film.id) ? "🆕" : changedFilms.has(film.id) ? "📦" : "🔄";
        console.log(`  [${i + 1}/${filmsNeedingDetails.length}] ${status} ${film.title}`);
        
        const detailed = await scrapeFilmDetails(film);
        
        // Preserve ratings from existing data if not doing full refresh
        const existing = existingFilms.get(film.id);
        if (existing && !fullRefresh) {
          detailed.imdbRating = existing.imdbRating;
          detailed.rottenTomatoes = existing.rottenTomatoes;
          detailed.metacritic = existing.metacritic;
          detailed.imdbId = existing.imdbId;
          (detailed as any).letterboxdRating = (existing as any).letterboxdRating;
        }
        
        existingFilms.set(film.id, detailed);
        await delay(300);
      }
    } else {
      console.log("\n  ✨ No new films to fetch details for!");
    }

    // Build final film list preserving existing data for unchanged films
    for (const film of scrapedFilms) {
      const existingOrUpdated = existingFilms.get(film.id);
      if (existingOrUpdated) {
        // Update category if it changed
        existingOrUpdated.categoryId = film.categoryId;
        allFilms.push(existingOrUpdated);
      } else {
        allFilms.push(film);
      }
    }

  } else {
    // Load existing data
    allFilms = [...existingFilms.values()];
    categoryData.push(...existingCategories);
    console.log(`\n⏭️  Skipping scrape, loaded ${allFilms.length} existing films`);
  }

  // Step 2: Fetch ratings (only for films missing ratings)
  if (!skipRatings) {
    const filmsNeedingRatings = allFilms.filter(f => !f.imdbRating && !(f as any).letterboxdRating);
    
    if (filmsNeedingRatings.length > 0) {
      console.log(`\n\n⭐ Step 2: Fetching ratings for ${filmsNeedingRatings.length} films...\n`);
      
      for (let i = 0; i < filmsNeedingRatings.length; i++) {
        const film = filmsNeedingRatings[i];
        const filmIndex = allFilms.findIndex(f => f.id === film.id);
        console.log(`  [${i + 1}/${filmsNeedingRatings.length}] ${film.title}`);
        
        let withRatings = film;
        
        // Try OMDB if we have API key
        if (OMDB_API_KEY) {
          withRatings = await fetchRatings(film);
        }
        
        // Also try Letterboxd for all films (doesn't need API key)
        if (!withRatings.imdbRating && !(withRatings as any).letterboxdRating) {
          const lbRating = await fetchLetterboxdRating(film);
          if (lbRating) {
            (withRatings as any).letterboxdRating = lbRating;
            console.log(`    ✓ Letterboxd: ${lbRating}`);
          }
        }
        
        allFilms[filmIndex] = withRatings;
        await delay(200);
      }
    } else {
      console.log("\n\n⏭️  Step 2: All films already have ratings");
    }
    
    if (!OMDB_API_KEY) {
      console.log("\n   ℹ️  Note: Set OMDB_API_KEY for IMDb ratings. Get one at: https://www.omdbapi.com/apikey.aspx");
    }
  }

  // Step 3: Download posters (only missing ones - already incremental)
  if (!skipPosters) {
    const postersDir = path.join(process.cwd(), "public", "posters");
    const existingPosters = fs.existsSync(postersDir) 
      ? new Set(fs.readdirSync(postersDir).map(f => f.split('.')[0]))
      : new Set();
    
    const filmsNeedingPosters = allFilms.filter(f => !existingPosters.has(f.id) && f.posterUrl);
    
    if (filmsNeedingPosters.length > 0) {
      console.log(`\n\n📷 Step 3: Downloading ${filmsNeedingPosters.length} new posters...\n`);
      
      for (let i = 0; i < allFilms.length; i++) {
        const film = allFilms[i];
        if (!existingPosters.has(film.id) && film.posterUrl) {
          const remoteUrl = film.posterUrl.replace("biffes.org//", "biffes.org/");
          const localPath = await downloadPoster(film);
          
          allFilms[i] = {
            ...film,
            posterUrl: localPath,
            posterUrlRemote: remoteUrl,
          };
        } else if (existingPosters.has(film.id)) {
          // Use existing local poster
          const ext = fs.readdirSync(postersDir).find(f => f.startsWith(film.id))?.split('.').pop() || 'jpg';
          allFilms[i] = {
            ...film,
            posterUrl: `/posters/${film.id}.${ext}`,
            posterUrlRemote: film.posterUrl.includes('biffes.org') ? film.posterUrl : (film as any).posterUrlRemote,
          };
        }
      }
    } else {
      console.log("\n\n⏭️  Step 3: All posters already downloaded");
      // Update poster paths - prefer optimized webp if it exists
      const optimizedDir = path.join(process.cwd(), "public/posters-optimized");
      const hasOptimized = fs.existsSync(optimizedDir);
      
      for (let i = 0; i < allFilms.length; i++) {
        const film = allFilms[i];
        if (existingPosters.has(film.id)) {
          // Check for optimized webp first
          if (hasOptimized && fs.existsSync(path.join(optimizedDir, `${film.id}.webp`))) {
            allFilms[i].posterUrl = `/posters-optimized/${film.id}.webp`;
          } else {
            const files = fs.readdirSync(postersDir).filter(f => f.startsWith(film.id + '.'));
            if (files.length > 0) {
              allFilms[i].posterUrl = `/posters/${files[0]}`;
            }
          }
        }
      }
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

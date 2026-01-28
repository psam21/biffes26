import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://biffes.org";

// Category definitions with their IDs from biffes.org
const CATEGORIES = [
  { id: "18", name: "Opening Film", slug: "opening-film", color: "gold", hasSubcategories: false },
  { id: "19", name: "Closing Film", slug: "closing-film", color: "gold", hasSubcategories: false },
  { id: "1", name: "Asian Cinema Competition", slug: "asian-cinema", color: "asian", hasSubcategories: false },
  { id: "2", name: "Indian Cinema Competition", slug: "indian-cinema", color: "indian", hasSubcategories: false },
  { id: "3", name: "Kannada Cinema Competition", slug: "kannada-cinema", color: "kannada", hasSubcategories: false },
  { id: "6", name: "Critics' Week", slug: "critics-week", color: "critics", hasSubcategories: false },
  { id: "4", name: "Contemporary World Cinema", slug: "world-cinema", color: "world", hasSubcategories: false },
  { id: "5", name: "Country Focus", slug: "country-focus", color: "world", hasSubcategories: true, isSubcategoryPage: true },
  { id: "25", name: "Chronicles of Africa", slug: "africa", color: "africa", hasSubcategories: false },
  { id: "7", name: "Bio-Pics", slug: "biopics", color: "biopics", hasSubcategories: false },
  { id: "11", name: "Retrospective", slug: "retrospective", color: "retrospective", hasSubcategories: true, isSubcategoryPage: true },
  { id: "12", name: "Centenary Tributes", slug: "centenary-tributes", color: "retrospective", hasSubcategories: false },
  { id: "26", name: "Voice for Equality", slug: "voice-equality", color: "world", hasSubcategories: false },
  { id: "27", name: "Contemporary Filmmaker in Focus", slug: "filmmaker-focus", color: "critics", hasSubcategories: true, isSubcategoryPage: true },
  { id: "29", name: "Mid Festival Favourite", slug: "mid-festival", color: "gold", hasSubcategories: false },
  { id: "24", name: "50 Years of Cinematic Journey", slug: "50-years", color: "retrospective", hasSubcategories: false },
];

interface ScrapedFilm {
  id: string;
  title: string;
  director: string;
  country: string;
  year: number;
  duration: number;
  language: string;
  synopsis: string;
  posterUrl: string;
  categoryId: string;
  detailUrl: string;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeFilmsFromCategory(
  categoryId: string,
  isSubcategoryPage: boolean = false
): Promise<ScrapedFilm[]> {
  const films: ScrapedFilm[] = [];
  const url = isSubcategoryPage
    ? `${BASE_URL}/films-subcategory/${categoryId}`
    : `${BASE_URL}/films?category_id=${categoryId}`;

  console.log(`Scraping: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(response.data);

    // Find all film cards - adjust selector based on actual page structure
    $(".film-card, .movie-card, .card, [class*='film'], [class*='movie']").each(
      (index, element) => {
        const $el = $(element);

        // Try to extract film details
        const title =
          $el.find("h3, h4, .title, .film-title").first().text().trim() ||
          $el.find("a").first().text().trim();

        const posterUrl =
          $el.find("img").attr("src") || $el.find("img").attr("data-src") || "";

        const detailLink = $el.find("a").attr("href") || "";

        if (title && title.length > 0) {
          films.push({
            id: `${categoryId}-${index}`,
            title,
            director: "",
            country: "",
            year: 2024,
            duration: 0,
            language: "",
            synopsis: "",
            posterUrl: posterUrl.startsWith("http")
              ? posterUrl
              : `${BASE_URL}${posterUrl}`,
            categoryId,
            detailUrl: detailLink.startsWith("http")
              ? detailLink
              : `${BASE_URL}${detailLink}`,
          });
        }
      }
    );

    // Alternative: Look for any structured film listings
    if (films.length === 0) {
      // Try parsing table or list structures
      $("table tr, .list-item, .row").each((index, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        const link = $el.find("a").attr("href");

        if (text && link && link.includes("film")) {
          films.push({
            id: `${categoryId}-${index}`,
            title: text.split("\n")[0].trim(),
            director: "",
            country: "",
            year: 2024,
            duration: 0,
            language: "",
            synopsis: "",
            posterUrl: "",
            categoryId,
            detailUrl: link.startsWith("http") ? link : `${BASE_URL}${link}`,
          });
        }
      });
    }
  } catch (error) {
    console.error(`Error scraping category ${categoryId}:`, error);
  }

  return films;
}

async function scrapeFilmDetails(film: ScrapedFilm): Promise<ScrapedFilm> {
  if (!film.detailUrl) return film;

  try {
    const response = await axios.get(film.detailUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(response.data);

    // Extract detailed information - adjust selectors based on actual page
    const director =
      $('[class*="director"], .director')
        .text()
        .replace(/director:?/i, "")
        .trim() ||
      $('td:contains("Director")')
        .next()
        .text()
        .trim();

    const country =
      $('[class*="country"], .country')
        .text()
        .replace(/country:?/i, "")
        .trim() ||
      $('td:contains("Country")')
        .next()
        .text()
        .trim();

    const yearText =
      $('[class*="year"], .year').text() ||
      $('td:contains("Year")')
        .next()
        .text()
        .trim();
    const year = parseInt(yearText) || 2024;

    const durationText =
      $('[class*="duration"], .duration, .runtime').text() ||
      $('td:contains("Duration")')
        .next()
        .text()
        .trim();
    const duration = parseInt(durationText.replace(/\D/g, "")) || 0;

    const language =
      $('[class*="language"], .language')
        .text()
        .replace(/language:?/i, "")
        .trim() ||
      $('td:contains("Language")')
        .next()
        .text()
        .trim();

    const synopsis =
      $('[class*="synopsis"], .synopsis, .description, .plot, p')
        .first()
        .text()
        .trim()
        .slice(0, 500);

    const posterUrl =
      $(".poster img, .film-poster img, [class*='poster'] img").attr("src") ||
      film.posterUrl;

    return {
      ...film,
      director: director || film.director,
      country: country || film.country,
      year,
      duration,
      language: language || film.language,
      synopsis: synopsis || film.synopsis,
      posterUrl: posterUrl.startsWith("http")
        ? posterUrl
        : `${BASE_URL}${posterUrl}`,
    };
  } catch (error) {
    console.error(`Error scraping details for ${film.title}:`, error);
    return film;
  }
}

async function main() {
  console.log("🎬 Starting BIFFes 2026 Film Scraper...\n");

  const allFilms: ScrapedFilm[] = [];
  const categoryData: Array<{
    id: string;
    name: string;
    slug: string;
    color: string;
    filmCount: number;
    hasSubcategories: boolean;
  }> = [];

  for (const category of CATEGORIES) {
    console.log(`\n📁 Processing: ${category.name}`);

    const films = await scrapeFilmsFromCategory(
      category.id,
      category.isSubcategoryPage
    );

    console.log(`   Found ${films.length} films`);

    // Scrape details for each film (with rate limiting)
    for (let i = 0; i < films.length; i++) {
      const film = films[i];
      console.log(`   📽️  [${i + 1}/${films.length}] ${film.title}`);

      const detailedFilm = await scrapeFilmDetails(film);
      allFilms.push(detailedFilm);

      await delay(500); // Rate limiting
    }

    categoryData.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
      color: category.color,
      filmCount: films.length,
      hasSubcategories: category.hasSubcategories,
    });

    await delay(1000); // Rate limiting between categories
  }

  // Save scraped data
  const outputDir = path.join(process.cwd(), "data_source");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "scraped_films.json"),
    JSON.stringify({ categories: categoryData, films: allFilms }, null, 2)
  );

  console.log(`\n✅ Scraping complete!`);
  console.log(`   Total films: ${allFilms.length}`);
  console.log(`   Categories: ${categoryData.length}`);
  console.log(`   Output: data_source/scraped_films.json`);
}

main().catch(console.error);

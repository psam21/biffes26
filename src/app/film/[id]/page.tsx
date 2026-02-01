import { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilmPageClient } from "./FilmPageClient";
import biffesData from "@/data/biffes_data.json";
import scheduleData from "@/data/schedule_data.json";
import { Film, Category } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Screening {
  date: string;
  dayLabel: string;
  time: string;
  venue: string;
  screen: string;
}

// Title aliases mapping schedule titles to database titles
// This is the same as in ScheduleClient.tsx - schedule title -> DB title
const titleAliases: Record<string, string> = {
  'GANARRAAG': 'GANARAAG', 'VAMYA': 'VANYA', 'ROOSTER': 'KOKORAS', 'SIRAT': 'SIRĀT', 'SARKEET': 'SIRĀT',
  'PHOLDIBEE': 'PHOUOIBEE (THE GODDESS OF PADDY)', 'REPUBLIC OF PIPULPIPAS': 'REPUBLIC OF PIPOLIPINAS',
  "HOMTIVENTAI '25": "KONTINENTAL '25", 'HOMTIVENTAI 25': "KONTINENTAL '25", 'KONTINENTAL 25': "KONTINENTAL '25",
  'HY NAM INN': 'KY NAM INN', 'CEMETARY OF CINEMA': 'THE CEMETERY OF CINEMA', 'CEMETERY OF CINEMA': 'THE CEMETERY OF CINEMA',
  'THE MYSTERIOUS CASE OF THE FLAMINGO': 'THE MYSTERIOUS GAZE OF THE FLAMINGO',
  'SRIMANTHI DARSAIL PART 2': 'SRI JAGANNATHA DAASARU PART 2', 'SRI JAGANNATHA DASKARU PART 2': 'SRI JAGANNATHA DAASARU PART 2',
  'KANTARA II (LEGEND CHAPTER-1)': 'KANTARA A LEGEND CHAPTER-1', 'MATAPA A LEGEND CHAPTER-1': 'KANTARA A LEGEND CHAPTER-1',
  'K-POPPER': 'K POPPER', 'MINO': 'NINO', 'MOHAM': 'DESIRE', 'FIRE FLY': 'FLAMES', 'MOSQUITOS': 'MOSQUITOES',
  'LA CHAPELLE': 'THE CHAPEL', 'LA VIE EST BELLE': 'LIFE IS ROSY', 'NATIONALITE IMMIGRE': 'NATIONALITY: IMMIGRANT',
  'NATIONALITÉ IMMIGRÉ': 'NATIONALITY: IMMIGRANT', 'TETES BRULEES': 'TÊTES BRÛLÉES', 'TÊTES BRULÉES': 'TÊTES BRÛLÉES',
  'SAMBA TRAORE': 'SAMBA TRAORÉ', 'SECRET OF A MOUNTAIN SERPENT': 'KOORMAVATARA',
  'WHAT DOES THE HARVEST SAY TO YOU': 'WHAT DOES THAT NATURE SAY TO YOU', 'KANAL': 'CANAL',
  'JEEVANN': 'JEVANN', 'JEEV': 'JEVANN', 'BHOOTHALAM': 'HIDDEN TREMORS', 'GHARDEV': 'FAMILT DEITY',
  'KANASEMBA KUDUREYAMERI': 'RIDING THE STALLION OF DREAM', 'KANGBO ALOTI': 'THE LOST PATH',
  'KHALI PUTA': 'EMPTY PAGE', 'MAHAKAVI': 'THE EPIC POET', 'MRIGATRISHNA': 'MIRAGE',
  'SABAR BONDA': 'CACTUS PEARS', 'VAGHACHIPANI': "TIGER'S POND", 'VASTHUHARA': 'THE DISPOSSESSED',
  'DO BIGHA ZAMIN': 'TWO ACRES OF LAND', 'CLEO FROM 5 TO 7': 'CLEO FROM 5 TO 7',
  'CLÉO FROM 5 TO 7': 'CLEO FROM 5 TO 7', 'GEHEMU LAMAI': 'GEHENU LAMAI', 'GEHENNU LAMAI': 'GEHENU LAMAI',
  'PADUVAARAHALLI PANDAVARU': 'PADUVARAHALLI PANDAVARU', 'PADUVARAHALLI PANDAVRU': 'PADUVARAHALLI PANDAVARU',
};

// Build reverse alias map: DB title -> all schedule title variants
function getScheduleTitleVariants(dbTitle: string): string[] {
  const variants = [dbTitle.toUpperCase()];
  const dbUpper = dbTitle.toUpperCase();
  
  // Find all schedule titles that map to this DB title
  for (const [scheduleTitle, mappedDbTitle] of Object.entries(titleAliases)) {
    if (mappedDbTitle.toUpperCase() === dbUpper) {
      variants.push(scheduleTitle.toUpperCase());
    }
  }
  
  // Also add normalized version (no accents/special chars)
  const normalized = dbTitle.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase();
  if (!variants.includes(normalized)) {
    variants.push(normalized);
  }
  
  return variants;
}

// Build screening lookup from schedule data
function getScreeningsForFilm(filmTitle: string): Screening[] {
  const screenings: Screening[] = [];
  const titleVariants = getScheduleTitleVariants(filmTitle);
  
  for (const day of scheduleData.days) {
    for (const screening of day.screenings) {
      for (const showing of screening.showings) {
        const showingTitle = showing.film.toUpperCase();
        // Check if showing title matches any variant of the film title
        if (titleVariants.some(variant => 
          showingTitle === variant || 
          showingTitle.replace(/[^A-Za-z0-9\s]/g, '') === variant.replace(/[^A-Za-z0-9\s]/g, '')
        )) {
          screenings.push({
            date: day.date,
            dayLabel: day.label,
            time: showing.time,
            venue: screening.venue,
            screen: screening.screen,
          });
        }
      }
    }
  }
  
  // Sort by date and time
  screenings.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
  
  return screenings;
}

// Generate static paths for all films
export async function generateStaticParams() {
  const films = biffesData.films as Film[];
  return films.map((film) => ({
    id: film.id,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const films = biffesData.films as Film[];
  const film = films.find((f) => f.id === id);

  if (!film) {
    return {
      title: "Film Not Found | BIFFes 2026",
    };
  }

  return {
    title: `${film.title} | BIFFes 2026`,
    description: film.synopsis || `${film.title} - ${film.director} (${film.country}, ${film.year})`,
    openGraph: {
      title: `${film.title} | BIFFes 2026`,
      description: film.synopsis || `${film.title} directed by ${film.director}`,
      images: film.posterUrl ? [film.posterUrl] : [],
    },
  };
}

export default async function FilmPage({ params }: PageProps) {
  const { id } = await params;
  const films = biffesData.films as Film[];
  const categories = biffesData.categories as Category[];
  const film = films.find((f) => f.id === id);

  if (!film) {
    notFound();
  }

  const category = categories.find((c) => c.id === film.categoryId);
  const screenings = getScreeningsForFilm(film.title);

  return <FilmPageClient film={film} category={category} allFilms={films} screenings={screenings} />;
}

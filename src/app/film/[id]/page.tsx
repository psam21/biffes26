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

// Build screening lookup from schedule data
function getScreeningsForFilm(filmTitle: string): Screening[] {
  const screenings: Screening[] = [];
  const filmKey = filmTitle.toUpperCase();
  
  for (const day of scheduleData.days) {
    for (const screening of day.screenings) {
      for (const showing of screening.showings) {
        if (showing.film.toUpperCase() === filmKey) {
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

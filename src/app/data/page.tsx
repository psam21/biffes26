import { Metadata } from "next";
import festivalData from "@/data/biffes_data.json";
import scheduleData from "@/data/schedule_data.json";
import DataClient from "./DataClient";

export const metadata: Metadata = {
  title: "Data & Stats | BIFFes 2026",
  description: "Festival statistics, film data, and platform metrics for BIFFes 2026",
};

// Pre-compute all statistics at build time
function computeStats() {
  const { films, categories, festival } = festivalData;
  const { days, schedule } = scheduleData;

  // --- Film Statistics ---
  const totalFilms = films.length;
  const totalCategories = categories.length;
  
  // Countries breakdown
  const countryCounts: Record<string, number> = {};
  films.forEach(film => {
    const countries = film.country?.split(/[,\/]/).map(c => c.trim()) || ['Unknown'];
    countries.forEach(country => {
      if (country) countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
  });
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  const uniqueCountries = Object.keys(countryCounts).length;

  // Languages breakdown
  const languageCounts: Record<string, number> = {};
  films.forEach(film => {
    const langs = film.language?.split(/[,\/]/).map(l => l.trim()) || ['Unknown'];
    langs.forEach(lang => {
      if (lang) languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });
  });
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const uniqueLanguages = Object.keys(languageCounts).length;

  // Duration stats
  const filmsWithDuration = films.filter(f => f.duration > 0);
  const totalMinutes = filmsWithDuration.reduce((sum, f) => sum + f.duration, 0);
  const avgDuration = filmsWithDuration.length > 0 
    ? Math.round(totalMinutes / filmsWithDuration.length) 
    : 0;
  const longestFilm = filmsWithDuration.reduce((max, f) => f.duration > max.duration ? f : max, filmsWithDuration[0]);
  const shortestFilm = filmsWithDuration.reduce((min, f) => f.duration < min.duration ? f : min, filmsWithDuration[0]);

  // Year distribution
  const yearCounts: Record<number, number> = {};
  films.forEach(film => {
    if (film.year > 0) yearCounts[film.year] = (yearCounts[film.year] || 0) + 1;
  });
  const yearDistribution = Object.entries(yearCounts)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => b.year - a.year);

  // --- Ratings Statistics ---
  const filmsWithImdb = films.filter(f => f.imdbRating);
  const filmsWithRT = films.filter(f => f.rottenTomatoes);
  const filmsWithMC = films.filter(f => f.metacritic);
  const filmsWithLB = films.filter(f => f.letterboxdRating);
  const filmsWithAnyRating = films.filter(f => f.imdbRating || f.rottenTomatoes || f.metacritic || f.letterboxdRating);
  
  const avgImdb = filmsWithImdb.length > 0
    ? (filmsWithImdb.reduce((sum, f) => sum + parseFloat(f.imdbRating!), 0) / filmsWithImdb.length).toFixed(1)
    : null;
  
  const highestImdb = filmsWithImdb.length > 0
    ? filmsWithImdb.reduce((max, f) => parseFloat(f.imdbRating!) > parseFloat(max.imdbRating!) ? f : max)
    : null;

  // Awards
  const awardWinners = films.filter(f => f.awardsWon);
  const awardNominated = films.filter(f => f.awardsNominated);

  // --- Schedule Statistics ---
  const totalDays = days.length;
  let totalScreenings = 0;
  let totalScheduledMinutes = 0;
  const venueScreenings: Record<string, number> = {};
  const dayScreenings: Record<string, number> = {};
  const timeSlotCounts: Record<string, number> = {};

  // Create film lookup for duration
  const filmDurationMap: Record<string, number> = {};
  films.forEach(film => {
    filmDurationMap[film.title.toUpperCase()] = film.duration || 0;
  });

  days.forEach(day => {
    let dayTotal = 0;
    day.screenings.forEach(screening => {
      const venueKey = screening.venue;
      venueScreenings[venueKey] = (venueScreenings[venueKey] || 0) + screening.showings.length;
      dayTotal += screening.showings.length;
      
      screening.showings.forEach(showing => {
        // Look up film duration, fallback to 120 minutes
        const filmDuration = filmDurationMap[showing.film?.toUpperCase()] || 120;
        totalScheduledMinutes += filmDuration;
        const hour = showing.time.split(':')[0];
        timeSlotCounts[hour] = (timeSlotCounts[hour] || 0) + 1;
      });
    });
    totalScreenings += dayTotal;
    dayScreenings[day.label] = dayTotal;
  });

  const peakHour = Object.entries(timeSlotCounts)
    .sort((a, b) => b[1] - a[1])[0];

  // Venue details
  const venues = schedule.venues as Record<string, { name: string; location: string; screens?: number }>;
  const venueStats = Object.entries(venueScreenings).map(([key, count]) => ({
    key,
    name: venues[key]?.name || key,
    location: venues[key]?.location || '',
    screenings: count,
  })).sort((a, b) => b.screenings - a.screenings);

  // --- Category Statistics ---
  const categoryStats = categories.map(cat => ({
    name: cat.name,
    slug: cat.slug,
    filmCount: cat.filmCount,
    color: cat.color,
  })).sort((a, b) => b.filmCount - a.filmCount);

  // --- Technical/Meta Statistics ---
  const totalPages = 1 + totalCategories + totalFilms + 5; // home + categories + films + static pages
  const dataSize = JSON.stringify(festivalData).length;
  const scheduleSize = JSON.stringify(scheduleData).length;

  return {
    festival: {
      name: festival.name,
      edition: festival.edition,
      year: festival.year,
      dates: festival.dates,
      lastUpdated: festival.lastUpdated,
      venues: festival.venues,
    },
    films: {
      total: totalFilms,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60),
      avgDuration,
      longestFilm: longestFilm ? { title: longestFilm.title, duration: longestFilm.duration } : null,
      shortestFilm: shortestFilm ? { title: shortestFilm.title, duration: shortestFilm.duration } : null,
      uniqueCountries,
      uniqueLanguages,
      topCountries,
      topLanguages,
      yearDistribution: yearDistribution.slice(0, 10),
    },
    ratings: {
      withImdb: filmsWithImdb.length,
      withRT: filmsWithRT.length,
      withMC: filmsWithMC.length,
      withLB: filmsWithLB.length,
      withAnyRating: filmsWithAnyRating.length,
      avgImdb,
      highestImdb: highestImdb && highestImdb.imdbRating 
        ? { title: highestImdb.title, rating: highestImdb.imdbRating } 
        : null,
      awardWinners: awardWinners.length,
      awardNominated: awardNominated.length,
    },
    schedule: {
      totalDays,
      totalScreenings,
      totalScheduledMinutes,
      totalScheduledHours: Math.round(totalScheduledMinutes / 60),
      venueStats,
      dayScreenings: Object.entries(dayScreenings).map(([label, count]) => ({ label, count })),
      peakHour: peakHour ? { hour: `${peakHour[0]}:00`, count: peakHour[1] } : null,
    },
    categories: {
      total: totalCategories,
      breakdown: categoryStats,
    },
    meta: {
      totalPages,
      dataSize,
      scheduleSize,
      totalDataKB: Math.round((dataSize + scheduleSize) / 1024),
    },
  };
}

export default function DataPage() {
  const stats = computeStats();
  
  return <DataClient stats={stats} />;
}

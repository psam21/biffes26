import { Film } from "@/types";

interface Showing {
  time: string;
  film: string;
  director: string;
  country: string;
  year: number;
  language: string;
  duration: number;
}

interface Screening {
  venue: string;
  screen: string;
  showings: Showing[];
}

interface DaySchedule {
  date: string;
  dayNumber: number;
  label: string;
  screenings: Screening[];
}

interface ScheduleData {
  schedule: {
    venues: Record<string, { name: string; location: string; screens?: number }>;
  };
  days: DaySchedule[];
}

export interface RecommendedShowing {
  time: string;
  endTime: string;
  film: Film;
  venue: string;
  venueName: string;
  screen: string;
  score: number;
  reason: string;
  alternativeShowings?: { date: string; dateLabel: string; time: string; venue: string }[];
}

// Calculate a film's score based on available ratings
function calculateFilmScore(film: Film): { score: number; reason: string } {
  let totalScore = 0;
  let factors = 0;
  const reasons: string[] = [];

  // IMDb rating (out of 10)
  if (film.imdbRating) {
    const imdb = parseFloat(film.imdbRating);
    if (!isNaN(imdb)) {
      totalScore += imdb * 10; // Scale to 100
      factors++;
      if (imdb >= 7.5) reasons.push(`IMDb ${film.imdbRating}`);
    }
  }

  // Rotten Tomatoes (percentage)
  if (film.rottenTomatoes) {
    const rt = parseInt(film.rottenTomatoes.replace('%', ''));
    if (!isNaN(rt)) {
      totalScore += rt;
      factors++;
      if (rt >= 90) reasons.push(`🍅 ${film.rottenTomatoes}`);
    }
  }

  // Metacritic (out of 100)
  if (film.metacritic) {
    const mc = parseInt(film.metacritic.split('/')[0]);
    if (!isNaN(mc)) {
      totalScore += mc;
      factors++;
      if (mc >= 80) reasons.push(`MC ${film.metacritic}`);
    }
  }

  // Letterboxd (out of 5, scale to 100)
  if (film.letterboxdRating) {
    const lb = parseFloat(film.letterboxdRating.split('/')[0]);
    if (!isNaN(lb)) {
      totalScore += lb * 20;
      factors++;
      if (lb >= 3.7) reasons.push(`LB ${film.letterboxdRating}`);
    }
  }

  // Bonus for award-winning films
  if (film.awardsWon) {
    totalScore += 10;
    if (film.awardsWon.toLowerCase().includes('cannes') ||
        film.awardsWon.toLowerCase().includes('venice') ||
        film.awardsWon.toLowerCase().includes('berlin') ||
        film.awardsWon.toLowerCase().includes('oscar')) {
      totalScore += 10;
      reasons.push('🏆 Award Winner');
    }
  }

  const avgScore = factors > 0 ? totalScore / factors : 50;
  const reason = reasons.length > 0 ? reasons.slice(0, 2).join(' • ') : 'Festival Selection';
  
  return { score: avgScore, reason };
}

// Parse time string to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Format minutes to time string
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Check if two showings conflict (no buffer needed)
function hasConflict(
  showing1: RecommendedShowing,
  showing2: RecommendedShowing,
  bufferMinutes: number = 0
): boolean {
  const start1 = timeToMinutes(showing1.time);
  const end1 = timeToMinutes(showing1.endTime) + bufferMinutes;
  const start2 = timeToMinutes(showing2.time);
  const end2 = timeToMinutes(showing2.endTime) + bufferMinutes;

  return !(end1 <= start2 || end2 <= start1);
}

// Get the current festival date or the next festival date
export function getCurrentFestivalDate(): string {
  const now = new Date();
  const festivalStart = new Date('2026-01-30');
  const festivalEnd = new Date('2026-02-06');

  if (now < festivalStart) {
    return '2026-01-30'; // Before festival, show first day
  } else if (now > festivalEnd) {
    return '2026-02-06'; // After festival, show last day
  } else {
    // During festival, use current date
    return now.toISOString().split('T')[0];
  }
}

// Generate optimal recommendations for a given date
export function generateRecommendations(
  date: string,
  scheduleData: ScheduleData,
  films: Film[],
  maxRecommendations: number = 5
): RecommendedShowing[] {
  // Find the day's schedule
  const daySchedule = scheduleData.days.find(d => d.date === date);
  if (!daySchedule) return [];

  // Create a map for quick film lookup
  const filmMap = new Map<string, Film>();
  films.forEach(film => {
    filmMap.set(film.title.toUpperCase(), film);
  });

  // Build a map of all showings for each film across all days (for alternatives)
  const allFilmShowings = new Map<string, { date: string; dateLabel: string; time: string; venue: string }[]>();
  for (const day of scheduleData.days) {
    for (const screening of day.screenings) {
      const venueInfo = scheduleData.schedule.venues[screening.venue];
      const venueName = venueInfo?.name || screening.venue;
      for (const showing of screening.showings) {
        const filmKey = showing.film.toUpperCase();
        if (!allFilmShowings.has(filmKey)) {
          allFilmShowings.set(filmKey, []);
        }
        allFilmShowings.get(filmKey)!.push({
          date: day.date,
          dateLabel: day.label.replace('Day ', '').split(' - ')[1] || day.label,
          time: showing.time,
          venue: venueName.includes('Cinepolis') ? 'LuLu' : venueName.split(' ')[0],
        });
      }
    }
  }

  // Collect all showings with their scores
  const allShowings: RecommendedShowing[] = [];
  
  for (const screening of daySchedule.screenings) {
    const venueInfo = scheduleData.schedule.venues[screening.venue];
    const venueName = venueInfo?.name || screening.venue;

    for (const showing of screening.showings) {
      const film = filmMap.get(showing.film.toUpperCase());
      if (!film) continue;

      const { score, reason } = calculateFilmScore(film);
      const startMinutes = timeToMinutes(showing.time);
      const endMinutes = startMinutes + (showing.duration || film.duration || 120);

      // Find alternative showings on other days
      const filmKey = showing.film.toUpperCase();
      const allShowingsForFilm = allFilmShowings.get(filmKey) || [];
      const alternativeShowings = allShowingsForFilm.filter(s => 
        s.date !== date // Different day
      );

      allShowings.push({
        time: showing.time,
        endTime: minutesToTime(endMinutes),
        film,
        venue: screening.venue,
        venueName,
        screen: screening.screen,
        score,
        reason,
        alternativeShowings: alternativeShowings.length > 0 ? alternativeShowings : undefined,
      });
    }
  }

  // Sort by score (highest first)
  allShowings.sort((a, b) => b.score - a.score);

  // Greedy selection: pick highest-rated films that don't conflict
  const selected: RecommendedShowing[] = [];
  
  for (const showing of allShowings) {
    if (selected.length >= maxRecommendations) break;
    
    // Check for conflicts with already selected showings
    const conflicts = selected.some(s => hasConflict(s, showing));
    if (!conflicts) {
      selected.push(showing);
    }
  }

  // Sort selected by time
  selected.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  return selected;
}

// Get all available festival dates
export function getFestivalDates(): { date: string; label: string }[] {
  return [
    { date: '2026-01-30', label: 'Thu, Jan 30' },
    { date: '2026-01-31', label: 'Fri, Jan 31' },
    { date: '2026-02-01', label: 'Sat, Feb 1' },
    { date: '2026-02-02', label: 'Sun, Feb 2' },
    { date: '2026-02-03', label: 'Mon, Feb 3' },
    { date: '2026-02-04', label: 'Tue, Feb 4' },
    { date: '2026-02-05', label: 'Wed, Feb 5' },
    { date: '2026-02-06', label: 'Thu, Feb 6' },
  ];
}

// Format date for display
export function formatDateLabel(date: string): string {
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

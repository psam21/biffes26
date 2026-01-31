// Server Component - data is loaded at build time
import festivalData from "@/data/biffes_data.json";
import scheduleData from "@/data/schedule_data.json";
import { Film } from "@/types";
import FilmsClient from "./FilmsClient";

// Build screening lookup from schedule data
function buildScreeningLookup() {
  const lookup: Record<string, Array<{ date: string; time: string; venue: string; screen: string }>> = {};
  
  for (const day of scheduleData.days) {
    for (const screening of day.screenings) {
      for (const showing of screening.showings) {
        const filmKey = showing.film.toUpperCase();
        if (!lookup[filmKey]) {
          lookup[filmKey] = [];
        }
        lookup[filmKey].push({
          date: day.date,
          time: showing.time,
          venue: screening.venue,
          screen: screening.screen,
        });
      }
    }
  }
  
  return lookup;
}

export default function FilmsPage() {
  const films = festivalData.films as Film[];
  const screeningLookup = buildScreeningLookup();
  
  return <FilmsClient films={films} screeningLookup={screeningLookup} />;
}

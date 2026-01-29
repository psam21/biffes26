// Server Component - data is loaded at build time / server-side
import festivalData from "@/data/biffes_data.json";
import scheduleData from "@/data/schedule_data.json";
import { Category, Film } from "@/types";
import HomeClient from "./HomeClient";

// Type the imported JSON data to match actual structure
const typedData = {
  festival: festivalData.festival as {
    name: string;
    edition: number;
    year: number;
    dates: string;
    totalFilms: number;
    totalCountries: number;
    venues: Array<{ name: string; address: string; mapUrl: string }>;
    lastUpdated: string;
  },
  categories: festivalData.categories as Category[],
  films: festivalData.films as Film[],
};

export default function Home() {
  // Data is fetched server-side and passed to client component
  // This avoids shipping 268KB of JSON in the JS bundle
  return <HomeClient data={typedData} scheduleData={scheduleData} />;
}

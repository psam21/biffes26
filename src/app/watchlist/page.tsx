// Server Component - data is loaded at build time / server-side
import festivalData from "@/data/biffes_data.json";
import scheduleData from "@/data/schedule_data.json";
import { Category, Film } from "@/types";
import WatchlistClient from "./WatchlistClient";

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

export default function WatchlistPage() {
  return <WatchlistClient films={typedData.films} scheduleData={scheduleData} />;
}

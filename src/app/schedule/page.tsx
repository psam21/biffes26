// Server Component - data is loaded at build time / server-side
import scheduleData from "@/data/schedule_data.json";
import festivalData from "@/data/biffes_data.json";
import { Film } from "@/types";
import ScheduleClient from "./ScheduleClient";

// Use looser typing to match actual JSON structure
const typedScheduleData = {
  days: scheduleData.days.map(day => ({
    ...day,
    forum: (day as { forum?: Array<{ time: string; title: string; type: string }> }).forum || []
  })),
  schedule: scheduleData.schedule
};

const typedFilms = festivalData.films as Film[];

export default function SchedulePage() {
  // Data is fetched server-side and passed to client component
  // This avoids shipping 336KB of JSON in the JS bundle
  return <ScheduleClient scheduleData={typedScheduleData} films={typedFilms} />;
}

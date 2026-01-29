import { Metadata } from "next";
import { Suspense } from "react";
import festivalData from "@/data/biffes_data.json";
import scheduleData from "@/data/schedule_data.json";
import { Film } from "@/types";
import RecommendationsClient from "./RecommendationsClient";

export const metadata: Metadata = {
  title: "Today's Best Films | BIFFes 2026",
  description: "Personalized film recommendations based on ratings - optimized daily schedule for Bengaluru International Film Festival 2026",
  openGraph: {
    title: "Today's Best Films | BIFFes 2026",
    description: "Personalized film recommendations based on ratings - optimized daily schedule for BIFFes 2026",
  },
};

function RecommendationsContent() {
  const films = festivalData.films as Film[];
  return <RecommendationsClient films={films} scheduleData={scheduleData} />;
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading recommendations...</p>
        </div>
      </div>
    }>
      <RecommendationsContent />
    </Suspense>
  );
}

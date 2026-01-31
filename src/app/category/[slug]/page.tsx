// Server Component - data is loaded at build time
import { notFound } from "next/navigation";
import festivalData from "@/data/biffes_data.json";
import scheduleData from "@/data/schedule_data.json";
import { Category, Film } from "@/types";
import CategoryClient from "./CategoryClient";

const categories = festivalData.categories as Category[];
const films = festivalData.films as Film[];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Category Not Found" };
  
  return {
    title: `${category.name} - BIFFes 2026`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  
  if (!category) {
    notFound();
  }
  
  const categoryFilms = films.filter((film) => film.categoryId === category.id);
  
  return <CategoryClient category={category} films={categoryFilms} scheduleData={scheduleData} />;
}

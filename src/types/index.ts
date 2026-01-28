// Film type definitions for BIFFes 2026

export interface Film {
  id: string;
  title: string;
  originalTitle?: string;
  kannadaTitle?: string;
  director: string;
  country: string;
  year: number;
  duration: number; // in minutes
  language: string;
  synopsis: string;
  posterUrl: string;
  posterUrlRemote?: string; // Remote fallback URL
  categoryId: string;
  subcategoryId?: string;
  isWorldPremiere?: boolean;
  isAsiaPremiere?: boolean;
  isIndiaPremiere?: boolean;
  // Crew info
  producer?: string;
  screenplay?: string;
  cinematography?: string;
  editor?: string;
  music?: string;
  sound?: string;
  cast?: string;
  // Awards
  awardsWon?: string;
  awardsNominated?: string;
  filmCourtesy?: string;
  // Ratings
  imdbRating?: string;
  rottenTomatoes?: string;
  metacritic?: string;
  letterboxdRating?: string;
  imdbId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  filmCount: number;
  coverImage?: string;
  color: string; // Tailwind color class for theming
  hasSubcategories: boolean;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string;
  filmCount: number;
}

export interface Venue {
  name: string;
  address: string;
  mapUrl: string;
}

export interface FestivalData {
  festival: {
    name: string;
    edition: number;
    year: number;
    dates: string;
    totalFilms: number;
    totalCountries: number;
    venues: Venue[];
  };
  categories: Category[];
  films: Film[];
}

export interface CategoryCardProps {
  category: Category;
  onClick: () => void;
}

export interface FilmCardProps {
  film: Film;
  onClick: () => void;
}

export interface FilmDrawerProps {
  film: Film | null;
  isOpen: boolean;
  onClose: () => void;
}

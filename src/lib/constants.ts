// Shared constants for BIFFes 2026
// Centralized to avoid duplication across components

/**
 * Title aliases: maps schedule titles to database titles
 * Used for matching films between schedule PDF and database
 */
export const TITLE_ALIASES: Record<string, string> = {
  // Spelling variations
  'GANARRAAG': 'GANARAAG',
  'VAMYA': 'VANYA',
  'ROOSTER': 'KOKORAS',
  'SIRAT': 'SIRĀT',
  'SARKEET': 'SIRĀT',
  'PHOLDIBEE': 'PHOUOIBEE (THE GODDESS OF PADDY)',
  'REPUBLIC OF PIPULPIPAS': 'REPUBLIC OF PIPOLIPINAS',
  "HOMTIVENTAI '25": "KONTINENTAL '25",
  'HOMTIVENTAI 25': "KONTINENTAL '25",
  'KONTINENTAL 25': "KONTINENTAL '25",
  'HY NAM INN': 'KY NAM INN',
  'CEMETARY OF CINEMA': 'THE CEMETERY OF CINEMA',
  'CEMETERY OF CINEMA': 'THE CEMETERY OF CINEMA',
  'THE MYSTERIOUS CASE OF THE FLAMINGO': 'THE MYSTERIOUS GAZE OF THE FLAMINGO',
  'SRIMANTHI DARSAIL PART 2': 'SRI JAGANNATHA DAASARU PART 2',
  'SRI JAGANNATHA DASKARU PART 2': 'SRI JAGANNATHA DAASARU PART 2',
  'SIR JAGANNATHA DASKARU PART 2': 'SRI JAGANNATHA DAASARU PART 2',

  // Title variations
  'KANTARA II (LEGEND CHAPTER-1)': 'KANTARA A LEGEND CHAPTER-1',
  'MATAPA A LEGEND CHAPTER-1': 'KANTARA A LEGEND CHAPTER-1',
  'K-POPPER': 'K POPPER',
  'MINO': 'NINO',
  'MOHAM': 'DESIRE',
  'FIRE FLY': 'FLAMES',
  'MOSQUITOS': 'MOSQUITOES',
  'ASAD AND BEAUTIFUL WORLD': 'A SAD AND BEAUTIFUL WORLD',
  'JHANE MOVES TO THE COUNTRY': 'JANINE MOVES TO THE COUNTRY',
  'THE SEASONS, TWO STRANGERS': 'TWO SEASONS, TWO STRANGERS',
  'ANMOL - LOVINGLY OURS': 'ANMOL- LOVINGLY OURS',
  'LA CHAPELLE': 'THE CHAPEL',
  'LA VIE EST BELLE': 'LIFE IS ROSY',
  'NATIONALITE IMMIGRE': 'NATIONALITY: IMMIGRANT',
  'NATIONALITÉ IMMIGRÉ': 'NATIONALITY: IMMIGRANT',
  "WERODON, L'ENFANT DU BON DIEU": "WENDEMI, THE GOOD LORD'S CHILD",
  'TETES BRULEES': 'TÊTES BRÛLÉES',
  'TÊTES BRULÉES': 'TÊTES BRÛLÉES',
  'SAMBA TRAORE': 'SAMBA TRAORÉ',
  'CALLE MALAGA': 'CALLE MÁLAGA',
  'BELEN': 'BELÉN',
  'NINO OF POPULAR ENTERTAINMENT': 'NINO',
  'THAAY! SAHEBA': 'THAAYI SAHEBA',
  'AGNIVATHWASI': 'AGNYATHAVASI',
  'SECRET OF A MOUNTAIN SERPENT': 'KOORMAVATARA',
  'WHAT DOES THE HARVEST SAY TO YOU': 'WHAT DOES THAT NATURE SAY TO YOU',
  'KANAL': 'CANAL',
  'PORTE BAGAGE': 'PORTE BAGAGE',
  'JEEVANN': 'JEVANN',
  'JEEV': 'JEVANN',

  // Kannada title aliases (local names to English DB titles)
  'BHOOTHALAM': 'HIDDEN TREMORS',
  'GHARDEV': 'FAMILY DEITY',
  'KANASEMBA KUDUREYAMERI': 'RIDING THE STALLION OF DREAM',
  'KANGBO ALOTI': 'THE LOST PATH',
  'KHALI PUTA': 'EMPTY PAGE',
  'MAHAKAVI': 'THE EPIC POET',
  'MRIGATRISHNA': 'MIRAGE',
  'SABAR BONDA': 'CACTUS PEARS',
  'VAGHACHIPANI': "TIGER'S POND",
  'VASTHUHARA': 'THE DISPOSSESSED',

  // Restored Classics film titles
  'DO BIGHA ZAMIN': 'TWO ACRES OF LAND',
  'DO BHEEGA ZAMIN': 'TWO ACRES OF LAND',
  'DO BEEGHA ZAMIN': 'TWO ACRES OF LAND',
  'CLEO FROM 5 TO 7': 'CLEO FROM 5 TO 7',
  'CLÉO FROM 5 TO 7': 'CLEO FROM 5 TO 7',
  'GEHEMU LAMAI': 'GEHENU LAMAI',
  'GEHENNU LAMAI': 'GEHENU LAMAI',
  'THE EARRINGS OF MADAME DE...': 'THE EARRINGS OF MADAM DE',
  'THE EARRINGS OF MADAME DE': 'THE EARRINGS OF MADAM DE',
  'PADUVAARAHALLI PANDAVARU': 'PADUVARAHALLI PANDAVARU',
  'PADUVARAHALLI PANDAVRU': 'PADUVARAHALLI PANDAVARU',
};

/**
 * Venue color schemes for consistent styling across components
 */
export const VENUE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  cinepolis: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  rajkumar: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  banashankari: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
  openair: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
};

/**
 * Venue icons for display
 */
export const VENUE_ICONS: Record<string, string> = {
  cinepolis: "🎬",
  rajkumar: "🏛️",
  banashankari: "🎭",
  openair: "🌙",
};

/**
 * Consistent venue display names
 */
export const VENUE_NAMES: Record<string, string> = {
  cinepolis: "Cinepolis @ LuLu Mall",
  rajkumar: "Dr. Rajkumar Bhavana",
  banashankari: "Suchitra Cinema",
  openair: "Open Air @ LuLu Mall",
};

/**
 * Short venue names for compact displays
 */
export const VENUE_NAMES_SHORT: Record<string, string> = {
  cinepolis: "LuLu",
  rajkumar: "Rajkumar",
  banashankari: "Suchitra",
  openair: "Open Air",
};

/**
 * Normalize a title for matching (remove punctuation, normalize whitespace)
 */
export function normalizeTitle(title: string): string {
  return title
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a film lookup map with all title variants
 */
export function buildFilmLookupMap<T extends { title: string }>(films: T[]): Map<string, T> {
  const map = new Map<string, T>();

  films.forEach(film => {
    const upper = film.title.toUpperCase();
    map.set(upper, film);

    // Also add normalized version
    const normalized = normalizeTitle(film.title);
    if (normalized !== upper) {
      map.set(normalized, film);
    }
  });

  // Add aliases pointing to the same films
  Object.entries(TITLE_ALIASES).forEach(([scheduleTitle, dbTitle]) => {
    const film = map.get(dbTitle.toUpperCase()) || map.get(normalizeTitle(dbTitle));
    if (film) {
      map.set(scheduleTitle.toUpperCase(), film);
      map.set(normalizeTitle(scheduleTitle), film);
    }
  });

  return map;
}

/**
 * Get all possible title variants for a film (for reverse lookup)
 */
export function getScheduleTitleVariants(dbTitle: string): string[] {
  const normalizedDbTitle = dbTitle.toUpperCase();
  const variants = new Set<string>([normalizedDbTitle]);

  // Find all schedule titles that map to this DB title
  for (const [scheduleTitle, mappedDbTitle] of Object.entries(TITLE_ALIASES)) {
    if (mappedDbTitle.toUpperCase() === normalizedDbTitle) {
      variants.add(scheduleTitle.toUpperCase());
    }
  }

  // Also add normalized version without accents for matching
  const normalized = normalizedDbTitle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  variants.add(normalized);

  return Array.from(variants);
}

/**
 * Find a film by schedule title using aliases
 */
export function findFilmByScheduleTitle<T extends { title: string }>(
  scheduleTitle: string,
  filmMap: Map<string, T>
): T | undefined {
  const upper = scheduleTitle.toUpperCase();
  if (filmMap.has(upper)) return filmMap.get(upper);

  // Try normalized version
  const normalized = normalizeTitle(scheduleTitle);
  if (filmMap.has(normalized)) return filmMap.get(normalized);

  return undefined;
}
